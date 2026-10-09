import { z } from "zod";
import {
  checkRequest,
  failure,
  getIdentity,
  json,
  readLimitedBody,
} from "../../../../lib/voice/security";
import { admit, cachedJob, finish, usage } from "../../../../lib/voice/store";
import { generateDraft } from "../../../../lib/voice/model";
import { DemoError, validateWav } from "../../../../lib/voice/policy";
import { verifyChallenge } from "../../../../lib/voice/challenge";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 55;

const payload = z
  .object({
    text: z.string().trim().min(3).max(1500).optional(),
    audio: z
      .string()
      .max(2_560_100)
      .regex(/^[A-Za-z0-9+/]+={0,2}$/)
      .optional(),
    timezone: z.string().min(1).max(80),
  })
  .strict()
  .refine((value) => !!value.text !== !!value.audio);
export async function POST(request: Request) {
  let admitted: { id: string; requestId: string; month: string } | undefined;
  try {
    checkRequest(request, true);
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      throw new DemoError(
        415,
        "content_type",
        "Send a recording or text using the demo form.",
      );
    const identity = getIdentity(request);
    const requestId = request.headers.get("x-request-id") || "";
    if (
      !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(
        requestId,
      )
    )
      throw new DemoError(400, "request_id", "Please start a new draft.");
    const cached = await cachedJob(identity.id, requestId);
    if (cached) {
      const { remaining, resetAt } = await usage(identity.id);
      return json({ ...cached, remaining, resetAt });
    }
    await verifyChallenge(request);
    const bytes = await readLimitedBody(request);
    let body: unknown;
    try {
      body = JSON.parse(bytes.toString("utf8"));
    } catch {
      throw new DemoError(
        400,
        "payload",
        "The recording could not be read. Please try again.",
      );
    }
    const parsed = payload.safeParse(body);
    if (!parsed.success)
      throw new DemoError(
        400,
        "payload",
        "Add up to 1,500 characters or a recording of up to 60 seconds.",
      );
    const { text, audio, timezone } = parsed.data;
    try {
      new Intl.DateTimeFormat("en", { timeZone: timezone });
    } catch {
      throw new DemoError(400, "timezone", "Your timezone could not be read.");
    }
    const wav = audio ? Buffer.from(audio, "base64") : undefined;
    const seconds = wav ? validateWav(wav) : 0;
    const month = await admit(
      identity.id,
      identity.network,
      requestId,
      wav ? "audio" : "text",
      seconds,
    );
    admitted = { id: identity.id, requestId, month };
    const result = await generateDraft({ text, audio: wav, timezone });
    await finish(identity.id, requestId, month, result);
    admitted = undefined;
    const { remaining, resetAt } = await usage(identity.id);
    return json({ ...result.result, remaining, resetAt });
  } catch (error) {
    if (admitted) {
      try {
        await finish(admitted.id, admitted.requestId, admitted.month, {});
      } catch {
        /* The durable reservation remains charged if settlement is unavailable. */
      }
    }
    return failure(error);
  }
}
