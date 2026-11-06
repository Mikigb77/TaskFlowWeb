## UX web verify — run 2026-11-06-pages, round 2, WP274 (area L) — 2026-11-06

**Verdict:** Ship. WEB-2107 is fixed. The release doc has its meeting-notes evidence and the Vertex AI reference back, byte for byte as at 20e6826, and c77deb1's dictation sentence is kept. No regressions.

**Scope:** the package's own copy, `/root/.taskflow-tools/wt/2026-11-06-pages-r2-WP274` (HEAD 0014f62 plus the run's earlier work), read through `waves.py diff`. It changes `docs/LEGAL_RELEASE.md`, adds `tests/support/legal-release-meetings-20e6826.md` (the tester's fixture) and appends a block to `tests/ux-web-legal-meetings.spec.ts`. No page renders this doc, so I read no renders. Evidence comes from the code and `git` in the copy, plus the tester's passing tests. I ran no npm or Playwright.

### WEB-2107 · S2 · fixed
- **Acceptance 1:** `docs/LEGAL_RELEASE.md` contains ‘finished or not’ once and ‘7 days after the app first asks about it’ once. It contains neither ‘Discard deletes it at once’ nor ‘A stopped recording left unanswered is finished into a note on the phone after 7 days’ (grep counts 1/1/0/0). That is exactly what `tests/ux-web-legal-meetings.spec.ts:91-97` asserts. The tester reports it passing on desktop and mobile.
- **Acceptance 2:** the headings are, in order, `## Evidence behind deletion wording` (:22), `## Evidence behind meeting-notes and AI wording` (:32), `## Operating the published policy` (:42), and the new heading appears once. Single blank lines sit around the section (`cat -A`, :31, :33, :41). I checked independently that `git show 20e6826:docs/LEGAL_RELEASE.md | sed -n 32,40p` equals the fixture with `diff`, which found no differences. The tester's test compares the file's section with that fixture byte for byte.
- **Acceptance 3:** Primary references (:62) read `[Google Cloud service terms](https://cloud.google.com/terms/service-terms) (Vertex AI), [Google Cloud processing terms](…) and [Google Workspace processing terms](…)`. The file has no `ai.google.dev` and no ‘Gemini API terms’ anywhere (grep count 0). The rest of the line is unchanged.
- **Acceptance 4:** the dictation sentence is still in the opening paragraph (:3). In the copy, `git diff 20e6826 -- docs/LEGAL_RELEASE.md` shows only that sentence, a single hunk at line 3. `git status` lists `docs/LEGAL_RELEASE.md`, the two test files and the run's own WD36 files and records, which the conventions name. Nothing in `src/content/legal/` or `company.json` changed, so there is no version move, and none is needed. The tester reports that `tests/ux-web-legal.spec.ts:1452` and `legal:check` passed.
- **The restored text still holds against the app today** (spot check, app repo at its current checkout):
  - MN-24–MN-27 and MN-34 are in `../TaskFlow/App/docs/MEETING_NOTES.md:62-65,90`.
  - `AI_MEETING_PIECES_PER_MONTH` defaults to 240 (`../TaskFlow/Backend/config/settings.py:140`).
  - `sweep()` is at `../TaskFlow/Backend/core/meetings.py:642`.
  - `unanswered = Duration(days: 7)` and `stopQuiet()` are at `../TaskFlow/App/lib/services/meeting_store.dart:39,671`.
  - The `interrupted` and `discarding` phases are at `../TaskFlow/App/lib/models/meeting.dart:12,27`.
  - ‘Almost nothing was heard. Make notes anyway?’ is `meetingQuietQuestion` (`app_en.arb:4076`).
  - Commit `aa627da` exists.

### Regressions
None.
- The only site file that changed is a release record that no page renders, so there is nothing to render, no visitor-facing copy and no faithfulness change. The published legal text is untouched.
- The new test block and its fixture add no visitor-facing content.
- One wording difference is already known: MN-25 says Discard deletes the server meeting ‘at once’, while the restored bullet says ‘as soon as the phone reaches it’. This text was signed off at 20e6826 and is the wording privacy §7 already uses. The brief asked for it unchanged, so it isn't a regression.

### Memory notes
- When a merge drops committed text from `docs/LEGAL_RELEASE.md`, compare the commit that last had the text, `git show <commit>:file | sed -n a,bp`, against the restored block with `diff`. Running `git diff <commit> -- file` in the package copy is the quickest way to prove that only the intended difference is left. The package copy is a git worktree, so git works there even though the build mirror has no `.git`.
