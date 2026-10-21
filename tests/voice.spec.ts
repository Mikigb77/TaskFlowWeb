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

test("live text capture shows the tasks as the app does and the remaining tries", async ({
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
  await demo.getByRole("button", { name: "Type instead" }).click();
  await demo
    .getByLabel("Type what you need to do")
    .fill("Doctor Friday at 5 p.m. Bring results. Also buy coffee sometime.");
  await demo.getByRole("button", { name: "Done", exact: true }).click();
  const processing = demo.getByRole("heading", {
    name: "Understanding…",
  });
  await expect(processing).toBeFocused();
  await expect(processing).toBeInViewport();
  await expect(demo.getByRole("button", { name: "Done", exact: true })).toHaveCount(
    0,
  );
  await expect(demo.getByLabel("Type what you need to do")).toHaveCount(0);
  await page.screenshot({
    path: `artifacts/voice-processing-${testInfo.project.name}.png`,
  });
  finishProcessing();
  await expect(demo.getByText("2 of 3 tries left")).toBeVisible();
  const review = demo.getByRole("heading", {
    name: "2 things to add",
  });
  await expect(review).toBeFocused();
  await expect(review).toBeInViewport();
  const firstCard = demo.locator(".voice-task-card").first();
  // Detect the original regression: results must be visible without scrolling
  // back past the recording controls, including on a phone-sized viewport.
  await expect(firstCard).toBeInViewport({ ratio: 1 });
  await expect(
    demo.getByRole("button", { name: "Tap to talk" }),
  ).toHaveCount(0);
  await expect(
    demo.getByRole("button", { name: "Type instead" }),
  ).toHaveCount(0);
  await expect(demo.locator(".voice-verification")).toHaveCount(0);
  await page.screenshot({
    path: `artifacts/voice-review-${testInfo.project.name}.png`,
  });
  // The result as the app shows it: a title and a date line, in the page's language.
  await expect(firstCard).toContainText("Fri, Oct 16 · 5:00 PM");
  await expect(demo.locator(".voice-task-card").nth(1)).toContainText(
    "No date",
  );
  await expect(demo.locator("fieldset, select, input:not([type=checkbox])")).toHaveCount(0);
  // WD16 permits local completion controls in generated results; editing stays absent.
  await expect(demo.getByRole("checkbox")).toHaveCount(2);
  for (const title of ["Doctor appointment", "Buy coffee"]) {
    const checkbox = demo.getByRole("checkbox", { name: title, exact: true });
    await expect(checkbox).not.toBeChecked();
    expect(await checkbox.evaluate((input) => input instanceof HTMLInputElement && input.type === "checkbox")).toBe(true);
  }
  const violations = (
    await new AxeBuilder({ page })
      .include("#voice")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze()
  ).violations;
  expect(violations).toEqual([]);
  // The theme switch: the header's icon on desktop, the menu's Appearance row on phones.
  if (await page.locator(".header-actions > .theme-toggle").isVisible())
    await page
      .getByRole("button", { name: "Switch to dark mode", exact: true })
      .click();
  else {
    await page.locator(".header-menu summary").click();
    await page.getByRole("button", { name: "Dark", exact: true }).click();
    await page.keyboard.press("Escape");
  }
  expect(
    (
      await new AxeBuilder({ page })
        .include("#voice")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(requests).toBe(1);
  await demo.getByRole("button", { name: "Change the text" }).click();
  await expect(demo.getByLabel("Type what you need to do")).toHaveValue(
    "Doctor Friday at 5 p.m. Bring results. Also buy coffee sometime.",
  );
  await expect(demo.getByLabel("Type what you need to do")).toBeFocused();
  await demo
    .getByLabel("Type what you need to do")
    .fill(
      "Doctor Friday at 5 p.m. Bring results. Also buy decaf coffee sometime.",
    );
  await demo.getByRole("button", { name: "Done", exact: true }).click();
  await expect(review).toBeFocused();
  expect(requests).toBe(2);
  expect(new Set(requestIds).size).toBe(2);
  await demo.getByRole("button", { name: "Close demo" }).click();
  await expect(
    demo.getByRole("button", { name: "Try the live demo" }),
  ).toBeFocused();
  await demo.getByRole("button", { name: "Try the live demo" }).click();
  await expect(demo.locator(".voice-task-card")).toHaveCount(0);
  await demo.getByRole("button", { name: "Type instead" }).click();
  await expect(demo.getByLabel("Type what you need to do")).toHaveValue("");
});

test("a used allowance says when the tries come back, with nothing to tap", async ({
  page,
}) => {
  await page.route("**/api/voice/status/", (route) =>
    route.fulfill({
      json: { remaining: 0, resetAt: Date.now() + 3600000, siteKey: "fixture" },
    }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Try the live demo" }).click();
  const demo = page.locator("#voice");
  await expect(
    demo.getByRole("heading", {
      // The weekday in full, or ‘today’ when the tries come back on today's date.
      name: /^You’ve used this demo’s 3 tries\. You can try again (on [A-Z][a-z]+day|today) at /,
    }),
  ).toBeFocused();
  await expect(demo.getByRole("button", { name: "Tap to talk" })).toHaveCount(
    0,
  );
  await expect(
    demo.getByRole("button", { name: "Done", exact: true }),
  ).toHaveCount(0);
  await expect(demo.locator("button:disabled")).toHaveCount(0);
});

test("live-demo outages remain understandable without affecting the marketing page", async ({
  page,
}) => {
  await page.route("**/api/voice/status/", (route) =>
    route.fulfill({
      status: 503,
      json: {
        code: "paused",
        error: "The live demo is off for now. Please try again later.",
      },
    }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Try the live demo" }).click();
  await expect(page.locator("#voice").getByRole("alert")).toHaveText(
    "The live demo is off for now. The example above shows what TaskFlow does.",
  );
  await expect(page.locator("#voice .voice-off .voice-example")).toBeVisible();
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
    await page.getByRole("button", { name: "Tap to talk" }).click();
    await expect(page.getByText(/Listening · 0:01/)).toBeVisible();
    await expect(page.locator("#voice audio")).toHaveCount(0);
    expect(requests).toBe(0);
    await page.getByRole("button", { name: "Done", exact: true }).click();
    const noTasks = page.getByRole("heading", {
      name: "No tasks were found. Your words are kept. That used a try.",
    });
    await expect(noTasks).toBeFocused();
    await expect(page.locator("#voice .voice-results svg")).toHaveCount(0);
    await expect(page.locator("#voice audio")).toHaveCount(0);
    expect(received).toBe(true);
    expect(requests).toBe(1);
    // Say it again starts listening at once, as the app does.
    await page.getByRole("button", { name: "Say it again" }).click();
    await expect(page.getByText(/Listening · 0:01/)).toBeVisible();
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await expect(noTasks).toBeFocused();
    expect(requests).toBe(2);
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
    demo.getByText(/^You’ve used this demo’s 3 tries\./),
  ).toBeVisible();
  await expect(demo.getByRole("button", { name: "Tap to talk" })).toHaveCount(
    0,
  );
  await demo.getByText("Developer testing", { exact: true }).click();
  await expect(demo.locator("code")).toHaveText(developerCode);
  testingUntil = now + 30 * 60_000;
  await demo.getByRole("button", { name: "Check developer access" }).click();
  await expect(demo.getByText(/Developer testing ·/)).toBeVisible();
  await expect(
    demo.getByRole("button", { name: "Tap to talk" }),
  ).toBeEnabled();
  await demo.getByRole("button", { name: "Type instead" }).click();
  await demo.getByLabel("Type what you need to do").fill("Buy coffee");
  await demo.getByRole("button", { name: "Done", exact: true }).click();
  await expect(
    demo.getByRole("heading", { name: "1 thing to add" }),
  ).toBeVisible();
  await demo.getByRole("button", { name: "Change the text" }).click();
  await expect(demo.getByLabel("Type what you need to do")).toHaveValue(
    "Buy coffee",
  );
  testingUntil = null;
  await page.clock.fastForward(30 * 60_000 + 1000);
  await expect(demo.getByText("0 of 3 tries left")).toBeVisible();
  await expect(
    demo.getByText(/^You’ve used this demo’s 3 tries\./),
  ).toBeVisible();
  await expect(demo.getByRole("button", { name: "Tap to talk" })).toHaveCount(
    0,
  );
  await expect(
    demo.getByRole("button", { name: "Done", exact: true }),
  ).toHaveCount(0);
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
      await route.abort("connectionreset");
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
  await page.getByRole("button", { name: "Type instead" }).click();
  await page.getByLabel("Type what you need to do").fill("Buy coffee");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.locator("#voice").getByRole("alert")).toContainText(
    "No connection.",
  );
  await expect(page.locator("#voice").getByRole("alert")).toBeFocused();
  await expect(page.locator("#voice").getByRole("alert")).toBeInViewport();
  await expect(page.getByLabel("Type what you need to do")).toHaveValue(
    "Buy coffee",
  );
  await expect(page.getByText("0 of 3 tries left")).toBeVisible();
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(
    page.getByText("No tasks were found.", { exact: false }),
  ).toBeVisible();
  expect(attempts).toBe(2);
  // The last try's result: no action to repeat it, but when the tries come back.
  await expect(
    page.locator("#voice").getByText(/^You’ve used this demo’s 3 tries\./),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Change the text" }),
  ).toHaveCount(0);
});
