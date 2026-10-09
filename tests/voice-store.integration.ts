import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Firestore } from "@google-cloud/firestore";
import { admit, cachedJob, finish, usage } from "../src/lib/voice/store";
import { RESERVATION_MICROS, DemoError } from "../src/lib/voice/policy";

// Deliberately refuses real databases: concurrency tests must never spend quota
// or delete customer data in a production project.
if (!process.env.FIRESTORE_EMULATOR_HOST)
  throw new Error(
    "Start the Firestore emulator and set FIRESTORE_EMULATOR_HOST before this test.",
  );
process.env.GOOGLE_CLOUD_PROJECT = `taskflow-test-${randomUUID().slice(0, 8)}`;
process.env.VOICE_APP_SECRET = "integration-test-only-encryption-key";
process.env.VOICE_MONTHLY_BUDGET_EUR = "25";
const db = new Firestore({ projectId: process.env.GOOGLE_CLOUD_PROJECT });

test("simultaneous requests cannot overspend visitor allowance; retries do not charge twice", async () => {
  const visitor = randomUUID(),
    network = randomUUID(),
    ids = Array.from({ length: 6 }, () => randomUUID());
  const attempts = await Promise.allSettled(
    ids.map((id) => admit(visitor, network, id, "text", 0)),
  );
  assert.equal(
    attempts.filter((value) => value.status === "fulfilled").length,
    3,
  );
  assert.equal((await usage(visitor)).remaining, 0);
  const index = attempts.findIndex((value) => value.status === "fulfilled");
  const month = (attempts[index] as PromiseFulfilledResult<string>).value;
  const result = {
    transcript: "Buy coffee",
    tasks: [
      {
        title: "Buy coffee",
        date: null,
        time: null,
        priority: "low" as const,
        notes: "",
        question: null,
      },
    ],
  };
  await finish(visitor, ids[index], month, {
    result,
    cost: 100,
    input: 40,
    output: 20,
  });
  await finish(visitor, ids[index], month, {
    result,
    cost: 100,
    input: 40,
    output: 20,
  });
  assert.deepEqual(await cachedJob(visitor, ids[index]), result);
  await assert.rejects(admit(visitor, network, ids[index], "text", 0));
  const stats = (await db.collection("voiceMonths").doc(month).get()).data()!;
  assert.equal(stats.requests, 3);
  assert.equal(stats.succeeded, 1);
  assert.equal(stats.chargedMicros, 2 * RESERVATION_MICROS + 100);
  const job = (
    await db.collection("voiceJobs").doc(`${visitor}_${ids[index]}`).get()
  ).data()!;
  assert.ok(!JSON.stringify(job).includes("Buy coffee"));
});

test("changing visitor cookies does not reset a network allowance", async () => {
  const network = randomUUID();
  for (let i = 0; i < 12; i++)
    await admit(randomUUID(), network, randomUUID(), "audio", 5);
  await assert.rejects(
    admit(randomUUID(), network, randomUUID(), "audio", 5),
    (e) => e instanceof DemoError && e.code === "network_limit",
  );
});

test("concurrent visitors stop at the remaining monthly reservation", async () => {
  const month = new Date().toISOString().slice(0, 7);
  await db
    .collection("voiceMonths")
    .doc(month)
    .set({
      chargedMicros: 25_000_000 - RESERVATION_MICROS,
      reservedMicros: 0,
      requests: 0,
    });
  const result = await Promise.allSettled(
    Array.from({ length: 4 }, () =>
      admit(randomUUID(), randomUUID(), randomUUID(), "text", 0),
    ),
  );
  assert.equal(result.filter((item) => item.status === "fulfilled").length, 1);
  assert.equal(
    (await db.collection("voiceMonths").doc(month).get()).data()?.chargedMicros,
    25_000_000,
  );
});
