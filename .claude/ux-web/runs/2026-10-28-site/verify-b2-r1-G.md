## UX web verify — run 2026-10-28-site, round 1, area G (WP71, WP72, WP73) — 2026-11-01

**Verdict:** all nine findings fixed; one polish regression (R1G-1).
**Evidence used:** the run's own diff (`ux-web.sh diff`) of every changed file; renders and AUDIT.md re-made 2026-11-02 01:15–01:19, newer than every changed source file (latest 00:28); the testers' results as listed in the delegation. The device checks (Android Back, bfcache Back, a real contrast theme, NVDA, older Safari) are still open.

### Findings

| ID | Result | Evidence |
|---|---|---|
| WEB-1601 | fixed | `src/components/Header.tsx:60-64`: `focusout` closes the menu when `relatedTarget` is a node outside it, and ignores `null` (Safari taps). `:36-41, :49-51`: Escape runs `shut()`, which moves focus to the summary only if it was inside. Tests pass at 390 × 664 and 320 × 256, light and dark, with axe. |
| WEB-1602 | fixed | `Header.tsx:27-47`: a `CloseWatcher` is made on `toggle` when open and destroyed by `stopWatching()` on every other close, because the `toggle` event fires for outside taps, links and focus leaving too. `Icon.tsx`: `close` paths. `global.css:1077-1081`: CSS swaps ≡/✕ on `[open]`, so it works without JS. The name stays “Menu”/«Menú». Renders `home-menu.en.mobile.{light,dark}.fold.png` and `privacy-menu.es.mobile.light.fold.png` show ✕ Menu/Menú on the open pill. `not-found.en.mobile.light.fold.png` shows ≡ on the closed one. |
| WEB-1604 | fixed | `global.css:1408-1432`: `@media (max-height: 480px)` makes the header `relative` and sets `scroll-padding-top: 16px`. The implementer added negative `scroll-margin-top` (-106/-88, -75 ≤800 px, -65 ≤580 px) so an anchor lands on the heading. I checked them against the paddings: `.section-space` 106/75/65 (`:135-137, :1184, :1303`) and `.faq-section` 88 > 800 px (`:763-768`). At ≤800 px, the later `.section-space` rule overrides the FAQ to 75/65, and the scroll-margin rules follow the same cascade. Nothing is cut off. Tests pass at 844 × 390 and 320 × 256; the header stays sticky at 390 × 664 and 720 × 500. |
| WEB-1603 | fixed | `src/components/LanguageSwitch.tsx:23-26`: links to addresses in `followsVisitor` carry `?lang=`. `src/proxy.ts:247-288`: a valid `lang` sets `taskflow-lang` (Path=/, a year, Lax, Secure on https) and answers 307 to the clean address with `private, no-store`. The English 200 now has `private, no-cache`, and `Vary` is kept. Tests pass both without JS and before hydration. bfcache Back is a device check. |
| WEB-1606 | fixed | `LanguageSwitch.tsx` `as="group"` renders `div role=group aria-label`. `Footer.tsx:54-58` uses it. AUDIT.md: 0 “appears 2 times”. No CSS selector depended on the `nav` element (`.footer-top nav` is a different nav, and `.header-menu-panel nav:not(.language-switch)` is unaffected). The footer looks the same in `home.ca.desktop.light.full.png`. |
| WEB-1608 | fixed | `global.css:1452-1455`, inside `forced-colors: active`: `.language-switch a[aria-current="page"]:not(:focus-visible) { outline: 2px solid CanvasText; outline-offset: -2px }`. The test passes in the header and the menu, light and dark. A real contrast theme is a device check. |
| WEB-1605 | fixed | `src/content/site/{en,es,ca}.ts:35`: Privacy Policy / Política de privacidad / Política de privacitat. `src/styles/legal.css:325`: `font-size: 1rem`, and `.footer-operator` stays 0.875rem (`:335-338`). The 320 px crops (es, ca) show the row wrapping cleanly. AUDIT §5: 0 under 44 px. |
| WEB-1607 | fixed | `src/components/NotFoundPage.tsx:17-32` sets `document.title` in the address's language and re-applies it on `<head>` mutations, guarded so it doesn't loop. `src/app/not-found.tsx:6`: the static Catalan part is now «No hem trobat aquesta pàgina». AUDIT §11 rows 693-695 show the three single-language titles. |
| WEB-1609 | fixed | `{en,es,ca}.ts:41`: `Google LLC.`. `global.css:938-940` `.footer-fine p` and `:994` `.not-found p` have `text-wrap: pretty`. In the 320 px crops, «de Google LLC.» stays together (es, ca). `not-found.en.mobile.light.fold.png`: the last line is “TaskFlow website.” |

### Regressions

**R1G-1 · Severity 1 · Footer legal row now outranks the site's own links**
- Where: `src/styles/legal.css:325` (`.site-footer .footer-legal`, now 1rem regular) against `src/styles/global.css:911-920` (`.footer-top nav a`, 0.875rem/650 muted). Every page's footer, all languages, most visible on the phone (`home.{es,ca}.mobile-w320.light.full.png`, last screen) and desktop (`home.ca.desktop.light.full.png`).
- What happens: the footer's site navigation, which includes the primary action “Try it with your voice”, is now smaller and greyer than the legal links below it. In the footer, legal now reads as the main content and the try-it link as small print.
- Fix: give `.footer-top nav a` `font-size: 1rem` as well, keeping weight 650. One line, no new copy. The links are 44 px tall and already wrap at 320 px.
- Verify: at 390 × 664 and 320 × 568, `.footer-top nav a` and `.footer-legal a` both compute to 16 px, nothing scrolls sideways, and the targets stay ≥ 44 px (AUDIT §5).
- Evidence: seen in current renders, and verified in code.

### Not regressions, checked
- Legal pages at 844 × 390 (wider than 800 px): `.legal-sidebar` stays `sticky; top: 100px` (`legal.css:161-165`) while the header now scrolls away. This leaves a 100 px band above the sidebar where the main column shows; nothing is covered or lost.
- CloseWatcher and Escape on Chrome desktop: whichever runs first (keydown or the close request), the other finds the menu closed or the watcher destroyed. Focus moves only if it was inside the menu.
- `?lang=en` on the current-language link (`/` English) makes one extra 307 to the same page. This is harmless.
- `proxy.ts`'s `/delete-account/` matcher and the other content diffs (hero `free`, FAQ, demo strings) belong to other packages (WP261 and areas H/F/L). I didn't judge them here.
