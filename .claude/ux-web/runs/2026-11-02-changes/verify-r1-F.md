## UX web verify — run 2026-11-02-changes, round 1, area F (WP269) — 2026-11-02

**Verdict:** Ship. Both findings are fixed with the brief's exact copy in all three languages; no regressions in the changed files or the home they touch.

**Scope:** WP269 (WEB-1701, WEB-1702). Changed files read through `ux-web.sh diff`: `src/content/site/{en,es,ca}.ts`, `tests/support/ux-web-copy.ts`, `tests/ux-web-features.spec.ts`. The other modified files in `git status` (legal content, `docs/LEGAL_RELEASE.md`, `tests/legal.spec.ts`, `tests/ux-web-legal.spec.ts`) are WP268's and were not judged here.

**Evidence levels:** code (exact string comparison against the brief, done with a script); the testers' Playwright runs in Chromium (opened answers, 320 px, desktop at 200% text, axe in light and dark); `AUDIT.md` §3 and §4 (FAQ closed). No render shows the third or fourth answer open (`INDEX.md` lists only the first, second and fifth), so the open state rests on the tests. Renders and audit (05:01–05:28 UTC) are newer than the content files (04:57 UTC).

### WEB-1701 · fixed
- `src/content/site/en.ts:102`, `es.ts:102`, `ca.ts:108` hold the brief's account answer exactly (compared byte for byte, ’ in EN and CA).
- Names the app's buttons as the ARBs do: `continueWithGoogle` / `continueWithEmail` (`../TaskFlow/App/lib/l10n/app_en.arb:2178-2179`, `app_es.arb:1116-1117`, `app_ca.arb:820-821`). No "sign in" / «Inicias sesión» / «Inicies la sessió» left anywhere in `src/` (grep).
- WEB-708 holds: before the semicolon only Google; password and code come after the email button. The code's name matches `verifyEmailHelp` («código de 6 cifras», «codi de 6 xifres», `app_es.arb:458`, `app_ca.arb:437`).
- EN 40 words, longest sentence 23. Tests pass: exact copy, both buttons, no sign-in, password present, order around the semicolon, 320 × 800 for es/ca with no sideways scroll, desktop text200 nothing clipped, axe clean light and dark. `AUDIT.md` §3: home es/ca text200 and w320 rows "no | none".
- Still for a person: native ES/CA reads; a phone check of «Entra o crea tu cuenta» and the email path.

### WEB-1702 · fixed
- Only the last sentence of the voice answer changed (`en.ts:107`, `es.ts:107`, `ca.ts:113`), to the brief's exact text; the rest is word for word (diff).
- Now uses the offline answer's wording (`en.ts:117`, `es.ts:117`, `ca.ts:123`: "understanding what you say" / «entender lo que dices» / «entendre el que dius»). True of D1 (`../TaskFlow/.claude/ux-review/DECISIONS.md:7`, `captureOffline`, `app_en.arb:1767`): the offline path is the answer about offline use, and nothing new was added here, as the brief asks.
- EN 88 words, longest sentence 24 (at the cap, not over). WEB-1001's cap raised 85 → 88 in name and assertion (`tests/ux-web-features.spec.ts:809-819`), as the brief settled. `AUDIT.md` §4: "No violations on any page."
- Still for a person: native ES/CA reads; the app's airplane-mode dictation check (UX-2612).

### Regressions
None. Checked:
- no leftover old strings in `src/` or `tests/` (only the new test's negative regex holds "It needs the internet");
- the hero/card offline line (`en.ts:81`, `es.ts:81`, `ca.ts:87`) and the offline answer still agree with the new sentence;
- old copy fixtures (`FAQ_FIRST`, `FAQ_REST`, `VOICE_ANSWER`) all updated, so WEB-708, WEB-1403 and the FAQ word-for-word test compare against the new copy;
- the acceptance block sits at the end of the spec with nothing else reordered.

Observation, not a regression: the 200% text test runs on desktop only; on the phone at 200% the opened account answer has no test. It is plain wrapping text in an existing `details` that other answers already pass at mobile text200, so the risk is low.
