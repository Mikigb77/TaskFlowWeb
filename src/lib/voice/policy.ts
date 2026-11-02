import { z } from "zod";

export const DAY = 86_400_000;
export const VISITOR_LIMIT = 3;
export const NETWORK_LIMIT = 12;
export const MAX_DEVELOPER_WINDOW_MS = 60 * 60_000;
export const MAX_AUDIO_SECONDS = 60;
export const MAX_BODY_BYTES = 2_600_000;
// EUR millionths. Reserve before calling the model, including failed/unknown calls.
export const RESERVATION_MICROS = 20_000;
export const DEFAULT_BUDGET_MICROS = 25_000_000;
export const MAX_OUTPUT_TOKENS = 2048;

export class DemoError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public retryAt?: number,
  ) {
    super(message);
  }
}

// Only the owner CLI writes these fields. A URL flag, client timestamp, or
// browser testing code cannot grant access on its own.
export function developerWindowUntil(
  startedAt: unknown,
  until: unknown,
  now: number,
) {
  return typeof startedAt === "number" &&
    typeof until === "number" &&
    Number.isSafeInteger(startedAt) &&
    Number.isSafeInteger(until) &&
    startedAt <= now &&
    until > now &&
    until > startedAt &&
    until - startedAt <= MAX_DEVELOPER_WINDOW_MS
    ? until
    : null;
}

export function allowance(
  attempts: number[],
  now: number,
  limit = VISITOR_LIMIT,
) {
  // A transaction may retry after another request with a newer timestamp won.
  // Keep newer timestamps too: dropping them would reopen allowance in races.
  const active = attempts.filter((time) => time > now - DAY);
  return {
    active,
    remaining: Math.max(0, limit - active.length),
    resetAt: active.length ? Math.min(...active) + DAY : null,
  };
}

// A request that ends without a result gives its try back (WD30): remove one
// entry equal to that try's time. Unchanged when it isn't there (expired, or
// a developer window, which counts no try).
export function withoutTry(attempts: number[], at: unknown) {
  const index = typeof at === "number" ? attempts.indexOf(at) : -1;
  return index < 0
    ? attempts
    : [...attempts.slice(0, index), ...attempts.slice(index + 1)];
}

export function checkAdmission(
  visitor: number[],
  network: number[],
  charged: number,
  budget: number,
  now: number,
  developerTesting = false,
) {
  const user = allowance(visitor, now);
  const ip = allowance(network, now, NETWORK_LIMIT);
  if (!developerTesting && !user.remaining)
    throw new DemoError(
      429,
      "visitor_limit",
      "Your three tries are used. Your allowance returns tomorrow.",
      user.resetAt!,
    );
  if (!developerTesting && !ip.remaining)
    throw new DemoError(
      429,
      "network_limit",
      "This network has reached its demo allowance. Please try again tomorrow.",
      ip.resetAt!,
    );
  if (charged + RESERVATION_MICROS > budget)
    throw new DemoError(
      503,
      "budget_pause",
      "The live demo is off for now. Please try again later.",
    );
  return {
    visitor: developerTesting ? user.active : [...user.active, now],
    network: developerTesting ? ip.active : [...ip.active, now],
    charged: charged + RESERVATION_MICROS,
  };
}

// Gemini Flash-Lite global pricing: $0.30 input / $2.50 output per million.
// €1.25 per USD deliberately overestimates FX. This is a guard, not an invoice.
export function estimatedMicros(input: number, output: number) {
  if (
    !Number.isSafeInteger(input) ||
    !Number.isSafeInteger(output) ||
    input < 0 ||
    output < 0
  )
    return RESERVATION_MICROS;
  return Math.ceil((input * 0.3 + output * 2.5) * 1.25);
}

const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(value + "T00:00:00Z");
    return (
      Number.isFinite(parsed.valueOf()) &&
      parsed.toISOString().slice(0, 10) === value
    );
  });
export const draftSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    date: date.nullable(),
    time: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .nullable(),
    priority: z.enum(["low", "medium", "high"]),
    notes: z.string().max(1500),
    question: z.string().max(300).nullable(),
  })
  .strict()
  .refine((task) => !task.time || !!task.date, "A time needs a date");
export const resultSchema = z
  .object({
    transcript: z.string().max(6000),
    tasks: z.array(draftSchema).max(6),
  })
  .strict();
export type Draft = z.infer<typeof draftSchema>;
export type DraftResult = z.infer<typeof resultSchema>;

export function validateWav(bytes: Buffer) {
  if (
    bytes.length < 44 ||
    bytes.toString("ascii", 0, 4) !== "RIFF" ||
    bytes.toString("ascii", 8, 12) !== "WAVE" ||
    bytes.readUInt32LE(4) + 8 !== bytes.length
  ) {
    throw new DemoError(
      400,
      "invalid_audio",
      "Please record your audio again.",
    );
  }
  let cursor = 12,
    format = false,
    dataBytes = 0;
  while (cursor + 8 <= bytes.length) {
    const type = bytes.toString("ascii", cursor, cursor + 4);
    const length = bytes.readUInt32LE(cursor + 4);
    const start = cursor + 8;
    if (start + length > bytes.length)
      throw new DemoError(400, "invalid_audio", "The recording is incomplete.");
    if (type === "fmt ") {
      if (
        format ||
        length !== 16 ||
        bytes.readUInt16LE(start) !== 1 ||
        bytes.readUInt16LE(start + 2) !== 1 ||
        bytes.readUInt32LE(start + 4) !== 16000 ||
        bytes.readUInt32LE(start + 8) !== 32000 ||
        bytes.readUInt16LE(start + 12) !== 2 ||
        bytes.readUInt16LE(start + 14) !== 16
      ) {
        throw new DemoError(
          400,
          "invalid_audio",
          "Please use the website recorder (mono, 16 kHz PCM).",
        );
      }
      format = true;
    } else if (type === "data") {
      if (dataBytes || length % 2)
        throw new DemoError(400, "invalid_audio", "The recording is invalid.");
      dataBytes = length;
    } else
      throw new DemoError(
        400,
        "invalid_audio",
        "The recording contains an unsupported chunk.",
      );
    cursor = start + length + (length % 2);
  }
  const seconds = dataBytes / 32000;
  if (
    !format ||
    cursor !== bytes.length ||
    seconds < 0.3 ||
    seconds > MAX_AUDIO_SECONDS
  )
    throw new DemoError(
      400,
      "audio_length",
      "Record between one and 60 seconds.",
    );
  return seconds;
}
