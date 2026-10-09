import { Firestore, Timestamp } from "@google-cloud/firestore";
import {
  allowance,
  checkAdmission,
  DAY,
  DEFAULT_BUDGET_MICROS,
  DemoError,
  DraftResult,
  RESERVATION_MICROS,
} from "./policy";
import { required, seal, unseal } from "./security";

let firestore: Firestore;
function db() {
  return (firestore ||= new Firestore({
    projectId: required("GOOGLE_CLOUD_PROJECT"),
    databaseId: process.env.VOICE_DATABASE || "(default)",
  }));
}
export function budgetMicros() {
  const amount =
    process.env.VOICE_MONTHLY_BUDGET_EUR === undefined
      ? 25
      : Number(process.env.VOICE_MONTHLY_BUDGET_EUR);
  if (!Number.isFinite(amount) || amount < 0 || amount > 25)
    throw new DemoError(
      503,
      "budget_config",
      "The live demo is temporarily unavailable.",
    );
  return Math.min(DEFAULT_BUDGET_MICROS, Math.round(amount * 1_000_000));
}
function visitorRef(id: string) {
  return db().collection("voiceVisitors").doc(id);
}
function jobRef(id: string, requestId: string) {
  return db().collection("voiceJobs").doc(`${id}_${requestId}`);
}
export async function usage(id: string) {
  const doc = await visitorRef(id).get();
  return allowance(doc.data()?.attempts || [], Date.now());
}
export async function cachedJob(id: string, requestId: string) {
  const job = await jobRef(id, requestId).get();
  if (!job.exists) return null;
  const data = job.data()!;
  if (data.expiresAt.toMillis() < Date.now())
    throw new DemoError(
      409,
      "expired",
      "This request has expired. Start a new draft.",
    );
  if (data.state === "complete")
    return unseal(data.result, required("VOICE_APP_SECRET")) as DraftResult;
  if (data.state === "processing")
    throw new DemoError(
      409,
      "processing",
      "Your draft is still processing. Retry in a moment; this will not use another try.",
    );
  throw new DemoError(
    422,
    "previous_failure",
    "This attempt could not produce a draft. Start a new draft to try again.",
  );
}
export async function admit(
  id: string,
  network: string,
  requestId: string,
  kind: "text" | "audio",
  seconds: number,
) {
  const now = Date.now(),
    month = new Date(now).toISOString().slice(0, 7);
  const user = visitorRef(id),
    ip = db().collection("voiceNetworks").doc(network),
    job = jobRef(id, requestId),
    meter = db().collection("voiceMonths").doc(month);
  await db().runTransaction(async (tx) => {
    const [j, u, n, m] = await tx.getAll(job, user, ip, meter);
    if (j.exists)
      throw new DemoError(
        409,
        "processing",
        "This request already exists. Retry to retrieve the result without using another try.",
      );
    const stats = m.data() || {};
    const next = checkAdmission(
      u.data()?.attempts || [],
      n.data()?.attempts || [],
      stats.chargedMicros || 0,
      budgetMicros(),
      now,
    );
    const expiresAt = Timestamp.fromMillis(now + 2 * DAY);
    tx.set(user, { attempts: next.visitor, expiresAt });
    tx.set(ip, { attempts: next.network, expiresAt });
    tx.create(job, {
      state: "processing",
      month,
      createdAt: Timestamp.fromMillis(now),
      expiresAt: Timestamp.fromMillis(now + DAY),
    });
    tx.set(meter, {
      ...stats,
      chargedMicros: next.charged,
      reservedMicros: (stats.reservedMicros || 0) + RESERVATION_MICROS,
      requests: (stats.requests || 0) + 1,
      [kind + "Requests"]: (stats[kind + "Requests"] || 0) + 1,
      audioSeconds: (stats.audioSeconds || 0) + seconds,
      budgetMicros: budgetMicros(),
      updatedAt: Timestamp.fromMillis(now),
    });
  });
  return month;
}
export async function finish(
  id: string,
  requestId: string,
  month: string,
  outcome: {
    result?: DraftResult;
    cost?: number;
    input?: number;
    output?: number;
  },
) {
  const job = jobRef(id, requestId),
    meter = db().collection("voiceMonths").doc(month);
  await db().runTransaction(async (tx) => {
    const [j, m] = await tx.getAll(job, meter);
    if (j.data()?.state !== "processing") return;
    const stats = m.data()!;
    // Unknown provider failures keep the full reservation charged. Never retry AI automatically.
    const cost = outcome.cost ?? RESERVATION_MICROS;
    tx.update(job, {
      state: outcome.result ? "complete" : "failed",
      ...(outcome.result
        ? { result: seal(outcome.result, required("VOICE_APP_SECRET")) }
        : {}),
    });
    tx.update(meter, {
      chargedMicros: stats.chargedMicros - RESERVATION_MICROS + cost,
      reservedMicros: Math.max(0, stats.reservedMicros - RESERVATION_MICROS),
      succeeded: (stats.succeeded || 0) + Number(!!outcome.result),
      failed: (stats.failed || 0) + Number(!outcome.result),
      taskCount: (stats.taskCount || 0) + (outcome.result?.tasks.length || 0),
      inputTokens: (stats.inputTokens || 0) + (outcome.input || 0),
      outputTokens: (stats.outputTokens || 0) + (outcome.output || 0),
      updatedAt: Timestamp.now(),
    });
  });
}
