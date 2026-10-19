// Acceptance tests for the live demo from the UX web loop, run 2026-10-18-site, that prove
// held changes (VoiceDemo.tsx holds the other session's uncommitted work): WP33's tries-used
// line. This file stays uncommitted with it. Every /api/voice/* request is stubbed.
import type { Project } from "./support/ux-voice";
import { scenarios } from "./support/ux-voice";
import { expect, ROOT, test } from "./support/ux-web";

test.use({ colorScheme: "light" });

test("WEB-6: with every try used, the demo's status line says when they return and promises no walkthrough", async ({
  page,
  voice,
}, testInfo) => {
  const scenario = scenarios(ROOT).list.find((entry) => entry.key === "voice-tries-used");
  expect(scenario, "the voice-tries-used scenario in tests/support/ux-voice.ts").toBeDefined();
  await scenario!.setup?.(page, voice);
  await scenario!.run({
    page,
    voice,
    project: testInfo.project.name as Project,
    capture: async () => {},
  });
  const line = page.locator("#voice").getByRole("status").filter({ hasText: "Your allowance returns" });
  await expect(line).toHaveCount(1);
  await expect(line).toBeVisible();
  const text = ((await line.textContent()) ?? "").replace(/\s+/g, " ").trim();
  expect(text).not.toMatch(/walkthrough/i);
  expect(text).toContain("Your allowance returns");
  expect(text).toMatch(/\.$/);
  expect((await page.locator("#voice").textContent()) ?? "").not.toMatch(/walkthrough/i);
  expect(voice.unexpected).toEqual([]);
});
