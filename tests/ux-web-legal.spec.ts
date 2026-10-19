// Acceptance tests for the legal pages from the UX web loop, run 2026-10-18-site, that prove
// held changes (src/content/legal/ is the other session's untracked work): WP33's privacy §8.
// This file stays uncommitted with it. See tests/support/ux-web.ts.
import { axeViolations, expect, test, THEMES } from "./support/ux-web";

// The exact first paragraph of §8 the plan gives (WP33): today's sentences, words removed.
const FIRST_PARAGRAPH = {
  "/privacy/":
    "The live demo sends audio/text to Google only when you select Create drafts. Its drafts do not synchronise to an app account.",
  "/es/privacy/":
    "La demo en vivo envía audio/texto a Google solo al pulsar Create drafts (Crear borradores); no sincroniza esos borradores con una cuenta.",
  "/ca/privacy/":
    "La demo en viu envia àudio/text a Google només amb Create drafts (Crear esborranys), sense sincronitzar-los amb un compte.",
};
const GONE = ["walkthrough", "recorrido", "recorregut", "separate live demo", "en vivo independiente"];

test("WEB-6: privacy §8 no longer mentions the removed walkthrough, in every language", async ({ page }) => {
  for (const [url, paragraph] of Object.entries(FIRST_PARAGRAPH)) {
    await page.goto(url);
    const section = page.locator("section", {
      has: page.getByRole("heading", { level: 2, name: /^8\./ }),
    });
    await expect(section, url).toHaveCount(1);
    await expect(section.locator("p").first(), url).toHaveText(paragraph);
    const text = ((await section.textContent()) ?? "").toLowerCase();
    for (const words of GONE) expect(text, `${url} §8: “${words}”`).not.toContain(words);
  }
});

for (const theme of THEMES) {
  test.describe(theme, () => {
    test.use({ colorScheme: theme });
    test(`WEB-6: axe reports no violations on /privacy/ (${theme})`, async ({ page }) => {
      await page.goto("/privacy/");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      expect(await axeViolations(page)).toEqual([]);
    });
  });
}
