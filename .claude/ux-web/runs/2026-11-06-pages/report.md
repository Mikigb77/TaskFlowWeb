# UX web loop run 2026-11-06-pages: report (close, 2026-11-06)

**Verdict:** Clean close. All 7 findings were fixed, and the reviewer's last check said "fixed" for each one. No test for any of them failed. Both packages were merged and no package was set aside. No regression is open and nothing was escalated. Six findings are now `device-check` and wait only on a person or a real device. One is `verified`.

Evidence: the reviewer read the code and the diffs, and read Chromium renders and the audit (axe and layout) in each package's copy. The tester ran Playwright in Chromium only. There is no WebKit in this Linux cloud session and no real device, so nothing here is a real iPhone or a real phone result.

## Verified (the last check said fixed, and no test for it failed)

| ID | Sev | Title | Package | Ledger status |
|---|---|---|---|---|
| WEB-2107 | S2 | The release doc lost the meeting-notes and Vertex AI evidence | WP274 (r2) | verified |
| WEB-2002 | S2 | The FAQ's Pro list leaves out meeting notes | WP273 (r1) | device-check |
| WEB-2101 | S2 | The meetings card's "in one tap" skips Create task's review | WP273 (r1) | device-check |
| WEB-2102 | S1 | The meetings card leads with steps, not with what you get | WP273 (r1) | device-check |
| WEB-2103 | S1 | Two headings in a row start with "Notes" | WP273 (r1) | device-check |
| WEB-2104 | S1 | The example meeting note doesn't follow the app's note | WP273 (r1) | device-check |
| WEB-2105 | S1 | The ES/CA FAQ «hace notas» / «fa notes» read as calques | WP273 (r1) | device-check |

What was done:
- **WP273**, one fix round (verify-r1-WP273.md, verify-r1-WP273-2.md).
  - The heading is now 'Your meetings become notes' / «Tus reuniones se convierten en notas» / «Les teves reunions es converteixen en notes».
  - The body leads with the payoff, and 'Create task … check it, then add it' replaces "one tap".
  - The ES/CA FAQ sentence is now «toma notas» / «pren notes».
  - The example note follows the app's order: checklist, to-dos, header, summary, Decisions, Create task.
  - Check 1 found two S1 line-break regressions, and both were fixed in check 2:
    - R1-WP273-1: `text-wrap: balance` on `.feature-card h3` (`src/styles/global.css:580`).
    - R1-WP273-2: U+2060 word joiners after the Catalan enclitic hyphens «rep-⁠ne», «revisa-⁠la» and «afegeix-⁠la» in `src/content/site/ca.ts:87`. The same string carries them in `tests/support/ux-web-copy.ts` and in `WP273_BODY`.
  - axe found 0 violations on all 12 home rows, and nothing scrolls sideways at 320 px or at 200% text.
- **WP274**, round 2 (verify-r2-WP274.md).
  - It restored the section 'Evidence behind meeting-notes and AI wording' in `docs/LEGAL_RELEASE.md`, byte for byte from 20e6826.
  - It put the Google Cloud service terms (Vertex AI) reference back in place of '[Gemini API terms]'.
  - It kept c77deb1's sentence about online dictation.
  - No published legal text and no version changed.
  - The regression came from merge d9f0a3d, made by another session and in HEAD through PR #26. This run didn't cause it.

## Still open
None from this run. No regression is open, so no new WEB- IDs were given. The highest ID is still WEB-2107.

WEB-2106 (WD37: whether the closing card and the line under the demo name meeting notes) is still `decision` for the owner. My recommendation is (a), keep them as they are. Nothing waits on it.

## Escalations
None.

## Checks for a real device or a person
- Native Spanish and native Catalan reads of these new strings:
  - the meetings heading (WEB-2103);
  - the meetings body (WEB-2101, WEB-2102);
  - the FAQ's Pro sentence (WEB-2002, WEB-2105).
- On a real phone, Create task on a meeting note opens the review with the to-dos ticked, and Add task saves one task with a checklist (WEB-2101).
- Safari on a real iPhone, at 390 and 320 px (WEB-2103, WEB-2104):
  - the meetings card and its example note;
  - `text-wrap: balance` and `pretty` (older Safari ignores them safely);
  - that WebKit honours U+2060 after a hyphen in the Catalan body.

## Files changed

**Site (and its tests):**
- `docs/LEGAL_RELEASE.md` (WP274)
- `src/components/HomePage.tsx`
- `src/content/site/ca.ts`
- `src/content/site/en.ts`
- `src/content/site/es.ts`
- `src/content/site/types.ts`
- `src/styles/global.css`
- `tests/support/ux-web-copy.ts`
- `tests/ux-web-features.spec.ts`
- `tests/ux-web-legal-meetings.spec.ts` (WP274)
- `tests/support/legal-release-meetings-20e6826.md` (new, untracked; WP274's fixture)

**The loop's records:**
- `.claude/ux-web/ISSUES.md`
- `.claude/ux-web/DECISIONS.md` (the WD36 and WD37 entries)
- `.claude/ux-web/runs/2026-11-06-pages/` (untracked)

**Another session's uncommitted work: none.**
- The fix-run base `refs/ux-web/base` was the same tree as HEAD 0014f62.
- Every uncommitted change that `git status --porcelain` lists belongs to this run: the WD36 meetings card built at the run's start, WP273 and WP274. That includes `src/components/Icon.tsx`, which isn't in the package file list. Its uncommitted change adds the WD36 `people` icon, so it belongs with this run's commit.
- `docs/LEGAL_RELEASE.md` had no uncommitted change before WP274.

## Verified findings now protected by a test
- **WEB-2107:** `tests/ux-web-legal-meetings.spec.ts:91` (fails again if the section is lost), `:236`, `:271`, `:280`.
- **WEB-2101:** `tests/ux-web-features.spec.ts:2029`, `:2041`, `:2059`.
- **WEB-2102:** `tests/ux-web-features.spec.ts:2029`, `:2041`, and the WD36 facts test at `:1931`.
- **WEB-2103:** `tests/ux-web-features.spec.ts:2029`, `:2077`.
- **WEB-2104:** `tests/ux-web-features.spec.ts:2109`, `:2156`, `:2174`, `:2188`, `:2210` (contrast, light and dark), `:2233` (axe, light and dark).
- **WEB-2002 and WEB-2105:** `tests/ux-web-features.spec.ts:2093`.

## Packages set aside unmerged
None. `merges.jsonl` shows WP273 and WP274 applied with no conflicts.

## Final checks
- **After round 1:** passed overall, with one failing spec: `tests/ux-web-legal-meetings.spec.ts` :: "WEB-1901, WEB-1902, WEB-1903: docs/LEGAL_RELEASE.md states the same meeting rules as §7" (desktop and mobile). The cause was WEB-2107, the release doc's lost section. This run's changes didn't cause it, and round 2 re-planned it as WP274.
- **After round 2:** passed. This was a re-check of the round's changes and of the specs that failed before, not the whole suite. The WEB-1901 to WEB-1903 spec passes again. Their ledger lines (device-check) are unchanged.
