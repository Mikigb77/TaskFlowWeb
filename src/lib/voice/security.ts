import {
  createHmac,
  timingSafeEqual,
  randomUUID,
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from "node:crypto";
import { DemoError, MAX_BODY_BYTES } from "./policy";

export function required(name: string) {
  const value = process.env[name];
  if (!value)
    throw new DemoError(
      503,
      "not_ready",
      "The live demo is not available yet. Try the sample walkthrough below.",
    );
  return value;
}
export function equal(a: string, b: string) {
  const left = Buffer.from(a),
    right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
export function signature(value: string, key: string) {
  return createHmac("sha256", key).update(value).digest("base64url");
}
export function signedSession(id: string, key: string) {
  return `${id}.${signature(id, key)}`;
}
export function readSession(value: string | undefined, key: string) {
  const [id, mac, extra] = (value || "").split(".");
  return !extra &&
    /^[a-f0-9-]{36}$/.test(id || "") &&
    !!mac &&
    equal(signature(id, key), mac)
    ? id
    : null;
}
export function getIdentity(request: Request, create = false) {
  const key = required("VOICE_APP_SECRET");
  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("__Host-tf-demo="))
    ?.slice(15);
  const existing = readSession(cookie, key);
  if (!existing && !create)
    throw new DemoError(
      401,
      "session_required",
      "Please reopen the live demo and try again.",
    );
  const id = existing || randomUUID();
  const ip = requiredIp(request);
  // Store keyed hashes only. A network allowance also covers visitors clearing cookies.
  const network = signature(ip, key);
  return {
    id,
    network,
    cookie: existing
      ? null
      : `__Host-tf-demo=${signedSession(id, key)}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=2592000`,
  };
}
function requiredIp(request: Request) {
  const ip = request.headers.get("x-tf-client-ip");
  if (!ip || !/^[a-fA-F0-9:.]{3,64}$/.test(ip))
    throw new DemoError(
      403,
      "edge_required",
      "Open this demo at taskflow.garbar.tech.",
    );
  // A /64 prevents trivial IPv6 privacy-address cycling, while allowing shared networks.
  if (ip.includes(":")) {
    const [left, right = ""] = ip.split("::");
    const a = left ? left.split(":") : [],
      b = right ? right.split(":") : [];
    const expanded = [
      ...a,
      ...Array(Math.max(0, 8 - a.length - b.length)).fill("0"),
      ...b,
    ];
    return (
      expanded
        .slice(0, 4)
        .map((part) => parseInt(part, 16).toString(16))
        .join(":") + "::/64"
    );
  }
  return ip;
}
export function checkRequest(request: Request, mutation = false) {
  if (process.env.VOICE_DEMO_ENABLED !== "true")
    throw new DemoError(
      503,
      "paused",
      "The live demo is taking a break. The sample walkthrough is still available.",
    );
  if (
    !equal(
      request.headers.get("x-tf-edge-secret") || "",
      required("VOICE_EDGE_SECRET"),
    )
  )
    throw new DemoError(
      403,
      "edge_required",
      "Open this demo at taskflow.garbar.tech.",
    );
  if (
    mutation &&
    request.headers.get("origin") !== required("VOICE_PUBLIC_ORIGIN")
  )
    throw new DemoError(
      403,
      "origin",
      "Please submit your recording from the TaskFlow website.",
    );
}
export async function readLimitedBody(request: Request) {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES)
    throw new DemoError(
      413,
      "too_large",
      "This recording is too large. Keep it under 60 seconds.",
    );
  const reader = request.body?.getReader();
  if (!reader)
    throw new DemoError(400, "empty", "Add a recording or some text first.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new DemoError(413, "too_large", "This recording is too large.");
      }
      chunks.push(next.value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks);
}
export function seal(value: unknown, secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(
    "aes-256-gcm",
    createHash("sha256").update(secret).digest(),
    iv,
  );
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString(
    "base64",
  );
}
export function unseal(value: string, secret: string): unknown {
  const data = Buffer.from(value, "base64");
  const cipher = createDecipheriv(
    "aes-256-gcm",
    createHash("sha256").update(secret).digest(),
    data.subarray(0, 12),
  );
  cipher.setAuthTag(data.subarray(12, 28));
  return JSON.parse(
    Buffer.concat([cipher.update(data.subarray(28)), cipher.final()]).toString(
      "utf8",
    ),
  );
}
export function json(value: unknown, status = 200, cookie?: string | null) {
  const headers: Record<string, string> = {
    "Cache-Control": "no-store",
    "Content-Type": "application/json",
    "X-Content-Type-Options": "nosniff",
  };
  if (cookie) headers["Set-Cookie"] = cookie;
  return new Response(JSON.stringify(value), { status, headers });
}
export function failure(error: unknown) {
  if (error instanceof DemoError)
    return json(
      { error: error.message, code: error.code, retryAt: error.retryAt },
      error.status,
    );
  // Never log the request, transcript, tokens, headers, or SDK error payload.
  console.error(
    "voice_demo_request_failed",
    error instanceof Error ? error.name : "unknown",
  );
  return json(
    {
      error: "The live demo could not finish. Please try again shortly.",
      code: "unavailable",
    },
    503,
  );
}
