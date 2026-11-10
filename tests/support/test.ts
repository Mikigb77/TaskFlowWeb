// The site starts dark unless the visitor chooses light (WD39, 2026-11-10). A test run in
// the light colour scheme stands for a visitor who chose light, so its page starts with that
// choice stored, unless the test already stored one. Every spec imports test from here.
import { test as base } from "@playwright/test";

export * from "@playwright/test";

export const test = base.extend({
  page: async ({ page, colorScheme }, use) => {
    if (colorScheme === "light")
      await page.addInitScript(() => {
        try {
          if (!localStorage.getItem("taskflow-theme")) localStorage.setItem("taskflow-theme", "light");
        } catch {}
      });
    await use(page);
  },
});
