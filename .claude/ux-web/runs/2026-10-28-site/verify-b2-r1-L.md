## UX web verify — run 2026-10-28-site, batch b2, round 1, area L — 2026-11-01

**Scope:** WP261 (WEB-1508, WD27). Evidence: code (`ux-web.sh diff`), the tester's acceptance block in `tests/ux-web-global.spec.ts` (reported passing in the run's whole suite), and the renders and `AUDIT.md` re-made at 2026-11-02 01:17–01:19, after the last code change (00:28). No npm or Playwright run by me.

### WEB-1508 · S3 · Play's one deletion address always opens in English — **fixed**

- (1) Matcher: `src/proxy.ts:98` `config = { matcher: ["/", "/delete-account/"] }`, a build-time literal with a comment pointing at the list; `page()` (`src/proxy.ts:63-66`) normalises the trailing slash, so `/delete-account` and `/delete-account/` are the same entry. Test ‘/delete-account without the slash, from a Spanish browser, ends on /es/delete-account/’ (spec :2195).
- (2) Without `lang`: `chosen()` (cookie, then Accept-Language, never IP) feeds `localisePath(path, language)` → 307 to `/es/delete-account/` or `/ca/delete-account/`; English falls through to `NextResponse.next()` at `/delete-account/`. All seven of WEB-2's cases asserted (spec :2048-2108).
- (3) `?lang=en|es|ca`: `choice()` (`src/proxy.ts:57-60`) → 307 to the clean address in that language with `taskflow-lang=…; Path=/; Max-Age=31536000; SameSite=Lax` (+ `Secure` on https), the same cookie WP72 sets on `/`; any other value (`xx`, `EN`, `fr`, empty) answers as the bare request (spec :2138-2193).
- (4) Headers: `Vary: Accept-Language, Cookie` on every answer the proxy builds; 307s `private, no-store`; English 200 `private, no-cache` with `nosniff` kept; Location built on `origin()` (spec :2110-2136, Host `taskflow-web-example.a.run.app` → `https://taskflow-web-example.a.run.app/es/delete-account/`). Vary on the 200 is not asserted, as for `/` since WP34 (Next overwrites Vary on rendered pages; `private` keeps shared caches out) — same accepted limit, not a gap of this package.
- (5) `src/components/LanguageSwitch.tsx:24-27` `target()`: links whose localised path is in `followsVisitor` carry `?lang=<language>`, so the English link on `/es/delete-account/` and `/ca/delete-account/` is `/delete-account/?lang=en`; `/es/privacy/`'s stays `/privacy/` (spec :1907-1930). No-JS walk: Spanish browser → `/es/delete-account/` → «English» → `/delete-account/` in English with the cookie → reopening stays English (spec :2250-2267).
- (6) One list: `src/content/site/index.ts:18-20` `followsVisitor = ["/", "/delete-account/"]` with a comment naming WD5 and WD27; used by `proxy.ts` and `LanguageSwitch.tsx`; the three stale comments updated (`index.ts:16`, `proxy.ts:9-11`, `LanguageSwitch.tsx:14-15`).
- Privacy §8: `src/content/legal/en.ts:142`, `es.ts:142`, `ca.ts:142` hold the brief's exact sentences; the old wording is gone from `src/content/legal/` (spec :2285-2306). Version stays `2026-11-01` (`company.json:10`, `docs/LEGAL_RELEASE.md:3`, `tests/legal.spec.ts:35`), WP66's date, the day this package's brief ran — correct not to move it.
- Untouched as briefed: canonicals, hreflang, sitemap, `/es/` and `/ca/` delete pages and the other legal pages never redirect (spec :202-210, :2207-2225); footer, 404 and legal-page links to the delete page unchanged; edge worker unchanged (it rewrites any Location starting with the origin, `edge/worker.ts:78-82`).
- Accessibility: `AUDIT.md` §4 "No violations on any page"; §3 privacy es/ca/en at text200, zoom200 and w320: no overflow, no loss. Tester's axe on `/es/` and `/ca/delete-account/` reached through `/delete-account/` and on the three privacy pages, light and dark (spec :2309-2338).
- Nothing visible on the delete page changed, so its Chromium renders (English Accept-Language) are unchanged by design.

### Regressions

None found in the changed files and the pages they touch.

Considered and not counted:
- An English page's own link to `/delete-account/` (footer, privacy §6) now lands a visitor with no saved choice and a Spanish browser on the Spanish page. The brief and WD27 chose exactly this, as WD5 does for the logo and `/`.
- The redirect drops any other query parameter on `/delete-account/` (e.g. a `utm_` tag), as `/` already did; Play's link carries none. Not a visitor-visible problem.

### Device checks (owner, after a deploy)
- Android phone in Spanish, then Catalan: open `https://taskflow.garbar.tech/delete-account/` from a link → Spanish / Catalan page; choose English, reopen → English.
- Play Console's Data safety form accepts `/delete-account/` as the deletion URL.
- Native Spanish and Catalan read of privacy §8's new sentence (WD3 sign-off with WP66's version).
