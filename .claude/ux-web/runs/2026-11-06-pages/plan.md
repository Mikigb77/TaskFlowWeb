# Plan — run 2026-11-06-pages (the home's meetings card and the FAQ's Pro sentence, WD36)

One package, WP273, corrects this run's own uncommitted WD36 change in place. It covers the meetings card's copy, heading and example note, and the Spanish and Catalan FAQ sentence. One question for the owner (WD37) doesn't block it.

Review: `review-F.md` (features and FAQ), Chromium renders from 2026-11-06 13:52–13:53 UTC, made after the last source edits. This cloud session has no WebKit. The fix-run base (`refs/ux-web/base`, 13:38 UTC) is the same tree as HEAD 0014f62, so no file holds another session's work.

## Decisions for the owner

- **WD37: Should the closing card and the line under the demo name meeting notes?** (WEB-2106, review F's Q-F1)
  - Both lines say "TaskFlow Pro, a monthly subscription: unlimited dictation and file space." (`src/content/site/en.ts:154`, ES 154, CA 160). WD2 and WD14 keep them short on purpose.
  - The options:
    - (a) Keep them as they are.
    - (b) Add EN "and notes from your meetings" / ES «y notas de tus reuniones» / CA «i notes de les teves reunions».
  - **Recommendation: (a).** The meetings card and the FAQ now carry the feature, and these two lines are there to state the free limit. Revisit (b) only if the five-person test shows people miss it. WP273 doesn't touch these lines.

## Packages

### WP273: Meetings card and FAQ: payoff first, the app's Create task review, the note in the app's order (F, M, S2)

Files: `src/content/site/{en,es,ca,types}.ts`, `src/components/HomePage.tsx`, `src/styles/global.css`, `tests/support/ux-web-copy.ts` and `tests/ux-web-features.spec.ts`.

- **WEB-2101 (S2):** "Turn the to-dos into a task with a checklist in one tap" isn't true as written. Create task opens the app's review, where you check the to-dos and then tap Add task. The new sentence uses the button's name and follows the voice card: "Create task turns the to-dos into a task with a checklist: check it, then add it."
- **WEB-2102 (S1):** the card now opens with what you get, then the steps: "With TaskFlow Pro, record a meeting and get its notes: a summary, the to-dos, the decisions and the open questions." Every WD36 fact stays in. The payoff is now on line 1, and the card grows by a few words (EN 54 → 59, ES 57 → 61, CA 59 → 66), because the first sentence says plainly that TaskFlow records the meeting, as you asked. The reviewer counted 50 words for the new EN text; the real count is 59.
- **WEB-2103 (S1):** the heading becomes the app's own phrase, "Your meetings become notes" / «Tus reuniones se convierten en notas» / «Les teves reunions es converteixen en notes». It no longer starts with "Notes" right after "Notes, checklists and files".
- **WEB-2104 (S1):** the example note follows the app's note page:
  - the to-dos come first, under "Checklist · 0/2" / «Pasos · 0/2» / «Passos · 0/2»;
  - then a thin line and "Meeting on Tuesday · 42 min", the summary, Decisions, and Create task;
  - the pill loses its check icon;
  - the summary gets `text-wrap: pretty`, so the Catalan no longer ends on one word at 320 px.
- **WEB-2105 (S1):** in the FAQ, Spanish «hace notas» becomes «toma notas» and Catalan «fa notes» becomes «pren notes». The English stays.
- **WEB-2002 (S2):** WD36's FAQ clause, now built. It's checked and closed with this package.

The Catalan third sentence opens «El botó Crea una tasca converteix…». The review had «Crea una tasca converteix…», but an imperative button name as the subject reads as a command in Catalan. That's my change, and it's down for a native read with the rest of the new Spanish and Catalan.

## Not planned

- The reviewer's idea of saying that recording carries on without signal (MN-11) isn't a finding. The card is already the page's longest, so it isn't added.
- Nothing was skipped.

## Round 2

After round 1, WP273 is merged and its findings were checked on their own. The final check still fails one test that the tester's repair couldn't clear, because its cause is committed and older than this run. One small package fixes it. Nothing new goes to the owner.

### WP274: Release doc: restore the meeting-notes evidence a merge dropped (L, S, S2)

Files: `docs/LEGAL_RELEASE.md` (and `tests/ux-web-legal-meetings.spec.ts`, only if the tester adds one check).

- **WEB-2107 (S2, new regression):** `tests/ux-web-legal-meetings.spec.ts:91` fails at `toContain("finished or not")`. Merge d9f0a3d (another session, 2026-11-06, in HEAD through PR #26) took c77deb1's side of `docs/LEGAL_RELEASE.md`. That side dropped the section "Evidence behind meeting-notes and AI wording" (Pro only, 20 hours a month, MN-24 to MN-27, Vertex AI only) and put "[Gemini API terms]" back in Primary references. The fix restores both, word for word from 20e6826, and keeps c77deb1's dictation sentence.

Why it isn't a decision: the published privacy pages are already right. They say Vertex AI and link Google Cloud's service terms. Only the release record lost its evidence. Nothing in `src/content/legal/` or `company.json` changes and there's no version move. The owner already signed off version 2026-11-06 with meeting notes (`.claude/ux-web/DECISIONS.md:15`).
