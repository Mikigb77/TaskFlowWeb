import { test, expect } from "./support/test";
import AxeBuilder from "@axe-core/playwright";
import type { Page } from "./support/test";

// The theme control: the header's icon switch on desktop, the menu's Appearance row on phones.
async function chooseTheme(page: Page, isMobile: boolean, theme: "light" | "dark") {
  if (isMobile) {
    await page.locator(".header-menu summary").click();
    await page
      .getByRole("group", { name: "Appearance" })
      .getByRole("button", { name: theme === "dark" ? "Dark" : "Light", exact: true })
      .click();
    await page.keyboard.press("Escape");
  } else
    await page
      .getByRole("button", { name: `Switch to ${theme} mode`, exact: true })
      .click();
}

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
    .locator(".nv-hero")
    .getByRole("link", { name: "Try it with your voice" })
    .click();
  await expect(page).toHaveURL(/#voice$/);
  expect(errors).toEqual([]);
  expect(externalRequests).toEqual([]);
});

test("theme persists across reloads and pages", async ({ page, isMobile }) => {
  await page.goto("/");
  await chooseTheme(page, isMobile, "dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("link", { name: "Privacy Policy", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    /privacy/i,
  );
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("link", { name: "Back to TaskFlow" }).click();
  await chooseTheme(page, isMobile, "light");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("navigation, FAQs, and page recovery work", async ({ page, isMobile }) => {
  await page.goto("/");
  if (isMobile) {
    const menu = page.locator(".header-menu summary");
    await expect(menu).toHaveText("Menu");
    await menu.click();
    await expect(
      page.getByRole("navigation", { name: "Main navigation" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("navigation", { name: "Main navigation" }),
    ).not.toBeVisible();
    await expect(menu).toBeFocused();
    await menu.click();
    await page
      .getByRole("navigation", { name: "Main navigation" })
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
  await expect(page.getByText(/check, add and complete them without internet/)).toBeVisible();
  const response = await page.goto("/a-page-that-does-not-exist/");
  expect(response?.status()).toBe(404);
  await page.getByRole("link", { name: "Go to the TaskFlow home page" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "on your calendar.",
  );
});

test("light and dark layouts pass accessibility checks and fit narrow screens", async ({
  page,
  isMobile,
}, testInfo) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  for (const theme of ["light", "dark"]) {
    if (theme === "dark") await chooseTheme(page, isMobile, "dark");
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
    // The hero's phone shows the app's own Calendar, rendered from the app.
    await expect(
      page.locator(".nv-hero .phone-screen img").filter({ visible: true }),
    ).toBeVisible();
    // The images below the fold load lazily; ask for them now, then wait for every one shown.
    await page.evaluate(() =>
      document.querySelectorAll<HTMLImageElement>('img[loading="lazy"]').forEach((image) => {
        image.loading = "eager";
      }),
    );
    await page.waitForFunction(() =>
      Array.from(document.images)
        .filter((image) => image.checkVisibility())
        .every((image) => image.complete && image.naturalWidth > 0),
    );
    await page.locator("#hero-title").click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: `artifacts/${testInfo.project.name}-${theme}.png`,
      fullPage: true,
    });
    await page.locator(".nv-hero").screenshot({
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

test("the site starts dark whatever the system says, and a light choice is kept", async ({
  browser,
  baseURL,
  isMobile,
}) => {
  // A fresh context, without the shared fixture's stored light choice (WD39).
  const context = await browser.newContext({
    baseURL,
    colorScheme: "light",
    isMobile,
    viewport: isMobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await chooseTheme(page, isMobile, "light");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.emulateMedia({ colorScheme: "dark" });
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await context.close();
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
  await expect(page.getByText(/check, add and complete them without internet/)).toBeVisible();
  await context.close();
});
