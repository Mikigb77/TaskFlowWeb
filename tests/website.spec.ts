import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("the home loads without errors or outside requests, and its main button leads to the live demo", async ({
  page,
  baseURL,
}) => {
  const errors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (
      new URL(request.url()).origin !== new URL(baseURL!).origin &&
      !request.url().startsWith("data:")
    )
      externalRequests.push(request.url());
  });
  await page.goto("/");
  await page
    .locator(".hero")
    .getByRole("link", { name: "Try it with your voice" })
    .click();
  await expect(page).toHaveURL(/#voice$/);
  expect(errors).toEqual([]);
  expect(externalRequests).toEqual([]);
});

test("theme persists across reloads and pages", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Switch to dark mode", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("link", { name: "Privacy", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Your privacy",
  );
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("link", { name: "Back to TaskFlow" }).click();
  await page
    .getByRole("button", { name: "Switch to light mode", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
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
    page.getByText(/coming soon to Google Play\. Until then/),
  ).toBeVisible();
  await page.getByText("Can I use it offline?", { exact: true }).click();
  await expect(page.getByText(/Downloaded files work offline/)).toBeVisible();
  const response = await page.goto("/a-page-that-does-not-exist/");
  expect(response?.status()).toBe(404);
  await page.getByRole("link", { name: "Back to TaskFlow" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "on your calendar.",
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
    const heroImage = page.locator(`.hero img.${theme}-only`);
    await expect(heroImage).toBeVisible();
    await expect
      .poll(() =>
        heroImage.evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
      )
      .toBe(true);
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
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "on your calendar.",
  );
  await page.getByText("Can I use it offline?", { exact: true }).click();
  await expect(page.getByText(/Downloaded files work offline/)).toBeVisible();
  await context.close();
});
