import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";

test("legal documents are readable without login or JavaScript in all three languages", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
  });
  const page = await context.newPage();
  const external: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).origin !== new URL(baseURL!).origin)
      external.push(request.url());
  });
  for (const language of ["en", "es", "ca"]) {
    for (const documentId of ["privacy", "terms", "legal", "delete-account"]) {
      const path = `${language === "en" ? "" : `/${language}`}/${documentId}/`;
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator("article.legal-page")).toHaveAttribute(
        "lang",
        language,
      );
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator(".legal-version")).not.toContainText("GARBAR");
      await expect(page.locator("footer")).toContainText(
        "GARBAR, IN-TEC, S.L.",
      );
      await expect(page.locator(".legal-draft")).toHaveCount(0);
      await expect(page.locator(".legal-version time")).toHaveAttribute(
        "datetime",
        "2026-10-22",
      );
      expect(
        await page
          .locator(".legal-toc a")
          .evaluateAll((links) =>
            links.every(
              (link) =>
                !!document.getElementById(
                  (link as HTMLAnchorElement).hash.slice(1),
                ),
            ),
          ),
      ).toBe(true);
    }
  }
  expect(external).toEqual([]);
  await context.close();
});

test("language, document and rights links keep the selected translation", async ({
  page,
}) => {
  await page.goto("/privacy/");
  await page.getByRole("main").getByRole("link", { name: "Español", exact: true }).click();
  await expect(page).toHaveURL(/\/es\/privacy\/$/);
  await page
    .locator(".legal-related")
    .getByRole("link", { name: "Términos y condiciones" })
    .click();
  await expect(page).toHaveURL(/\/es\/terms\/$/);
  await page.getByRole("main").getByRole("link", { name: "Català", exact: true }).click();
  await expect(page).toHaveURL(/\/ca\/terms\/$/);
  await page
    .locator(".legal-related")
    .getByRole("link", { name: "Suprimeix el compte" })
    .click();
  await page
    .locator(".legal-body")
    .getByRole("link", { name: "Llegir la política de privacitat" })
    .click();
  await expect(page).toHaveURL(/\/ca\/privacy\/#rights$/);
  await expect(page.locator("#rights-title")).toBeInViewport();
  expect((await page.goto("/fr/privacy/"))?.status()).toBe(404);
  expect((await page.goto("/es/not-a-document/"))?.status()).toBe(404);
});

test("deletion requests open a correctly addressed draft without requiring JavaScript or login", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
  });
  const page = await context.newPage();
  for (const [language, subject, bodyText] of [
    ["en", "Delete my TaskFlow account", "associated personal data"],
    ["es", "Eliminar mi cuenta de TaskFlow", "datos personales asociados"],
    ["ca", "Suprimir el meu compte de TaskFlow", "dades personals associades"],
  ]) {
    await page.goto(
      `${language === "en" ? "" : `/${language}`}/delete-account/`,
    );
    const request = page.locator(".legal-request");
    await expect(request.getByRole("heading", { level: 2 })).toBeVisible();
    const href = await request.locator("a.button").getAttribute("href");
    const mail = new URL(href!);
    expect(mail.protocol).toBe("mailto:");
    expect(mail.pathname).toBe("taskflow.support@garbar.tech");
    expect(mail.searchParams.get("subject")).toBe(subject);
    expect(mail.searchParams.get("body")).toContain(bodyText);
    expect(mail.searchParams.get("body")).toContain("\n\n");
    await expect(request.locator(".legal-mail-details")).toContainText(subject);
    await expect(request.locator(".legal-mail-details")).toContainText(
      mail.pathname,
    );
    await expect(request.locator(".legal-contact-help")).not.toBeEmpty();
    await expect(page.locator(".legal-contact-pending")).toHaveCount(0);
    await expect(page.locator("input, textarea")).toHaveCount(0);
  }
  await page.goto("/delete-account/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Delete your TaskFlow account",
  );
  await expect(page.locator("#request")).toContainText(
    "does not send the request automatically",
  );
  await expect(page.locator("#request")).toContainText(
    "does not instantly delete",
  );
  await expect(page.locator("#in-app")).toContainText(
    "Settings → Account → Delete account",
  );
  await expect(page.locator("#in-app")).toContainText("password");
  await expect(page.locator("#in-app")).toContainText("Google");
  await expect(page.locator("#scope")).toContainText(
    "the app tells you who before you confirm",
  );
  await expect(page.locator("#scope")).toContainText(
    "We also ask RevenueCat, the company that checks subscriptions for us, to delete its record of you.",
  );
  await expect(page.locator("#subscription")).toContainText(
    "doesn’t cancel TaskFlow Pro on Google Play",
  );
  await expect(page.locator("#timing")).toContainText(
    "one calendar month of receiving",
  );
  await expect(page.locator("#timing")).toContainText("two additional months");
  await context.close();
});

test("visitors can find deletion and the right contact from the footer, privacy and terms", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .locator(".footer-legal")
    .getByRole("link", { name: "Delete account", exact: true })
    .click();
  await expect(page).toHaveURL(/\/delete-account\/$/);
  await expect(
    page
      .locator(".footer-legal")
      .getByRole("link", { name: "Email support" }),
  ).toHaveAttribute("href", "mailto:taskflow.support@garbar.tech");

  for (const language of ["en", "es", "ca"]) {
    const prefix = language === "en" ? "" : `/${language}`;
    for (const documentId of ["privacy", "terms"]) {
      await page.goto(`${prefix}/${documentId}/`);
      await expect(
        page.locator(".legal-company a[href='mailto:taskflow@garbar.tech']"),
      ).toBeVisible();
      await expect(
        page.locator(
          ".legal-company a[href='mailto:taskflow.support@garbar.tech']",
        ),
      ).toBeVisible();
      await page
        .locator(`.legal-actions a[href='${prefix}/delete-account/']`)
        .click();
      await expect(page).toHaveURL(new RegExp(`${prefix}/delete-account/$`));
    }
    await page.goto(`${prefix}/terms/`);
    await page.locator(`#ending a[href='${prefix}/delete-account/']`).click();
    await expect(page).toHaveURL(new RegExp(`${prefix}/delete-account/$`));
    await page.goto(`${prefix}/privacy/`);
    await expect(page.locator("#sharing")).toContainText(
      "Google Workspace (Gmail)",
    );
    await expect(page.locator("#controller")).toContainText(
      "taskflow.noreply@garbar.tech",
    );
  }
});

test("legal pages fit mobile and desktop in both themes and pass accessibility checks", async ({
  page,
}, testInfo) => {
  for (const path of ["/es/privacy/", "/terms/", "/ca/delete-account/"]) {
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    for (const theme of ["light", "dark"]) {
      await page.evaluate((theme) => {
        document.documentElement.dataset.theme = theme;
      }, theme);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (path === "/ca/delete-account/")
        await expect(page.locator(".legal-request a.button")).toBeInViewport({
          ratio: 1,
        });
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(
        result.violations.map(({ id, nodes }) => ({
          id,
          nodes: nodes.map(({ target, failureSummary }) => ({
            target,
            failureSummary,
          })),
        })),
      ).toEqual([]);
      if (path === "/es/privacy/" || path === "/ca/delete-account/")
        await page.screenshot({
          path: `artifacts/legal-${path.includes("delete-account") ? "deletion" : "privacy"}-${testInfo.project.name}-${theme}.png`,
        });
    }
  }
  await page.setViewportSize({ width: 320, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
