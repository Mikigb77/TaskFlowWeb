import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { validateWav } from "../src/lib/voice/policy";
test.use({
  launchOptions: {
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
    ],
  },
});

test("live text capture produces editable multiple tasks and shows the remaining allowance", async ({
  page,
}) => {
  let remaining = 3,
    requests = 0;
  await page.route("**/api/voice/status/", (route) =>
    route.fulfill({
      json: {
        remaining,
        resetAt: Date.now() + 86400000,
        siteKey: "test-fixture",
      },
    }),
  );
  // Fixture replaces only the third-party widget in this isolated UI test.
  // Production has no challenge bypass or fake-model switch.
  await page.route("https://challenges.cloudflare.com/**", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: `window.turnstile={render(el,options){el.textContent='Security check passed';queueMicrotask(()=>options.callback('test-token'));return 'test-widget'},remove(){},reset(){}}`,
    }),
  );
  await page.route("**/api/voice/draft/", async (route) => {
    requests++;
    remaining--;
    const body = route.request().postDataJSON();
    expect(body.text).toContain("coffee");
    expect(body.timezone).toBeTruthy();
    expect(route.request().headers()["x-request-id"]).toMatch(
      /^[a-f0-9-]{36}$/,
    );
    await route.fulfill({
      json: {
        transcript: body.text,
        remaining,
        resetAt: Date.now() + 86400000,
        tasks: [
          {
            title: "Doctor appointment",
            date: "2026-10-16",
            time: "17:00",
            priority: "high",
            notes: "Bring test results",
            question: null,
          },
          {
            title: "Buy coffee",
            date: null,
            time: null,
            priority: "low",
            notes: "",
            question: null,
          },
        ],
      },
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Try the live demo" }).click();
  const demo = page.locator("#voice");
  await expect(demo.getByText("3 of 3 tries left")).toBeVisible();
  await demo.getByRole("button", { name: "Type it instead" }).click();
  await demo
    .getByLabel("What is on your mind?")
    .fill("Doctor Friday at 5 p.m. Bring results. Also buy coffee sometime.");
  await demo.getByRole("button", { name: "Create drafts" }).click();
  await expect(demo.getByText("2 of 3 tries left")).toBeVisible();
  const drafts = demo.locator("fieldset");
  await expect(drafts).toHaveCount(2);
  await expect(drafts.nth(1).getByLabel("Date optional")).toHaveValue("");
  await expect(drafts.nth(1).getByLabel("Time optional")).toBeDisabled();
  await drafts
    .nth(1)
    .getByLabel("Title", { exact: true })
    .fill("Buy decaf coffee");
  await expect(drafts.nth(0).getByLabel("Time optional")).toHaveValue("17:00");
  const violations = (
    await new AxeBuilder({ page })
      .include("#voice")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze()
  ).violations;
  expect(violations).toEqual([]);
  await demo.getByRole("button", { name: "Add to preview list" }).click();
  await demo.getByRole("button", { name: /Buy decaf coffee/ }).click();
  await expect(
    demo.getByRole("button", { name: /Buy decaf coffee/ }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(requests).toBe(1);
});

test("a used allowance blocks recording and submission while keeping the sample usable", async ({
  page,
}) => {
  await page.route("**/api/voice/status/", (route) =>
    route.fulfill({
      json: { remaining: 0, resetAt: Date.now() + 3600000, siteKey: "fixture" },
    }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Try the live demo" }).click();
  await expect(
    page.getByRole("button", { name: "Start recording" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Create drafts" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Add to my preview" }),
  ).toBeEnabled();
});

test("live-demo outages remain understandable without affecting the marketing page", async ({
  page,
}) => {
  await page.route("**/api/voice/status/", (route) =>
    route.fulfill({
      status: 503,
      json: {
        error:
          "The live demo is taking a break. The sample walkthrough is still available.",
      },
    }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Try the live demo" }).click();
  await expect(page.locator("#voice").getByRole("alert")).toContainText(
    "taking a break",
  );
  await expect(
    page.getByRole("button", { name: "Add to my preview" }),
  ).toBeEnabled();
});

test.describe("microphone capture", () => {
  test("the real AudioWorklet produces bounded PCM and stops the recording", async ({
    page,
  }) => {
    await page.route("**/api/voice/status/", (route) =>
      route.fulfill({
        json: { remaining: 3, resetAt: null, siteKey: "fixture" },
      }),
    );
    await page.route("https://challenges.cloudflare.com/**", (route) =>
      route.fulfill({
        contentType: "text/javascript",
        body: `window.turnstile={render(el,o){queueMicrotask(()=>o.callback('fixture'));return 'id'},remove(){}}`,
      }),
    );
    let received = false;
    await page.route("**/api/voice/draft/", async (route) => {
      const body = route.request().postDataJSON();
      const seconds = validateWav(Buffer.from(body.audio, "base64"));
      expect(seconds).toBeGreaterThan(0.3);
      expect(seconds).toBeLessThan(5);
      received = true;
      await route.fulfill({
        json: {
          transcript: "A test recording",
          tasks: [],
          remaining: 2,
          resetAt: Date.now() + 86400000,
        },
      });
    });
    await page.goto("/");
    await page.getByRole("button", { name: "Try the live demo" }).click();
    await page.getByRole("button", { name: "Start recording" }).click();
    await expect(page.getByText(/Recording · 1s/)).toBeVisible();
    await page.getByRole("button", { name: "Stop recording" }).click();
    await expect(
      page.getByText("Recording ready. Listen before sending."),
    ).toBeVisible();
    await page.getByRole("button", { name: "Create drafts" }).click();
    await expect(
      page.getByText("No tasks were found.", { exact: false }),
    ).toBeVisible();
    expect(received).toBe(true);
  });
});

test("the last allowed request can be retrieved after an interrupted response", async ({
  page,
}) => {
  let attempts = 0,
    requestId = "",
    remaining = 1;
  await page.route("**/api/voice/status/", (route) =>
    route.fulfill({
      json: { remaining, resetAt: Date.now() + 86400000, siteKey: "fixture" },
    }),
  );
  await page.route("https://challenges.cloudflare.com/**", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: `window.turnstile={render(el,o){queueMicrotask(()=>o.callback('fixture'));return 'id'},remove(){}}`,
    }),
  );
  await page.route("**/api/voice/draft/", async (route) => {
    attempts++;
    if (attempts === 1) {
      requestId = route.request().headers()["x-request-id"];
      remaining = 0;
      await route.fulfill({
        status: 503,
        json: { code: "unavailable", error: "Please retry." },
      });
    } else {
      expect(route.request().headers()["x-request-id"]).toBe(requestId);
      await route.fulfill({
        json: {
          transcript: "Buy coffee",
          tasks: [],
          remaining: 0,
          resetAt: Date.now() + 86400000,
        },
      });
    }
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Try the live demo" }).click();
  await page.getByRole("button", { name: "Type it instead" }).click();
  await page.getByLabel("What is on your mind?").fill("Buy coffee");
  await page.getByRole("button", { name: "Create drafts" }).click();
  await expect(page.locator("#voice").getByRole("alert")).toContainText(
    "Please retry.",
  );
  await expect(page.getByText("0 of 3 tries left")).toBeVisible();
  await page.getByRole("button", { name: "Create drafts" }).click();
  await expect(
    page.getByText("No tasks were found.", { exact: false }),
  ).toBeVisible();
  expect(attempts).toBe(2);
});
