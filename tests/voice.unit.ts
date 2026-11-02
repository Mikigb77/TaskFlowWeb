import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  allowance,
  checkAdmission,
  DAY,
  DEFAULT_BUDGET_MICROS,
  DemoError,
  developerWindowUntil,
  estimatedMicros,
  RESERVATION_MICROS,
  resultSchema,
  validateWav,
  withoutTry,
} from "../src/lib/voice/policy";
import {
  checkRequest,
  getIdentity,
  readLimitedBody,
  readSession,
  seal,
  signedSession,
  unseal,
} from "../src/lib/voice/security";
import edge from "../edge/worker";

test("developer access expires exactly on time and rejects invalid or excessive grants", () => {
  const now = Date.now(),
    until = now + 30 * 60_000;
  assert.equal(developerWindowUntil(now, until, now), until);
  assert.equal(developerWindowUntil(now, until, until - 1), until);
  assert.equal(developerWindowUntil(now, until, until), null);
  assert.equal(developerWindowUntil(now, until, until + 1), null);
  for (const [start, end] of [
    [undefined, until],
    [now, Infinity],
    [now + 1, until],
    [now, now + 61 * 60_000],
    [0, 0],
    [String(now), until],
  ]) {
    assert.equal(developerWindowUntil(start, end, now), null);
  }
  const visitor = Array(3).fill(now - 1),
    network = Array(12).fill(now - 1);
  const admitted = checkAdmission(
    visitor,
    network,
    0,
    DEFAULT_BUDGET_MICROS,
    now,
    true,
  );
  assert.deepEqual(admitted.visitor, visitor);
  assert.deepEqual(admitted.network, network);
  assert.equal(admitted.charged, RESERVATION_MICROS);
  assert.throws(
    () =>
      checkAdmission(
        visitor,
        network,
        DEFAULT_BUDGET_MICROS,
        DEFAULT_BUDGET_MICROS,
        now,
        true,
      ),
    (e) => e instanceof DemoError && e.code === "budget_pause",
  );
});

test("rolling 24-hour limits survive calendar boundaries and expire individually", () => {
  const now = Date.UTC(2026, 9, 10, 0, 1);
  assert.equal(
    allowance([now - DAY, now - 10000, now - 20000], now).remaining,
    1,
  );
  assert.equal(allowance([now + 2, now + 1, now], now).remaining, 0);
  assert.throws(
    () =>
      checkAdmission(
        [now - 100, now - 200, now - 300],
        [],
        0,
        DEFAULT_BUDGET_MICROS,
        now,
      ),
    (e) => e instanceof DemoError && e.code === "visitor_limit",
  );
  assert.throws(
    () =>
      checkAdmission(
        [],
        Array(12).fill(now - 10),
        0,
        DEFAULT_BUDGET_MICROS,
        now,
      ),
    (e) => e instanceof DemoError && e.code === "network_limit",
  );
});
test("monthly guard reserves the worst-case call and has no daily global submission limit", () => {
  assert.equal(
    checkAdmission(
      [],
      [],
      DEFAULT_BUDGET_MICROS - RESERVATION_MICROS,
      DEFAULT_BUDGET_MICROS,
      Date.now(),
    ).charged,
    DEFAULT_BUDGET_MICROS,
  );
  assert.throws(() =>
    checkAdmission(
      [],
      [],
      DEFAULT_BUDGET_MICROS - RESERVATION_MICROS + 1,
      DEFAULT_BUDGET_MICROS,
      Date.now(),
    ),
  );
  assert.equal(
    checkAdmission([], [], 0, DEFAULT_BUDGET_MICROS, Date.now()).visitor.length,
    1,
  );
  assert.ok(estimatedMicros(20000, 2048) < RESERVATION_MICROS);
  assert.equal(estimatedMicros(-1, 0), RESERVATION_MICROS);
});
test("visitor cookies resist edits and encrypted retries resist tampering", () => {
  const id = randomUUID(),
    key = "test-only-key";
  assert.equal(readSession(signedSession(id, key), key), id);
  assert.equal(readSession(signedSession(id, key) + "x", key), null);
  assert.equal(readSession(signedSession(id, "other-key"), key), null);
  const encrypted = seal({ transcript: "private text" }, key);
  assert.ok(!encrypted.includes("private"));
  assert.deepEqual(unseal(encrypted, key), { transcript: "private text" });
  assert.throws(() => unseal(encrypted, "other-key"));
});
test("direct-origin and cross-origin calls fail before reading content", () => {
  process.env.VOICE_DEMO_ENABLED = "true";
  process.env.VOICE_EDGE_SECRET = "test-edge-key";
  process.env.VOICE_PUBLIC_ORIGIN = "https://taskflow.garbar.tech";
  process.env.VOICE_APP_SECRET = "test-app-key";
  assert.throws(() =>
    checkRequest(new Request("https://origin.run.app/api/voice/draft/"), true),
  );
  assert.throws(() =>
    checkRequest(
      new Request("https://origin.run.app/api/voice/draft/", {
        headers: {
          "x-tf-edge-secret": "test-edge-key",
          origin: "https://attacker.example",
        },
      }),
      true,
    ),
  );
  const req = new Request("https://origin.run.app/api/voice/status/", {
    headers: {
      "x-tf-edge-secret": "test-edge-key",
      "x-tf-client-ip": "2001:db8:1234:1::3",
    },
  });
  const identity = getIdentity(req, true);
  const next = new Request(req, {
    headers: { ...Object.fromEntries(req.headers), cookie: identity.cookie! },
  });
  assert.equal(getIdentity(next).id, identity.id);
  const otherAddress = new Request(req, {
    headers: {
      ...Object.fromEntries(req.headers),
      "x-tf-client-ip": "2001:db8:1234:1::4",
    },
  });
  assert.equal(getIdentity(otherAddress, true).network, identity.network);
});
function wav(seconds: number) {
  const b = Buffer.alloc(44 + seconds * 32000);
  b.write("RIFF");
  b.writeUInt32LE(b.length - 8, 4);
  b.write("WAVEfmt ", 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(16000, 24);
  b.writeUInt32LE(32000, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write("data", 36);
  b.writeUInt32LE(b.length - 44, 40);
  return b;
}
test("audio duration is measured from PCM bytes, never client metadata", () => {
  assert.equal(validateWav(wav(60)), 60);
  assert.throws(() => validateWav(wav(61)));
  assert.throws(() => validateWav(wav(0.1)));
  const spoofed = wav(60);
  spoofed.writeUInt32LE(32000, 40);
  assert.throws(() => validateWav(spoofed));
  const wrongRate = wav(1);
  wrongRate.writeUInt32LE(48000, 24);
  assert.throws(() => validateWav(wrongRate));
});
test("body cap catches streaming uploads without trusting Content-Length", async () => {
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(2_600_001));
      controller.close();
    },
  });
  await assert.rejects(
    readLimitedBody(
      new Request("https://example.com", {
        method: "POST",
        body,
        duplex: "half",
      } as RequestInit),
    ),
    (e) => e instanceof DemoError && e.status === 413,
  );
});
test("AI result validation allows unscheduled tasks and rejects malformed dates/actions", () => {
  const task = {
    title: "Buy coffee",
    date: null,
    time: null,
    notes: "",
    priority: "low",
    question: null,
  };
  assert.ok(
    resultSchema.safeParse({ transcript: "Buy coffee", tasks: [task] }).success,
  );
  assert.ok(
    !resultSchema.safeParse({
      transcript: "x",
      tasks: [{ ...task, date: "2026-02-30" }],
    }).success,
  );
  assert.ok(
    !resultSchema.safeParse({
      transcript: "x",
      tasks: [{ ...task, time: "14:00" }],
    }).success,
  );
  assert.ok(
    !resultSchema.safeParse({
      transcript: "x",
      tasks: [{ ...task, execute: "delete everything" }],
    }).success,
  );
});
test("edge blocks burst, oversized and cross-origin uploads without contacting origin", async () => {
  const env = {
    PUBLIC_HOST: "taskflow.garbar.tech",
    ORIGIN: "https://origin.run.app",
    VOICE_EDGE_SECRET: "key",
    API_LIMIT: { limit: async () => ({ success: true }) },
    SUBMIT_LIMIT: { limit: async () => ({ success: true }) },
  };
  const make = (extra: Record<string, string>) =>
    new Request("https://taskflow.garbar.tech/api/voice/draft/", {
      method: "POST",
      headers: {
        origin: "https://taskflow.garbar.tech",
        "cf-connecting-ip": "192.0.2.4",
        "content-length": "2",
        "x-turnstile-token": "test",
        ...extra,
      },
      body: "{}",
    });
  assert.equal(
    (await edge.fetch(make({ origin: "https://attacker.example" }), env))
      .status,
    403,
  );
  assert.equal(
    (await edge.fetch(make({ "content-length": "99999999" }), env)).status,
    413,
  );
  assert.equal(
    (
      await edge.fetch(make({}), {
        ...env,
        API_LIMIT: { limit: async () => ({ success: false }) },
      })
    ).status,
    429,
  );
});

// ---- Run 2026-10-28-site: WP263 (WEB-1315) ----
test("WEB-1315: withoutTry removes exactly one entry equal to the time, keeps the others in order, and is unchanged when the time isn't there", () => {
  const attempts = [500, 100, 300, 100, 200];
  assert.deepEqual(withoutTry(attempts, 100), [500, 300, 100, 200]);
  assert.deepEqual(withoutTry(attempts, 200), [500, 100, 300, 100]);
  assert.deepEqual(withoutTry(attempts, 500), [100, 300, 100, 200]);
  assert.deepEqual(attempts, [500, 100, 300, 100, 200], "the input list is not changed");
  assert.deepEqual(withoutTry(attempts, 400), attempts);
  assert.deepEqual(withoutTry(attempts, undefined), attempts, "no try recorded (a developer window)");
  assert.deepEqual(withoutTry([], 100), []);
  assert.deepEqual(withoutTry([100], 100), []);
});
