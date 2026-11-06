# Verify — run 2026-11-06-pages, round 1, WP273 (area F) — 2026-11-06

**Verdict:** all six findings fixed. Two polish regressions (S1), both line breaks on phones that the new copy caused.

**Evidence:** code and diff in `/root/.taskflow-tools/wt/2026-11-06-pages-r1-WP273` (`waves.py diff`), the app repo at `../TaskFlow` (ARB keys, `note_task.dart`, `task_detail_screen.dart`), and the tester's Chromium renders in that copy's `artifacts/ux-web/`. The renders date from 14:40 to 14:43 UTC; the code is from 14:11 to 14:12 UTC, so the renders are newer. I compared them with the pre-run renders in the main checkout (13:53–13:54 UTC). I cropped them with PIL into the scratchpad. I ran no npm or Playwright. I read the tester's results as given: 24 passed and 2 phone-only skipped. No WebKit, and no real device.

## Findings

| ID | Result | Evidence |
|---|---|---|
| WEB-2103 | fixed | `features.meetings.title` is now the app's `billingReasonMeetingNotes` without "With Pro," (`en.ts:80` "Your meetings become notes", `es.ts:80`, `ca.ts:86`; `../TaskFlow/App/lib/l10n/app_en.arb:4461`, `app_es.arb:1505`, `app_ca.arb:1209`). The heading no longer starts with "Notes" after "Notes, checklists and files": the AUDIT.md §12 outline shows `h3 Your meetings become notes`. ES and CA take 2 lines at 320 px (`home.es.mobile-w320.light.full.png`, `home.ca.mobile-w320.light.full.png`). |
| WEB-2101 | fixed | The body's third sentence is now "Create task turns the to-dos into a task with a checklist: check it, then add it." / «Crear tarea … revísala y añádela.» / «El botó Crea una tasca … revisa-la i afegeix-la.» (`en.ts:81`, `es.ts:81`, `ca.ts:87`). That matches the app: `createTaskFromNote` (`../TaskFlow/App/lib/widgets/note_task.dart:139-190`) opens the capture sheet with the steps ticked, and the person saves with `captureAddTask`. "One tap" / «un toque» / «un toc» is left only in the voice card and the voice FAQ (`en.ts:72,121`; `es.ts:72,121`; `ca.ts:78,127`). The button names are exactly `meetingCreateTask` (`app_en.arb:4349`, `app_es.arb:1484`, `app_ca.arb:1188`). |
| WEB-2102 | fixed | The first sentence is now the payoff: Pro, record, get its notes, then the four parts. The how-to comes second. The renders show the notes on line 1–2 at 390 px in ES and CA, where before they were on line 3–4 (`home.es.mobile.light.full.png`, compared with the pre-run render). Record a meeting, Stop / Parar / Atura and "20 hours" are kept, so the WD36 facts stay. |
| WEB-2105 | fixed | ES «También toma notas de las reuniones que grabas, hasta 20 horas al mes.» and CA «També pren notes de les reunions que enregistres, fins a 20 hores al mes.» (`es.ts:110`, `ca.ts:116`). Nothing else in the paragraph changed. Grepping `src/content/site/` finds no «hace notas» or «fa notes». `home-faq-pricing.es.mobile.light.view.png` shows the new sentence. Pending: a native read. |
| WEB-2002 | fixed | The EN sentence stays exactly "It makes notes from the meetings you record too, up to 20 hours a month." in the Pro paragraph. ES and CA carry the same fact in natural wording. The meetings card states the feature on the home (WD36). |
| WEB-2104 | fixed | `HomePage.tsx:132-160` runs title, `strong.meeting-note-label.meeting-checklist-label` (the checklist label), the `ul` with 2 `li`, the `small` header, the summary, "Decisions", the decision and the pill. This is the app's order (`task_detail_screen.dart:496-499`, UX-2708). The labels are the app's: `checklistCount` gives "Checklist · 0/2" / «Pasos · 0/2» / «Passos · 0/2», and `meetingNoteHeader` gives "Meeting on Tuesday · 42 min" / «Reunión del martes …» / «Reunió del dimarts …». The pill's check icon is gone and so is its `gap`. The separator moved to the `small` (`global.css:778-784`), the `ul` sits 8 px under the label, and `.meeting-line` has `text-wrap: pretty`. The renders `home.en.desktop.light.full.png`, `home.ca.desktop.dark.full.png` and `home.es.mobile.light.full.png` show the label and the to-dos at the top, a thin line, then header, summary, Decisions and a plain pill. The CA summary at 320 px now ends «algú que / la prepara.», where before it ended on «prepara.» alone. axe found 0 violations on all 12 home rows (AUDIT.md §1). The drawing stays `aria-hidden`. |

## Regressions

**R1-WP273-1 · S1 · The new ES heading leaves «notas» alone at 390 px**
- Where: `src/content/site/es.ts:80`, styled by `.feature-card h3` (`src/styles/global.css:579`). Seen in `home.es.mobile.light.full.png`, the meetings card: «Tus reuniones se convierten en / notas».
- What changed: the old «Notas de tus reuniones» fit on one line at 390 px (pre-run `artifacts/ux-web/home.es.mobile.light.full.png`). The new heading wraps with its payoff word alone. That is the newcomer's own case: Spanish, on a phone. At 320 px it splits 3/2 and is fine.
- Fix: add `text-wrap: balance;` to `.feature-card h3` (`global.css:579-584`), as `h1` has it. Don't change the copy. This also balances the existing one-word second lines «…sin / conexión» and «…pasos y / archivos». Check that the 1440 px grid test still passes.
- Verify: at 390 px in ES, the meetings h3 has at least 2 words on its last line, and it's at most 2 lines at 320 px in ES and CA.

**R1-WP273-2 · S1 · CA body breaks «afegeix-la» at its hyphen at 390 px**
- Where: `src/content/site/ca.ts:87`. Seen in `home.ca.mobile.light.full.png`: «…revisa-la i afegeix- / la. Fins a 20 hores…».
- What changed: the new sentence brings the enclitics «rep-ne», «revisa-la» and «afegeix-la». The browser breaks at the hyphen, so «la.» starts a line and «afegeix-» reads as a hyphenated word cut in two. Catalan practice repeats the hyphen when it splits there; the browser doesn't, so a split here is wrong either way.
- Fix: put U+2060 WORD JOINER right after each enclitic hyphen in this string: «rep-⁠ne», «revisa-⁠la», «afegeix-⁠la». It stays invisible and changes nothing for screen readers. Update the same string in `tests/support/ux-web-copy.ts` (the meetings body, ca). The site's ` ` habit for widows (site-patterns) is the precedent.
- Verify: at 390 and 320 px in CA, no line of the meetings paragraph ends with «-» before «la» or «ne».

## Not regressions (noted)
- At 320 px in EN, the summary hyphenates «pre- / pare it.» (`hyphens: auto` on `.meeting-illustration`). The pre-run render shows the same, so the change didn't cause it.
- The EN heading at 320 px ends on «notes» alone. The old heading also ended on one word there («meetings»). R1-WP273-1's fix covers it.
- The check icon is now unused in `Icon.tsx`. That's dead code, not something a visitor meets, and the brief said not to touch `Icon.tsx`.

## Device checks still pending
- A native ES read and a native CA read of the heading, the body and the FAQ sentence.
- On a real phone, Create task opens the review with the to-dos ticked, and Add task saves one task with a checklist.
- Safari on a real iPhone: the card and the note at 390 and 320 px. `text-wrap: pretty` and `balance` are newer in Safari.

## Memory notes
- The meetings card's note now runs title, checklist label (`.meeting-checklist-label`), 2 to-dos, a separator on the `small` header, summary, Decisions and a pill with no icon. Its copy is the app's `checklistCount` and `meetingNoteHeader`.
- Recurring: a new Catalan sentence with enclitics («-la», «-ne») can break at the hyphen on phones. Check the CA 390 and 320 crops after any CA copy change.
- `.feature-card h3` has no `text-wrap`: a longer heading in ES or CA can leave one word on line 2.
