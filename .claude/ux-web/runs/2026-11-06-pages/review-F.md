## UX web review — F: Features and FAQ (WD36 meetings card, FAQ Pro paragraph) — 2026-11-06
**Verdict:** Ship after fixes. The card tells the right facts in the app's words, renders cleanly everywhere and keeps its note hidden from screen readers. One sentence ("in one tap") isn't true in those words, and the copy leads with steps rather than the payoff the owner wants to sell.

**Walked:**
- Newcomer, phone (ES, CA, EN): scrolls into "What TaskFlow does" → the meetings card → the FAQ "Is TaskFlow free?" (Pro paragraph). That's 2 steps from the features heading to the card's facts, and 1 tap to open the Pro paragraph.
- Comparer, desktop (EN): scans the five card headings, then the FAQ's Pro paragraph to see what Pro adds.
- Assistive-technology user: the ARIA snapshots (`artifacts/ux-web/aria/home.*.txt`) and the heading outline (`AUDIT.md` §12).
- Viewports: desktop 1440 (light, dark), mobile 390 (light, dark), 320 px, desktop and mobile text 200%, desktop zoom 200% (720 px), all in EN, ES and CA.
- Evidence: Chromium renders only. This Linux session has no WebKit or WSL. I cropped with Pillow in the scratchpad (`crop.mjs` needs `sharp`, and the checkout has none). The renders were made 2026-11-06 13:52–13:53, after the last source edits (`en/es/ca.ts` 13:48, `HomePage.tsx` and `global.css` 13:49), so they are current evidence.

**Numbers:**
- Card body length: EN 54 words, ES 57, CA 59. It's the longest card on the page; the others run 21–44 (calendar 36, voice 43, details 21, offline 25). On a 390 px phone it takes 8 lines in ES, and the whole card is about 697 CSS px tall, more than one 664 px screen. At mobile text 200% in CA the body is 21 lines.
- FAQ Pro paragraph: EN 79 words in 6 sentences (+15 words); ES 8 lines at 390 px (`home-faq-pricing.es.mobile.light.view.png`).
- Claims: 15 checked, 1 false in its words (WEB-2101) and 1 inexact (the drawing, WEB-2104).
- Measurements (`AUDIT.md`): §3 shows no sideways scroll and no clipped text in any variant. §7 contrast: the body is 5.04:1 (#5b685f on #efedf5) in light and 6.74:1 in dark; the note's summary is 5.84:1; the "Create task" pill is 5.76:1 in light and 10.47:1 in dark. §6 lists the note's two to-dos at 13 px. They are in the aria-hidden drawing and above RD-5's 12 px floor for small print, so they aren't a finding. §12 outline: h2 "What TaskFlow does", then the meetings h3 4th of 5.
- First viewport: unchanged. The features section starts below the fold on desktop and on the phone, so the change adds no words or calls to action there.

**Attention** (predicted from the renders, not measured; guidelines.md §21):
- The first-viewport renders (`home.*.fold.png`) don't reach the features grid, so the hero's prediction from earlier runs holds.
- Desktop, the screenful holding the card (`home.en.desktop.light.full.png`, y ≈ 2810–3160):
  1. The white example note with its bold "Team meeting" and the filled green "Create task" pill. It's the largest high-contrast block, and the only filled button-shaped element on that screen.
  2. The h3 "Notes from your meetings", on the left.
  3. The first line of the body, "With TaskFlow Pro, tap Record a meeting in Notes…".
  What competes: the lavender voice card directly above it, in the same colour.
- Phone, ES (`home.es.mobile.light.full.png`, y ≈ 3745–4442):
  1. The h3 «Notas de tus reuniones».
  2. The first line, «Con TaskFlow Pro, toca Grabar una…».
  3. The note drawing. It arrives about 330 px later, after 8 lines of text, and on the next screen.
  So in the layer-cake scan a newcomer takes a how-to ("tap Record a meeting") before the payoff (notes with to-dos and decisions). See WEB-2102.

### Findings (most severe first)

**WEB-2101 · Severity 2 · "In one tap" skips the review Create task opens**
- Where: `src/content/site/en.ts:81`, `es.ts:81`, `ca.ts:87` (the meetings card's 3rd sentence), home, every viewport and theme. Seen in `home.*.full.png`. The test copy is in `tests/support/ux-web-copy.ts:90`.
- The moment: "One tap and my to-dos are a task." After installing, they tap Create task and a sheet opens asking them to check steps and tap Add task. "That wasn't one tap."
- What happens: the card says "Turn the to-dos into a task with a checklist in one tap" (ES «…con un toque», CA «…amb un toc»). In the app, Create task (`../TaskFlow/App/lib/screens/task_detail_screen.dart:598-604`) calls `createTaskFromNote` (`../TaskFlow/App/lib/widgets/note_task.dart:139-190`). That opens the capture review with the to-dos ticked under «Pasos que se añaden». The person can untick steps and set a day, then saves with Add task / «Añadir tarea» / «Afegeix la tasca» (`app_en.arb:1990` `captureAddTask`). The app's own render shows this: `../TaskFlow/App/build/ux/meetings/note.review.es.light.1x.png`. MN-22 (`../TaskFlow/App/docs/MEETING_NOTES.md:59`) says "through the existing review screen". WD36's fact is "Create task turns the to-dos into one task with a checklist", which has no tap count.
- Why it fails: FN-1/FN-2: true today, in these words. The voice card already describes the same review honestly ("Check them, then add them all with one tap", `en.ts:72`). Here the same step is hidden, so the site promises less friction than the app has. Recurring problem: copy that promises more than is true in that state.
- Fix: replace the sentence. Use the app's button name, and the voice card's check-then-add pattern:
  - EN "Create task turns the to-dos into a task with a checklist: check it, then add it."
  - ES «Crear tarea convierte las cosas por hacer en una tarea con su lista de pasos: revísala y añádela.»
  - CA «Crea una tasca converteix les coses per fer en una tasca amb la seva llista de passos: revisa-la i afegeix-la.» (needs a native Catalan read: the imperative button name as the subject.)
  This also removes ES's double «con… con un toque». Do it together with WEB-2102, whose rewrite includes this sentence.
- Verify: grep `src/content/site/` for "one tap" / «un toque» / «un toc». Each language should keep only the voice card's and the voice FAQ's. Update `tests/support/ux-web-copy.ts:90` and the WD36 test (`tests/ux-web-features.spec.ts:1921-1943`) to assert the button name ("Create task" / «Crear tarea» / «Crea una tasca») and no "one tap" in the card.
- Evidence: verified in code (both repos) and in the app's current preview render.

**WEB-2102 · Severity 1 · Card leads with steps, not what you get**
- Where: `src/content/site/en.ts:81`, `es.ts:81`, `ca.ts:87`, home, every viewport. Seen in `home.es.mobile.light.full.png` (8 lines before the drawing) and `home.ca.mobile-text200.light.full.png` (21 lines).
- The moment: "Tap Record a meeting in Notes, lock the phone… OK, but what do I get?" The answer starts on line 3–4 of a phone screen.
- What happens: sentence 1 is a how-to (tap Record a meeting in Notes, lock the phone). The payoff, "TaskFlow writes the notes: a summary, the to-dos…", is sentence 2. At 54–59 words the card is the page's longest, and on a phone it fills more than a screen before its example appears. The owner asked that meeting recording be stated "clearly and nicely".
- Why it fails: RD-1 (conclusion first, Morkes 1997; Schade 2018). SC-4 (front-load, Nielsen 2009w). SC-1/SC-3: scanners read the first words of a block (Nielsen 2008: about 20% of words read). Lens B: benefits before features.
- Fix: same facts, same order of trust (Pro first, as PR-3 asks), outcome first, WEB-2101's sentence included, and the test's tokens ("TaskFlow Pro", "Record a meeting", "Stop", "20 hours") kept:
  - EN (50 words): "With TaskFlow Pro, record a meeting and get its notes: a summary, the to-dos, the decisions and the open questions. Tap Record a meeting in Notes, lock your phone if you like, and press Stop. Create task turns the to-dos into a task with a checklist: check it, then add it. Up to 20 hours of meetings a month."
  - ES: «Con TaskFlow Pro, graba una reunión y recibe sus notas: un resumen, las cosas por hacer, las decisiones y las preguntas abiertas. Toca Grabar una reunión en Notas, bloquea el móvil si quieres y pulsa Parar. Crear tarea convierte las cosas por hacer en una tarea con su lista de pasos: revísala y añádela. Hasta 20 horas de reuniones al mes.»
  - CA: «Amb TaskFlow Pro, enregistra una reunió i rep-ne les notes: un resum, les coses per fer, les decisions i les preguntes obertes. Toca Enregistra una reunió a Notes, bloqueja el mòbil si vols i prem Atura. Crea una tasca converteix les coses per fer en una tasca amb la seva llista de passos: revisa-la i afegeix-la. Fins a 20 hores de reunions al mes.» (needs a native Catalan read.)
- Verify: the WD36 test's regexes still pass (`tests/ux-web-features.spec.ts:1923`). The first sentence of each language contains "notes" / «notas» / «notes» before the first app button name. Crop the es/ca 390 px and 320 px full renders for a one-word last line (`.feature-card p` has `text-wrap: pretty`, `global.css:585`).
- Evidence: verified in code; seen in current renders.

**WEB-2103 · Severity 1 · Two headings in a row start with "Notes"**
- Where: `src/content/site/en.ts:80`, `es.ts:80`, `ca.ts:86` (h3), right after "Notes, checklists and files" (`en.ts:76`). `AUDIT.md` §12 outline.
- The moment: a scanner reading headings sees "Notes, checklists and files" and then "Notes from your meetings": "More notes?" Nothing in the first two words says this card is about recording meetings.
- What happens: on desktop both headings sit one above the other (details card, then meetings card). On a phone they are consecutive. The distinguishing word "meetings" / «reuniones» / «reunions» is word 4–5.
- Why it fails: SC-4 (first two words carry the meaning, Nielsen 2009w) and SC-5 (vary how items start, Pernice 2019s). FN-2: the app's own words for this are "With Pro, your meetings become notes:" (`app_en.arb:4461` `billingReasonMeetingNotes`), which a visitor will meet again on the Pro screen.
- Fix: the h3 in the app's words, without "With Pro" (the body opens with it):
  - EN "Your meetings become notes"
  - ES «Tus reuniones se convierten en notas» (`app_es.arb:1505`)
  - CA «Les teves reunions es converteixen en notes» (`app_ca.arb:1209`)
  Update `tests/support/ux-web-copy.ts:85` and the heading list in `tests/ux-web-features.spec.ts:312`.
- Verify: the `AUDIT.md` §12 outline shows the new h3. The headings-only test reads calendar, several at once, notes/checklists, meetings, offline. Check the h3 wrap at 320 px in ES and CA (`home.*.mobile-w320.light.full.png`): two lines at most.
- Evidence: verified in code and the outline.

**WEB-2104 · Severity 1 · Example note doesn't follow the app's note**
- Where: `src/components/HomePage.tsx:132-158`, `src/content/site/{en,es,ca}.ts` `features.meetings.note` (`en.ts:82-90`), `src/styles/global.css:757-831`. Seen in `home.en.desktop.light.full.png` and `home.ca.mobile-w320.light.full.png`.
- The moment: after installing, the visitor opens their first meeting note and the to-dos are at the top under "Checklist · 0/3", not under the summary. On the site, the two unlabelled checkboxes didn't read as "the to-dos" the copy promised, because only "Decisions" had a label.
- What happens:
  - The drawing's order is title, "Tuesday · 42 min", summary, two unlabelled checkboxes, "Decisions", "Create task".
  - The app's note page (`../TaskFlow/App/lib/screens/task_detail_screen.dart:496-499`, UX-2708) puts the steps first, labelled `checklistCount` "Checklist · {done}/{total}" / «Pasos · …» / «Passos · …». Then comes the note, opening with `meetingNoteHeader` "Meeting on {date} · {length}" (`app_en.arb:4323`), then the summary and "Decisions".
  - The app's Create task carries an add-task icon (`Icons.add_task_rounded`), not a check. App render: `../TaskFlow/App/build/ux/meetings/note.create-task.es.light.1x.png`.
  - At 320 px the CA summary ends on one word, «prepara.», because `.meeting-line` has no `text-wrap`.
  - The filled green pill is the most salient button-shaped thing in the card's screenful, though it isn't interactive (aria-hidden, no pointer). Following the app's order moves it under the note, where it reads as part of the picture.
- Why it fails: lens D (what the site shows first is what the app shows first; FN-2, recognition after install). EY-3: an image carries information when it shows the real result. The site's own rule: any new paragraph style that can end on one word gets `text-wrap: pretty`.
- Fix (copy and markup only, no new elements beyond one label):
  - Reorder the drawing to the app's order: title; a small label "Checklist · 0/2" / «Pasos · 0/2» / «Passos · 0/2» over the two to-dos; then the header line "Meeting on Tuesday · 42 min" / «Reunión del martes · 42 min» / «Reunió del dimarts · 42 min»; the summary; "Decisions" with its line; "Create task" last.
  - Swap the pill's `check` icon for a plus-check, or drop the icon.
  - Add `text-wrap: pretty` to `.meeting-line`.
- Verify: crop the desktop, 390 and 320 renders. Labels read as in the app preview. No one-word last line in any language at 320 px. `AUDIT.md` §7 rows for the new label (≥ 4.5:1 in both themes).
- Evidence: verified in code (both repos) and against the app's current preview render. Seen in current site renders.

**WEB-2105 · Severity 1 · ES/CA FAQ: «hace notas» / «fa notes» read as calques**
- Where: `src/content/site/es.ts:109`, `ca.ts:115` (FAQ "Is TaskFlow free?", Pro paragraph, new sentence). Seen in `home-faq-pricing.es.mobile.light.view.png`.
- The moment: «También hace notas de las reuniones…»: a Spanish reader hears a translation. In everyday Spanish one *takes* notes («tomar notas»).
- What happens: the EN "makes notes" was carried over word for word. The app's ES and CA say «tus reuniones se convierten en notas» and «Notas de las reuniones que grabas» (`app_es.arb:1505, 1507`; `app_ca.arb:1209, 1211`).
- Why it fails: lens G, natural in each language, never a literal translation (ML-6).
- Fix:
  - ES «También toma notas de las reuniones que grabas, hasta 20 horas al mes.»
  - CA «També pren notes de les reunions que enregistres, fins a 20 hores al mes.» (needs a native Catalan read.)
  - EN stays.
  Update `PRO_MEETINGS` in `tests/ux-web-features.spec.ts:1054`.
- Verify: the WD36 FAQ test passes with the new strings. A native read.
- Evidence: verified in code; seen in the current render.

### Claims checked
| Claim (page, `path:line`) | Source of truth (`path:line`) | Verdict |
|---|---|---|
| Meeting notes are Pro only (card `en.ts:81`; FAQ `en.ts:109`) | `../TaskFlow/App/lib/screens/notes_screen.dart:275-280` (Pro, else the Pro screen); `app_en.arb:4235` `meetingProRequired`; WD36 | true |
| "tap Record a meeting in Notes" / «Grabar una reunión en Notas» / «Enregistra una reunió a Notes» | `notes_screen.dart:288`; `app_en.arb:4016`, `app_es.arb:1428`, `app_ca.arb:1132`; `notes` tab label | true |
| "lock your phone if you like" | `app_en.arb:4028` `meetingListeningHelp` (ES 1431, CA 1135) | true |
| "press Stop" / «Parar» / «Atura» | `app_en.arb:4032`, `app_es.arb:1432`, `app_ca.arb:1136` | true |
| "TaskFlow writes the notes: a summary, the to-dos, the decisions and the open questions" | `../TaskFlow/App/lib/services/meeting_note.dart:97-150`; MN-20 (`MEETING_NOTES.md:52-57`); `app_en.arb:4303, 4307` | true |
| ES/CA "las cosas por hacer" / "les coses per fer" | `app_es.arb:1506`, `app_ca.arb:1210` | true |
| "Turn the to-dos into a task with a checklist in one tap" (`en.ts:81`, es 81, ca 87) | `note_task.dart:139-190` (opens the review), `app_en.arb:1990` `captureAddTask`; MN-22 | false in its words (WEB-2101) |
| "Up to 20 hours of meetings a month" (card) | `../TaskFlow/App/lib/l10n/meeting_copy.dart:13`; `app_en.arb:4490` `billingReasonMeetingNotesLimit` (ES 1511, CA 1215) | true, in the app's words |
| FAQ "It makes notes from the meetings you record too, up to 20 hours a month." (`en.ts:109`) | `app_en.arb:4469` `proBenefitMeetingNotes` | true (ES/CA wording: WEB-2105) |
| Example note button "Create task" / «Crear tarea» / «Crea una tasca» | `app_en.arb:4349`, `app_es.arb:1484`, `app_ca.arb:1188` | true |
| Example note label "Decisions" / «Decisiones» / «Decisions» | `app_en.arb:4303`, `app_es.arb:1477`, `app_ca.arb:1181` | true |
| Example note's order and header line | `task_detail_screen.dart:496-499` (UX-2708); `app_en.arb:4323` `meetingNoteHeader` | inexact (WEB-2104) |
| Example note's to-dos as a checklist | `meeting_note.dart:144-147` (to-dos are the note's checklist) | true |
| CA uses «enregistrar» (card «Enregistra», FAQ «enregistres») | `app_ca.arb:1132, 1211` | true |
| ES/CA «lista de pasos» / «llista de passos» for the checklist | `app_es.arb` `checklistCount` «Pasos»; site's details card (`es.ts:77`) | true, consistent |

App-side changes since the last web review: `app_en.arb` has none (`ux-web.sh since --app` prints nothing). `Backend/docs/MEETINGS.md` is unchanged in this checkout. On `origin/main` it changes one line (`:84`, "on Vertex … like all AI"), which touches no site claim in area F (the privacy page is out of scope).

### Missing from the site (app features worth telling)
- Recording keeps going without signal; the notes are made once the phone is back online (`app_en.arb:4060` `meetingWaitingConnectionHelp`, MN-11). It would sharpen the card for people who meet away from Wi-Fi. Add it only if it replaces words. The card is already the page's longest, so this isn't a finding.

### Keep
- The card states every one of WD36's facts in the app's exact labels, in all three languages, with CA «enregistrar» throughout.
- "With TaskFlow Pro" is in the first three words, so the paid feature is never mistaken for a free one (PR-3).
- The example note is `aria-hidden`. The ARIA snapshot carries only the heading and paragraph (`aria/home.es.desktop.txt:63-64`).
- Layout holds at every width: two columns from 1440 down to the 720 px zoom, stacked at phone widths. There's no sideways scroll or clipping (`AUDIT.md` §3), and contrast passes in both themes (§7).
- The FAQ's Pro sentence uses the Pro screen's own figure and wording ("up to 20 hours a month").

### Questions for the owner (product decisions only)
- **Q-F1. The two short Pro lines.** The closing card and the line under the demo (`en.ts:154`, ES/CA 154/160) still say "TaskFlow Pro, a monthly subscription: unlimited dictation and file space." WD2 and WD14 keep them short by decision, so meeting notes, which you asked to give importance, appear in the card and the FAQ but not where people decide. Options:
  - (a) Keep as is.
  - (b) Add "and notes from your meetings" / «y notas de tus reuniones» / «i notes de les teves reunions».
  Recommendation: (a). The card now carries it, and the line's job is the free limit. Raise (b) only if the five-person test shows people miss it.

### Memory notes
- Claims map: the meetings card is `features.meetings` (`en.ts:79-91`, es 79-91, ca 85-97; type `types.ts:74-87`), rendered at `HomePage.tsx:124-159`, styled at `global.css:738-831` plus the 800/580 px media rules. The FAQ Pro paragraph's meeting sentence is at `en.ts:109` / `es.ts:109` / `ca.ts:115`. The site-map row "Home/FAQ never name meeting notes" (claims-map line 38) is now out of date: WD36 answered it (2026-11-06), and WEB-2002 moves from decision to built.
- Source of truth for Create task: `../TaskFlow/App/lib/widgets/note_task.dart:139` opens the capture review (Add task / «Añadir tarea» / «Afegeix la tasca»). It is never one tap. The app's note page shows the steps first (UX-2708).
- The app's preview renders for meetings live in `../TaskFlow/App/build/ux/meetings/` (`note.create-task.*`, `note.review.*`, `recording.*`, `pro.*`). Use them to check any drawing of an app screen on the site.
- Site map: the features grid is now calendar (2 rows), voice, details, meetings (full row, lavender, its note beside the copy above 580 px), offline. Tests: `tests/ux-web-features.spec.ts:304-331` (grid geometry), `:1921-1960` (WD36 copy and stacking), `PRO_MEETINGS` `:1054`. On the 390 px phone the meetings card sits at about y 3745–4442 in `home.es.mobile.light.full.png`; to find it in the lavender scan, it's the second lavender block.
- Technique: to place a card in tall full renders, scan rows for its background token (`--lavender` #efedf5 in light, #302e3d in dark) with Pillow, then crop. `audit.json` → `pages[].collected.texts` gives per-element size and contrast for aria-hidden drawings, which `AUDIT.md` §7 doesn't list when they pass.
- Recurring: a new card's copy repeated a "one tap" promise from a flow that has a review step. After any new feature copy, grep for "one tap" / «un toque» / «un toc» and check each against the app's flow.
