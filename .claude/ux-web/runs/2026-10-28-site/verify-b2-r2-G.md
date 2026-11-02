## UX web verify — run 2026-10-28-site, round 2, area G (WP267) — 2026-11-01

**Verdict:** WEB-1614 fixed; no regressions.
**Evidence used:** the run's own diff (`ux-web.sh diff`) of `src/styles/global.css` and `tests/ux-web-frame.spec.ts`; renders and AUDIT.md re-made 2026-11-02 02:51–02:52, newer than global.css (02:08). Footer crops were cut with PIL, because `crop.mjs` needs sharp and this checkout has no `node_modules`. The testers reported no results for this package.

### Findings

| ID | Result | Evidence |
|---|---|---|
| WEB-1614 | fixed | `src/styles/global.css:917`: `.footer-top nav a` is now `font-size: 1rem`. Weight 650 (`:918`), `var(--muted)`, the 44 px minimums (`:915-916`), the hover rule (`:922-926`) and the column gaps (`:906-910`, `:1233-1235`, `:1376-1378`) are unchanged. The ≤800 and ≤580 media blocks set no font size on these links, so 16 px holds at every width. `legal.css:325` (`.footer-legal`, 1rem) and `.footer-operator` / `.footer-bottom` (0.875rem) are untouched. Renders: in `home.ca.desktop.light.full.png`, “Prova-ho amb la teva veu · Què fa · Preguntes” now match the legal row's size and are bolder. In `home.{es,ca}.mobile-w320.light.full.png`, the site links are as large as the legal links and heavier, and the © and trademark lines stay smaller. AUDIT §3: no home page scrolls sideways, in any variant. §4: no axe violations. §5: no footer element under 44 px. The tester's WP267 block in `tests/ux-web-frame.spec.ts` asserts 16 px and weight 650 for the site links, 16 px for the legal links, 14 px for the operator and fine print, ≥ 44 × 44 targets and no sideways scrolling, on the three homes at 1440 × 1000, 390 × 664 and 320 × 568, light and dark. |

### Regressions

None.

### Not regressions, checked
- At 320 px, the site navigation wraps to two lines (“Preguntas” / «Preguntes» alone on the second line). At 0.875rem the three links plus two 22 px gaps already exceeded the 280 px container, so it wrapped before too. The wrap is clean, and every target stays 44 px tall.
- The same footer rule draws the footer on the legal pages. AUDIT §3 shows no sideways scrolling on privacy, terms or legal in any variant. The §5 rows under 44 px on privacy desktop are the legal sidebar's table of contents, which this package didn't touch and which was there before.
- The other hunks in the global.css diff (`.hero-free`, the FAQ paragraph spacing, `text-wrap: pretty`, the menu icons, the max-height block, the forced-colours ring) belong to other packages. I didn't judge them here.
