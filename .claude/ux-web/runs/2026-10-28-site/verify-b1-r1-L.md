## UX web verify — run 2026-10-28-site, round 1, area L (WP65, WP66) — 2026-11-01

**Verdict:** Ship. All nine findings are fixed as briefed. I found no regressions in the changed files or the pages they touch.

**Evidence base:**
- The run's own diffs (`ux-web.sh diff`) for `src/components/LegalPage.tsx`, `src/styles/legal.css`, `src/content/legal/{en,es,ca}.ts`, `company.json` and `docs/LEGAL_RELEASE.md`.
- Renders from 2026-11-01 19:08–19:10 and `AUDIT.md` from 19:13. Both are newer than the code (17:41), so they count as evidence.
- The testers' passing specs, as listed in the delegation. I ran no npm or Playwright.

### WP65

**WEB-1501 — fixed.**
- `LegalPage.tsx:124-131`: the back link renders only when `document !== "delete-account"`. `LanguageSwitch` now sits in the top `.legal-utility` row on every legal page.
- The second row (old `:168-172`) and `.legal-utility--languages` are gone.
- Renders:
  - `delete-account.en.mobile.light.fold.png`: English, Español and Català are in the first screen, above the h1.
  - `delete-account.es.mobile.light.fold.png`: the switch, the h1 and «Escribir solicitud de eliminación» all fit in the first screen.
  - `delete-account.ca.mobile-w320.light.fold.png`: the email button ends at about y 566 of 568.
- `legal.css:453-457` hides `.legal-page--deletion .legal-version` at 360 px and below. The brief allowed this as a fallback if Catalan didn't fit, and the 320 render shows it was needed.
- AUDIT §9, mobile rows: «Idioma del documento» comes before the request region. AUDIT §4 shows 0 axe violations on all delete rows.

**WEB-1504 — fixed.**
- `legal.css:340-350`: `@media (min-width: 64.0625em)` hides `.legal-languages` and the delete page's `.legal-utility`.
- On desktop, AUDIT §9 lists no “Document language” / «Idioma del documento» row. The two “Language” navigations left are the header's and the footer's.
- Renders: `delete-account.es.desktop.light.fold.png` has no empty row, and its h1 top is about y 210, against about 255 on `privacy.es.desktop.light.fold.png`.
- `delete-account.ca.desktop-text200.light.fold.png`: with Menu in the header, the page's pill still shows.

**WEB-1505 — fixed.**
- `legal.css:48`: `hyphens: manual`. `overflow-wrap: break-word` and `text-wrap: balance` are kept.
- `legal.en.mobile.light.fold.png` reads “Legal notice: / the company / behind TaskFlow”, and `terms.es.mobile-w320.light.fold.png` reads «Términos y / condiciones / de TaskFlow». Neither hyphenates.
- AUDIT §3: no sideways scroll and no clipped text on any legal page at text200, zoom200 or w320.

### WP66 (copy matches the brief character for character in the diffs)

**WEB-1502 — fixed.**
- Summary 02 matches the brief in EN, ES and CA (`en.ts:10`, `es.ts:10`, `ca.ts:10`).
- §4's Pro sentence matches the brief in all three languages. Its last sentence is kept.
- §2's Organisation list reads “dates, reminders, priorities” / «fechas, recordatorios, prioridades» / «dates, recordatoris, prioritats».
- Seen in the render: `privacy.es.desktop.light.fold.png`, card 02.

**WEB-1507 — fixed.**
- §2's Files sentence is replaced in all three languages, as briefed.
- Searching `src/` finds no “cloud backup”, «copia en la nube o el uso» or «còpia al núvol o la compartició».

**WEB-1302 — fixed.**
- Legal half: §8's sentence now ends “…or when a recording reaches its one-minute limit.” / «…o cuando una grabación llega a su límite de un minuto.» / «…o quan una gravació arriba al seu límit d’un minut.»
- No legal sentence still ends “only when you tap Done.” / «solo cuando tocas Listo.» / «només quan toques Fet.».
- Demo half (WP63): the demo's privacy line says “…when you tap Done or the minute is up.” (`site/en.ts:153`, `es.ts:153`, `ca.ts:159`). The WP63 test that Close demo works while listening passes.

**WEB-1503 — fixed.**
- English terms §3 says “optional AI”, and §5 begins “The AI is optional.”
- `en.ts` has no “turns what you say into tasks” and no “AI capture”.
- The ES and CA terms are untouched.

**WEB-1506 — fixed.**
- §8 (`id: "website"`) has no `links` in any language.
- §5 still links `https://www.cloudflare.com/privacypolicy/` (`en.ts:94`, `ca.ts:94`, and the same in ES).

**WEB-1509 — fixed.**
- Right after the “just one person’s tasks” sentence, §5 now reads “Reminders aren’t shared: each person has their own.” / «Los recordatorios no se comparten: cada persona tiene los suyos.» / «Els recordatoris no es comparteixen: cada persona té els seus.»
- Nothing else in §5 changed.

**Version.**
- `company.json:10` is `2026-11-01`, and `docs/LEGAL_RELEASE.md:3` says “1 November 2026”.
- The renders show “In force since 1 November 2026”, «En vigor desde el 1 de noviembre de 2026» and «En vigor des del 1 de novembre del 2026».
- The tester reports that `legal:check` is valid.

### Regressions

None.

Looked at and not counted:
- **The version line on 320 px delete pages.** Under 360 px the delete page drops “In force since …” in every language, not only in Catalan. The brief sanctioned this, the date is still in the full document below, and it doesn't hide anything the Leaver needs to act.
- **No back link on the delete page.** The brief made this choice; the logo and the footer still lead home.

### Device checks still owed

These are carried over from the packages:
- The owner's WD3 sign-off of version 2026-11-01. This includes the §5 sentence.
- A native Catalan read of the new clauses in summary 02, §2, §4 and §8, and a native Spanish read of the new §8 clause.
- On a real phone: «Español» visible in the first screen from the Play deletion link, and the screen reader announcing the language navigation before the request.
