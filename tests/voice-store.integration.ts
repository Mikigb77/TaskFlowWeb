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

test("developer access is browser-specific, preserves public allowance and expires or revokes", async () => {
  const visitor = randomUUID(),
    network = randomUUID(),
    now = Date.now();
  const until = now + 30 * 60_000;
  await db
    .collection("voiceVisitors")
    .doc(visitor)
    .set({
      attempts: Array(3).fill(now - 1000),
      developerStartedAt: now,
      developerUntil: until,
    });
  await db
    .collection("voiceNetworks")
    .doc(network)
    .set({ attempts: Array(12).fill(now - 1000) });
  assert.equal((await usage(visitor)).testingUntil, until);
  const month = new Date().toISOString().slice(0, 7);
  const before = (await db.collection("voiceMonths").doc(month).get()).data()!;
  await Promise.all(
    Array.from({ length: 4 }, () =>
      admit(visitor, network, randomUUID(), "audio", 5),
    ),
  );
  const after = (await db.collection("voiceMonths").doc(month).get()).data()!;
  assert.equal(
    after.chargedMicros - before.chargedMicros,
    4 * RESERVATION_MICROS,
  );
  assert.equal(after.developerRequests - (before.developerRequests || 0), 4);
  assert.equal((await usage(visitor)).remaining, 0);
  assert.equal((await usage(visitor)).testingUntil, until);
  assert.equal(
    (await db.collection("voiceVisitors").doc(visitor).get()).data()?.attempts
      .length,
    3,
  );
  assert.equal(
    (await db.collection("voiceNetworks").doc(network).get()).data()?.attempts
      .length,
    12,
  );
  await assert.rejects(
    admit(randomUUID(), network, randomUUID(), "text", 0),
    (e) => e instanceof DemoError && e.code === "network_limit",
  );
  await db
    .collection("voiceVisitors")
    .doc(visitor)
    .update({ developerUntil: Date.now() - 1 });
  assert.equal((await usage(visitor)).testingUntil, null);
  await assert.rejects(
    admit(visitor, network, randomUUID(), "text", 0),
    (e) => e instanceof DemoError && e.code === "visitor_limit",
  );
  await db
    .collection("voiceVisitors")
    .doc(visitor)
    .update({ developerStartedAt: 0, developerUntil: 0 });
  await assert.rejects(
    admit(visitor, network, randomUUID(), "text", 0),
    (e) => e instanceof DemoError && e.code === "visitor_limit",
  );
});

test("concurrent public and developer requests stop at the remaining monthly reservation", async () => {
  const month = new Date().toISOString().slice(0, 7);
  for (const testing of [false, true]) {
    await db
      .collection("voiceMonths")
      .doc(month)
      .set({
        chargedMicros: 25_000_000 - RESERVATION_MICROS,
        reservedMicros: 0,
        requests: 0,
      });
    const visitors = Array.from({ length: 4 }, () => randomUUID());
    if (testing) {
      const now = Date.now();
      await Promise.all(
        visitors.map((id) =>
          db
            .collection("voiceVisitors")
            .doc(id)
            .set({
              developerStartedAt: now,
              developerUntil: now + 30 * 60_000,
            }),
        ),
      );
    }
    const result = await Promise.allSettled(
      visitors.map((id) => admit(id, randomUUID(), randomUUID(), "text", 0)),
    );
    assert.equal(
      result.filter((item) => item.status === "fulfilled").length,
      1,
    );
    assert.equal(
      (await db.collection("voiceMonths").doc(month).get()).data()
        ?.chargedMicros,
      25_000_000,
    );
  }
});

// ---- Run 2026-10-28-site: WP263 (WEB-1315) ----
// WD30: a demo try that fails on our side is given back; a result with no task still counts.
// The month's document is shared by every test here: each test starts it afresh.
const thisMonth = () => new Date().toISOString().slice(0, 7);
async function freshMonth() {
  const month = thisMonth();
  await db.collection("voiceMonths").doc(month).delete();
  return month;
}
const monthStats = async (month: string) =>
  (await db.collection("voiceMonths").doc(month).get()).data()!;
const visitorAttempts = async (visitor: string) =>
  ((await db.collection("voiceVisitors").doc(visitor).get()).data()?.attempts ?? []) as number[];
const networkAttempts = async (network: string) =>
  ((await db.collection("voiceNetworks").doc(network).get()).data()?.attempts ?? []) as number[];
const noTaskResult = { transcript: "Hmm, let me think.", tasks: [] };

test("WEB-1315: a request that ends without a result gives the visitor's try back; the network's count, the month's request and its charged reservation stay", async () => {
  const month = await freshMonth();
  const visitor = randomUUID(),
    network = randomUUID(),
    request = randomUUID();
  const before = Date.now();
  assert.equal(await admit(visitor, network, request, "text", 0), month);
  const after = Date.now();
  assert.equal((await usage(visitor)).remaining, 2, "the try is held while the AI is called");
  await finish(visitor, request, month, {});
  const access = await usage(visitor);
  assert.equal(access.remaining, 3);
  assert.equal(access.resetAt, null);
  assert.deepEqual(await visitorAttempts(visitor), []);
  const net = await networkAttempts(network);
  assert.equal(net.length, 1, "the network still holds that attempt");
  assert.ok(net[0] >= before && net[0] <= after, "the network's attempt is the one admitted");
  const stats = await monthStats(month);
  assert.equal(stats.requests, 1);
  assert.equal(stats.failed, 1);
  assert.equal(stats.succeeded || 0, 0);
  assert.equal(stats.chargedMicros, RESERVATION_MICROS);
  assert.equal(stats.reservedMicros, 0);
});

test("WEB-1315: a result with no task still uses the try", async () => {
  const month = await freshMonth();
  const visitor = randomUUID(),
    request = randomUUID();
  await admit(visitor, randomUUID(), request, "text", 0);
  await finish(visitor, request, month, { result: noTaskResult, cost: 100, input: 10, output: 5 });
  assert.equal((await usage(visitor)).remaining, 2);
  assert.equal((await visitorAttempts(visitor)).length, 1);
  assert.deepEqual(await cachedJob(visitor, request), noTaskResult);
  const stats = await monthStats(month);
  assert.equal(stats.succeeded, 1);
  assert.equal(stats.failed || 0, 0);
});

test("WEB-1315: settling one failed request twice gives one try back, not two", async () => {
  const month = await freshMonth();
  const visitor = randomUUID(),
    request = randomUUID();
  await admit(visitor, randomUUID(), request, "text", 0);
  const [at] = await visitorAttempts(visitor);
  // A second try in the same millisecond: a second give-back would find it and remove it.
  await db.collection("voiceVisitors").doc(visitor).update({ attempts: [at, at] });
  assert.equal((await usage(visitor)).remaining, 1);
  await finish(visitor, request, month, {});
  await finish(visitor, request, month, {});
  assert.deepEqual(await visitorAttempts(visitor), [at]);
  assert.equal((await usage(visitor)).remaining, 2);
  const stats = await monthStats(month);
  assert.equal(stats.failed, 1, "settled once");
  assert.equal(stats.chargedMicros, RESERVATION_MICROS);
});

test("WEB-1315: a failed request in a developer window leaves the visitor's attempts as they were", async () => {
  const month = await freshMonth();
  const visitor = randomUUID(),
    request = randomUUID(),
    now = Date.now();
  const attempts = [now - 2000, now - 1000];
  await db
    .collection("voiceVisitors")
    .doc(visitor)
    .set({ attempts, developerStartedAt: now - 10, developerUntil: now + 30 * 60_000 });
  await admit(visitor, randomUUID(), request, "text", 0);
  assert.deepEqual(await visitorAttempts(visitor), attempts, "a developer window counts no try");
  await finish(visitor, request, month, {});
  assert.deepEqual(await visitorAttempts(visitor), attempts);
  assert.equal((await monthStats(month)).failed, 1);
});

test("WEB-1315: after a failure the same request ID still answers previous_failure, and a new request ID is admitted", async () => {
  const month = await freshMonth();
  const visitor = randomUUID(),
    network = randomUUID(),
    request = randomUUID();
  await admit(visitor, network, request, "text", 0);
  await finish(visitor, request, month, {});
  await assert.rejects(
    cachedJob(visitor, request),
    (e) => e instanceof DemoError && e.code === "previous_failure",
  );
  await assert.rejects(
    admit(visitor, network, request, "text", 0),
    (e) => e instanceof DemoError && e.code === "processing",
    "the same request ID is never admitted twice",
  );
  const next = randomUUID();
  assert.equal(await admit(visitor, network, next, "text", 0), month);
  assert.equal((await usage(visitor)).remaining, 2);
  assert.equal((await networkAttempts(network)).length, 2);
});
