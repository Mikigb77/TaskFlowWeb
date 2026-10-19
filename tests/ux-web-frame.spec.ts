// Acceptance tests for the frame (header, phone menu, footer) from the UX web loop, run
// 2026-10-18-site, that prove held changes: WP33's footer link (Footer.tsx holds the other
// session's uncommitted work). This file stays uncommitted with it. See tests/support/ux-web.ts.
import { expect, test } from "./support/ux-web";
import { TRY_VOICE } from "./support/ux-web-copy";

test.use({ colorScheme: "light" });

test("WEB-6: no link anywhere on the homes or /privacy/ leads to the removed walkthrough (#demo)", async ({
  page,
}) => {
  const found: string[] = [];
  for (const url of ["/", "/es/", "/ca/", "/privacy/"]) {
    await page.goto(url);
    // Every link in the document: header, phone menu (open or not), main and footer.
    const links = await page
      .locator("a[href]")
      .evaluateAll((anchors) =>
        anchors
          .map((a) => `${a.textContent?.trim()} → ${a.getAttribute("href")}`)
          .filter((link) => link.endsWith("#demo")),
      );
    found.push(...links.map((link) => `${url}: ${link}`));
  }
  expect(found, "links to #demo").toEqual([]);
});

test("WEB-6: the footer's demo link reads ‘Try it with your voice’ and brings the live demo into view", async ({
  page,
}) => {
  await page.goto("/");
  const footer = page.locator("footer");
  await expect(footer.getByRole("link", { name: /try the demo/i })).toHaveCount(0);
  const link = footer.getByRole("link", { name: TRY_VOICE.en, exact: true });
  await expect(link).toHaveCount(1);
  await expect(link).toHaveAttribute("href", "/#voice");
  await link.click();
  await expect(page).toHaveURL(/\/#voice$/);
  await expect(page.locator("#voice")).toBeInViewport();
});
