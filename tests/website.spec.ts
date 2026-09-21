import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("visitors can edit, save, complete, and reset a sample task", async ({
  page,
}) => {
  const errors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (
      !request.url().startsWith("http://127.0.0.1:3000") &&
      !request.url().startsWith("data:")
    )
      externalRequests.push(request.url());
  });
  await page.goto("/");
  await page.getByRole("link", { name: "See it in action" }).click();
  await expect(page).toHaveURL(/#demo$/);
  await page
    .getByRole("button", { name: "A little me-time", exact: true })
    .click();
  await expect(page.getByLabel("Task title", { exact: true })).toHaveValue(
    "Evening walk",
  );
  await expect(page.getByLabel("Priority", { exact: true })).toHaveValue("Low");
  await page.getByLabel("Task title", { exact: true }).fill("A walk with Luna");
  await page.getByLabel("Date", { exact: true }).fill("2026-09-26");
  await page.getByLabel("Time", { exact: true }).fill("19:30");
  await page
    .getByLabel("A note for later", { exact: true })
    .fill("Bring her favorite ball.");
  await page.getByRole("button", { name: "Add to my preview" }).click();
  await expect(
    page.getByRole("heading", { name: "There. A little lighter." }),
  ).toBeVisible();
  await expect(page.locator(".saved-task")).toContainText("A walk with Luna");
  await expect(page.locator(".saved-task")).toContainText("19:30");
  await expect(page.locator(".saved-task")).toContainText("Sep 26");
  await expect(page.locator(".saved-task")).toContainText(
    "Bring her favorite ball.",
  );
  await page
    .getByRole("button", { name: "Complete preview task", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "That’s a good feeling." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Mark preview task incomplete" })
    .click();
  await page.getByRole("button", { name: "Try another thought" }).click();
  await expect(page.getByLabel("Task title", { exact: true })).toHaveValue(
    "Doctor appointment",
  );
  await page.reload();
  await expect(page.getByLabel("Task title", { exact: true })).toHaveValue(
    "Doctor appointment",
  );
  expect(errors).toEqual([]);
  expect(externalRequests).toEqual([]);
});

test("theme persists across reloads and pages without losing demo edits", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Task title", { exact: true }).fill("My edited draft");
  await page
    .getByRole("button", { name: "Switch to dark mode", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByLabel("Task title", { exact: true })).toHaveValue(
    "My edited draft",
  );
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("link", { name: "Privacy", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Your privacy",
  );
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("link", { name: "Back to TaskFlow" }).click();
  await page
    .getByRole("button", { name: "Try a different mood: switch to light mode" })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("a draft needs a title and a valid date before it can be added", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Task title", { exact: true }).fill("   ");
  await page.getByRole("button", { name: "Add to my preview" }).click();
  await expect(page.locator("#demo").getByRole("alert")).toContainText(
    "Give your task a title",
  );
  await page.getByLabel("Task title", { exact: true }).fill("A valid task");
  await page.getByLabel("Date", { exact: true }).fill("");
  await page.getByRole("button", { name: "Add to my preview" }).click();
  await expect(
    page.getByRole("heading", { name: "A thought, all sorted." }),
  ).toBeVisible();
  await page.getByLabel("Date", { exact: true }).fill("2026-09-27");
  await page.getByRole("button", { name: "Add to my preview" }).click();
  await expect(page.locator(".saved-task")).toContainText("Sep 27");
});

test("navigation, FAQs, and page recovery work", async ({ page, isMobile }) => {
  await page.goto("/");
  if (isMobile) {
    await page.getByLabel("Open navigation").click();
    await expect(
      page.getByRole("navigation", { name: "Mobile navigation" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("navigation", { name: "Mobile navigation" }),
    ).not.toBeVisible();
    await page.getByLabel("Open navigation").click();
    await page
      .getByRole("navigation", { name: "Mobile navigation" })
      .getByRole("link", { name: "Questions" })
      .click();
    await expect(page.locator(".header-menu")).not.toHaveAttribute("open");
  } else {
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Questions" })
      .click();
  }
  await expect(page).toHaveURL(/#questions$/);
  await page.getByText("Can I download TaskFlow yet?", { exact: true }).click();
  await expect(
    page.getByText(/A public download is coming later/),
  ).toBeVisible();
  await page.getByText("Can I use it offline?", { exact: true }).click();
  await expect(
    page.getByText(/Local attachments stay on the device/),
  ).toBeVisible();
  const response = await page.goto("/a-page-that-does-not-exist/");
  expect(response?.status()).toBe(404);
  await page.getByRole("link", { name: "Back to TaskFlow" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Make room",
  );
});

test("light and dark layouts pass accessibility checks and fit narrow screens", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  for (const theme of ["light", "dark"]) {
    if (theme === "dark")
      await page
        .getByRole("button", { name: "Switch to dark mode", exact: true })
        .click();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      results.violations.map(({ id, nodes }) => ({
        id,
        failures: nodes.map(({ target, failureSummary }) => ({
          target,
          failureSummary,
        })),
      })),
    ).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.locator(".appearance-section").scrollIntoViewIfNeeded();
    await expect(
      page.locator(`.appearance-phone .${theme}-only`),
    ).toBeVisible();
    await page.waitForFunction(() =>
      Array.from(document.images)
        .filter((image) => getComputedStyle(image).display !== "none")
        .every((image) => image.complete && image.naturalWidth > 0),
    );
    await page.locator("#hero-title").click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: `artifacts/${testInfo.project.name}-${theme}.png`,
      fullPage: true,
    });
    await page.locator(".hero").screenshot({
      path: `artifacts/${testInfo.project.name}-hero-${theme}.png`,
    });
    await page.locator("#demo").screenshot({
      path: `artifacts/${testInfo.project.name}-demo-${theme}.png`,
      style: ".site-header, .skip-link { visibility: hidden; }",
    });
  }
  for (const width of [320, 768, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});

test("system appearance is followed until a choice is made", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page
    .getByRole("button", { name: "Switch to light mode", exact: true })
    .click();
  await page.emulateMedia({ colorScheme: "light" });
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("the marketing content and FAQ remain usable without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL: "http://127.0.0.1:3000",
  });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Make room",
  );
  await page.getByText("Can I use it offline?", { exact: true }).click();
  await expect(
    page.getByText(/Local attachments stay on the device/),
  ).toBeVisible();
  await expect(
    page.getByText(/Enable JavaScript to try the interactive demo/),
  ).toBeVisible();
  await context.close();
});
