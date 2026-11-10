import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Files at the repository's root, read as text.
const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Dependabot opens every update into dev, like every PR (README.md#dependabot)", () => {
  const config = read(".github/dependabot.yml");
  const entries = config.match(/^ {2}- package-ecosystem: /gm) ?? [];
  assert.ok(entries.length > 0);
  assert.equal(config.match(/^ {4}target-branch: dev$/gm)?.length, entries.length);
});

test("the Dockerfile runs one Node in every stage, the one CI reads from it", () => {
  const images = [...read("Dockerfile").matchAll(/^FROM (node:\S+)/gm)].map((m) => m[1]);
  assert.equal(images.length, 2);
  assert.equal(new Set(images).size, 1);
  const ci = read(".github/workflows/ci.yml");
  assert.match(ci, /node-version: \$\{\{ steps\.node\.outputs\.version \}\}/);
  assert.doesNotMatch(ci, /node-version: \d/);
});
