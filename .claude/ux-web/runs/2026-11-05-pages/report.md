# UX web loop: run 2026-11-05-pages, close (2026-11-05)

**Verdict:** Clean close. Every finding the run fixed is verified in code and by Playwright tests (Chromium). Nothing is still open and nothing went to the owner. All 11 findings still need a check on a real device or by a person, so they're filed as `device-check` in `.claude/ux-web/ISSUES.md`. The only owner decision in this run is WD36 (WEB-2002, the FAQ's Pro list), raised at planning, and it is still open.

Branch note (from fix-args): this cloud session runs on `claude/project-thread-xqvgpc`, not `dev`.

## Verified (code and tests, Chromium), still needing a device or a person
| ID | Sev | Title | Package | Left for a device or person |
|---|---|---|---|---|
| WEB-1901 | S3 | Privacy §7: 7-day rule names a case the app lacks | WP270 copy, landed by WP272 | Native ES/CA read; on a real phone, an interrupted recording left unanswered becomes a note 7 days after the app asks |
| WEB-1902 | S2 | Privacy §7 omits finished meetings whose notes weren't saved | WP272 | Native ES/CA read |
| WEB-1903 | S2 | Privacy §7: offline Discard doesn't reach the server at once | WP272 | Real phone: Discard in airplane mode, then online, and the meeting is gone from the server |
| WEB-2003 | S1 | Privacy §7's 7-day rule omits the quiet-Stop case (regression R1-WP270-1) | WP272 | Real phone: a quiet Stop left unanswered becomes a note after 7 days; native CA read |
| WEB-2004 | S1 | Spanish meeting bullet ends on one word at 390 px (regression R1-WP270-2) | WP272 (no-break space in «sus reuniones.») | Safari on a real iPhone |
| WEB-1502 | S2 | Summary 02's last line on a phone (its own test's regression) | WP271 (`text-wrap: pretty` on `.legal-summary p`) | Safari on a real iPhone at 390 px, /es/privacy/ (older Safari lacks `text-wrap: pretty`) |
| WEB-2001 | S2 | Terms say check AI notes before saving; meeting notes save themselves | WP271 | Native ES/CA read of terms §5 |
| WEB-1904 | S2 | Catalan says «gravar» for meetings; the app says «enregistrar» | WP271, and WP272 for §7 | Native CA read of summary 02, §2, §4, §7 |
| WEB-1905 | S1 | Summary 02: a meeting is more than "your words" | WP271 | Native ES/CA read |
| WEB-1906 | S1 | Privacy §4: meeting text missing, "outside the EU" said three times | WP271 | Native ES/CA read of §4 |
| WEB-1907 | S1 | Privacy §3 and §9 don't mention meetings | WP271 (plus the §9 comma for R1-WP271-1) | Native ES/CA read of §3 and §9 |

Two regressions were cleared inside their own packages and needed no ledger ID:
- **R1-WP271-1:** the ES/CA §9 list had two «y»/«i» in a row. The added comma fixed it, confirmed in WP271's second check.
- **R1-WP270-1 and R1-WP270-2:** re-planned in round 2 as WEB-2003 and WEB-2004, and fixed by WP272.

**Plan acceptance changed on purpose:** WP270's plan acceptance 3 checked for 'pressed Stop' / «pulsaras Parar» / «premessis Atura». WEB-2003 replaced that wording on purpose, and the test now checks that the sentence names the app's question and not Stop.

## Still open
None from this run.

## Escalations
None.

## Checks for a real device or a person
- Native Spanish and Catalan reads of:
  - summary 02;
  - privacy §2, §3, §4, §7 (the meeting bullet, including «por la que la app te pregunta… de que te pregunte» and «pel qual l'app et pregunta… que te'n pregunti») and §9 (including the new comma);
  - terms §5.
- On a real phone:
  - press Discard in airplane mode, then go online, and check the meeting is gone from the server;
  - an interrupted recording left unanswered becomes a note 7 days after the app first asks;
  - the same for a quiet Stop left unanswered.
- Safari on a real iPhone at 390 px:
  - /es/privacy/ summary 02 (`text-wrap: pretty`);
  - the Spanish §7 bullet's last line.

## Files changed
**The site and its tests.** Per `git status --porcelain`, none holds another session's uncommitted work:
- `docs/LEGAL_RELEASE.md` (lines 37-38)
- `src/content/legal/en.ts`, `src/content/legal/es.ts`, `src/content/legal/ca.ts`
- `src/styles/legal.css` (`.legal-summary p`, `text-wrap: pretty`)
- `tests/ux-web-legal.spec.ts`
- `tests/ux-web-legal-meetings.spec.ts` (new, untracked)
- `tests/ux-web-voice.spec.ts`: WEB-1312's file scan now allows «enregistrament» under `src/content/legal/`, to match WEB-1904 and WEB-1907. This edit is the run's own (10:39 UTC). No package's merge record lists it.

**The loop's files:**
- `.claude/ux-web/ISSUES.md`
- `.claude/ux-web/runs/2026-11-05-pages/` (untracked: plan.json, plan-r2.json, plan.md, the reviews, the verify notes, merges.jsonl, fix-args.json, unmerged-WP270.patch; plus report.md once saved)

## Verified findings now protected by a test
- WEB-1901, WEB-1902, WEB-1903: `tests/ux-web-legal-meetings.spec.ts:60` (exact text, and the 7-day sentence names the app's question), `:103` (390 px, inside the column, axe), `:133` (320 px reflow)
- WEB-2003: `tests/ux-web-legal-meetings.spec.ts:60`
- WEB-2004: `tests/ux-web-legal-meetings.spec.ts:194`
- WEB-1502: `tests/ux-web-legal.spec.ts:2027`, `:2430`
- WEB-1905: `tests/ux-web-legal.spec.ts:2455`
- WEB-2001: `tests/ux-web-legal.spec.ts:2469`
- WEB-1904: `tests/ux-web-legal.spec.ts:2490`, plus `tests/ux-web-legal-meetings.spec.ts:60` for §7
- WEB-1906: `tests/ux-web-legal.spec.ts:2513`
- WEB-1907: `tests/ux-web-legal.spec.ts:2534`
- WP271 as a whole: axe on privacy and terms (`:2547`) and reflow at 320 px and text 200% (`:2575`)

## Packages set aside unmerged
- **WP270** (round 1): set aside because its own WEB-1502 summary test failed in its copy. That copy lacked WP271's CSS, which merged separately. Patch: `/home/claude/TaskFlowWeb/.claude/ux-web/runs/2026-11-05-pages/unmerged-WP270.patch`. WP272 re-landed this patch in round 2. Its verifier compared the two line by line: they are identical apart from the no-break space and the WEB-2004 test. So nothing from WP270 is lost, and the patch is now history.

## Packages merged
- **WP271** (round 1): WEB-2001, WEB-1904, WEB-1502, WEB-1906, WEB-1905, WEB-1907. Merged with no conflicts. Notes: verify-r1-WP271.md, verify-r1-WP271-2.md.
- **WP272** (round 2): WEB-1901, WEB-1902, WEB-1903, WEB-2003, WEB-2004. Merged with no conflicts. Notes: verify-r2-WP272.md.

## Final checks
- After round 1: passed.
- After round 2: passed. This was a re-check of the round's changes and of the specs that failed before, not the whole suite.

## Ledger
- In `.claude/ux-web/ISSUES.md`, the lines for WEB-1502, WEB-1901–1907, WEB-2001, WEB-2003 and WEB-2004 moved from Open to Device check, each with what was done, its verify notes, its tests and what's left.
- WEB-2002 stays under Decision needed (WD36).
- No new IDs were needed. The highest is still WEB-2004.
- I didn't change the notes line at the top of ISSUES.md: it names this run's WP270 and WP271 but not WP272.