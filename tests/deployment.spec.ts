import { test, expect } from "@playwright/test";

test("the public preview is healthy and excluded from search indexing", async ({
  request,
}) => {
  const health = await request.get("/health/");
  expect(health.status()).toBe(200);
  expect(await health.json()).toEqual({
    status: "ok",
    commit: expect.any(String),
  });
  expect(health.headers()["cache-control"]).toBe("no-store");

  const home = await request.get("/");
  expect(home.status()).toBe(200);
  expect(home.headers()["x-content-type-options"]).toBe("nosniff");
  expect(home.headers()["permissions-policy"]).toContain("microphone=()");
  expect(await home.text()).toContain(
    'name="robots" content="noindex, nofollow"',
  );

  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain("Disallow: /");
  expect(await (await request.get("/sitemap.xml")).text()).not.toContain(
    "<loc>",
  );
});
