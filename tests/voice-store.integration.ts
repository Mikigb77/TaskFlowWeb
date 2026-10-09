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
