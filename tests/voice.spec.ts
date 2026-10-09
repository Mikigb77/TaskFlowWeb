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
}, testInfo) => {
  let remaining = 3,
    requests = 0;
  const requestIds: string[] = [];
  let finishProcessing!: () => void;
  const responseReady = new Promise<void>((resolve) => {
    finishProcessing = resolve;
  });
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
    requestIds.push(route.request().headers()["x-request-id"]);
    await responseReady;
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
  const processing = demo.getByRole("heading", {
    name: "Making a little clarity…",
  });
  await expect(processing).toBeFocused();
  await expect(processing).toBeInViewport();
  await expect(demo.getByRole("button", { name: "Create drafts" })).toHaveCount(
    0,
  );
  await expect(demo.getByLabel("What is on your mind?")).toHaveCount(0);
  await page.screenshot({
    path: `artifacts/voice-processing-${testInfo.project.name}.png`,
  });
  finishProcessing();
  await expect(demo.getByText("2 of 3 tries left")).toBeVisible();
  const review = demo.getByRole("heading", {
    name: "2 drafts, ready for you.",
  });
  await expect(review).toBeFocused();
  await expect(review).toBeInViewport();
  const firstCard = demo.locator(".voice-task-card").first();
  // Detect the original regression: results must be visible without scrolling
  // back past the recording controls, including on a phone-sized viewport.
  await expect(firstCard).toBeInViewport({ ratio: 1 });
  await expect(
    demo.getByRole("button", { name: "Start recording" }),
  ).toHaveCount(0);
  await expect(demo.locator(".voice-modes")).toHaveCount(0);
  await expect(demo.locator(".voice-verification")).toHaveCount(0);
  await page.screenshot({
    path: `artifacts/voice-review-${testInfo.project.name}.png`,
  });
  const drafts = demo.locator("fieldset");
  await expect(drafts).toHaveCount(2);
  await demo.getByText("Edit task 2", { exact: true }).click();
  await drafts.nth(1).getByLabel("Title", { exact: true }).fill("");
  await demo.getByText("Edit task 2", { exact: true }).click();
  await demo.getByRole("button", { name: "Add to preview list" }).click();
  await expect(
    drafts.nth(1).getByLabel("Title", { exact: true }),
  ).toBeVisible();
  await expect(
    demo.getByRole("heading", { name: "Your preview list" }),
  ).toHaveCount(0);
  await expect(drafts.nth(1).getByLabel("Date optional")).toHaveValue("");
  await expect(drafts.nth(1).getByLabel("Time optional")).toBeDisabled();
  await drafts
    .nth(1)
    .getByLabel("Title", { exact: true })
    .fill("Buy decaf coffee");
  await expect(drafts.nth(0).getByLabel("Time optional")).toHaveValue("17:00");
  await demo.getByText("Edit task 2", { exact: true }).click();
  const violations = (
    await new AxeBuilder({ page })
      .include("#voice")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze()
  ).violations;
  expect(violations).toEqual([]);
  await page
    .getByRole("button", { name: "Switch to dark mode", exact: true })
    .click();
  expect(
    (
      await new AxeBuilder({ page })
        .include("#voice")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await demo.getByRole("button", { name: "Add to preview list" }).click();
  await expect(
    demo.getByRole("heading", { name: "Your preview list" }),
  ).toBeFocused();
  await expect(
    demo.getByRole("button", { name: /Doctor appointment/ }),
  ).toBeInViewport();
  await demo.getByRole("button", { name: /Buy decaf coffee/ }).click();
  await expect(
    demo.getByRole("button", { name: /Buy decaf coffee/ }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(requests).toBe(1);
  await demo.getByRole("button", { name: "Edit drafts", exact: true }).click();
  await expect(
    demo.getByRole("heading", { name: "Buy decaf coffee", exact: true }),
  ).toBeVisible();
  await demo.getByRole("button", { name: "Edit original thought" }).click();
  await expect(demo.getByLabel("What is on your mind?")).toHaveValue(
    "Doctor Friday at 5 p.m. Bring results. Also buy coffee sometime.",
  );
  await demo
    .getByLabel("What is on your mind?")
    .fill(
      "Doctor Friday at 5 p.m. Bring results. Also buy decaf coffee sometime.",
    );
  await demo.getByRole("button", { name: "Create drafts" }).click();
  await expect(review).toBeFocused();
  expect(requests).toBe(2);
  expect(new Set(requestIds).size).toBe(2);
  await demo.getByRole("button", { name: "Try a new thought" }).click();
  await expect(
    demo.getByRole("button", { name: "Start recording" }),
  ).toBeEnabled();
  await expect(demo.locator(".voice-task-card")).toHaveCount(0);
  await demo.getByRole("button", { name: "Type it instead" }).click();
  await expect(demo.getByLabel("What is on your mind?")).toHaveValue("");
  await demo.getByRole("button", { name: "Close demo" }).click();
  await expect(
    demo.getByRole("button", { name: "Try the live demo" }),
  ).toBeFocused();
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
    let received = false,
      requests = 0;
    await page.route("**/api/voice/draft/", async (route) => {
      requests++;
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
    await expect(
      page.getByRole("button", { name: "Start recording" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Record again" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Ready when you are." }),
    ).toBeFocused();
    expect(requests).toBe(0);
    await page
      .getByRole("button", { name: "Record again", exact: true })
      .click();
    await expect(page.getByText(/Recording · 1s/)).toBeVisible();
    await page.getByRole("button", { name: "Stop recording" }).click();
    await expect(
      page.getByText("Recording ready. Listen before sending."),
    ).toBeVisible();
    expect(requests).toBe(0);
    await page.getByRole("button", { name: "Create drafts" }).click();
    await expect(
      page.getByText("No tasks were found.", { exact: false }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Let’s give that another go." }),
    ).toBeFocused();
    await expect(page.locator("#voice audio")).toHaveCount(0);
    await page.getByRole("button", { name: "Try a new thought" }).click();
    await expect(
      page.getByRole("button", { name: "Start recording" }),
    ).toBeEnabled();
    expect(received).toBe(true);
    expect(requests).toBe(1);
  });
});

test("only a server-granted developer window unlocks a used allowance and it expires in place", async ({
  page,
}) => {
  const now = Date.now();
  await page.clock.install({ time: now });
  let testingUntil: number | null = null;
  const developerCode = "9ad027d1-5678-4abc-8def-1234567890ab";
  await page.route("**/api/voice/status/", (route) =>
    route.fulfill({
      json: {
        remaining: 0,
        resetAt: now + 86400000,
        siteKey: "fixture",
        testingUntil,
        developerCode,
      },
    }),
  );
  await page.route("https://challenges.cloudflare.com/**", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: `window.turnstile={render(el,o){queueMicrotask(()=>o.callback('fixture'));return 'id'},remove(){}}`,
    }),
  );
  await page.route("**/api/voice/draft/", (route) =>
    route.fulfill({
      json: {
        transcript: "Buy coffee",
        tasks: [
          {
            title: "Buy coffee",
            date: null,
            time: null,
            priority: "low",
            notes: "",
            question: null,
          },
        ],
        remaining: 0,
        resetAt: now + 86400000,
        testingUntil,
      },
    }),
  );
  await page.goto("/?developer=1#voice");
  await page.getByRole("button", { name: "Try the live demo" }).click();
  const demo = page.locator("#voice");
  await expect(
    demo.getByRole("button", { name: "Start recording" }),
  ).toBeDisabled();
  await demo.getByText("Developer testing", { exact: true }).click();
  await expect(demo.locator("code")).toHaveText(developerCode);
  testingUntil = now + 30 * 60_000;
  await demo.getByRole("button", { name: "Check developer access" }).click();
  await expect(demo.getByText(/Developer testing ·/)).toBeVisible();
  await expect(
    demo.getByRole("button", { name: "Start recording" }),
  ).toBeEnabled();
  await demo.getByRole("button", { name: "Type it instead" }).click();
  await demo.getByLabel("What is on your mind?").fill("Buy coffee");
  await demo.getByRole("button", { name: "Create drafts" }).click();
  await expect(
    demo.getByRole("heading", { name: "1 draft, ready for you." }),
  ).toBeVisible();
  await demo.getByRole("button", { name: "Try a new thought" }).click();
  await expect(
    demo.getByRole("button", { name: "Start recording" }),
  ).toBeEnabled();
  testingUntil = null;
  await page.clock.fastForward(30 * 60_000 + 1000);
  await expect(demo.getByText("0 of 3 tries left")).toBeVisible();
  await expect(
    demo.getByRole("button", { name: "Start recording" }),
  ).toBeDisabled();
  await expect(
    demo.getByRole("button", { name: "Create drafts" }),
  ).toBeDisabled();
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
  await expect(page.locator("#voice").getByRole("alert")).toBeFocused();
  await expect(page.locator("#voice").getByRole("alert")).toBeInViewport();
  await expect(page.getByLabel("What is on your mind?")).toHaveValue(
    "Buy coffee",
  );
  await expect(page.getByText("0 of 3 tries left")).toBeVisible();
  await page.getByRole("button", { name: "Create drafts" }).click();
  await expect(
    page.getByText("No tasks were found.", { exact: false }),
  ).toBeVisible();
  expect(attempts).toBe(2);
  await expect(
    page.getByRole("button", { name: "Try a new thought" }),
  ).toBeDisabled();
});
