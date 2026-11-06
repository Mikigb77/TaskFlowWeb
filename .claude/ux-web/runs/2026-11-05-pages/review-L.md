## UX web review — L: Privacy, meeting notes and Vertex AI only (version 2026-11-05) — 2026-11-05

**Verdict:** Ship after fixes. Most of the new privacy text matches the app. One §7 sentence gets wrong when a stopped recording is made into a note automatically, §7 leaves out two cases where meeting data stays on our server, the Catalan page calls the feature something different from the app, and the Spanish summary 02 ends on one word on a phone (the known WEB-1502 test failure).

**Walked:**
- **Leaver** (from the app's Privacy link, or from a search, in their own language): /privacy/, /es/privacy/, /ca/privacy/. Summary, then §2, §4 and §7. Three steps to the meeting text (summary → the "4." link in "On this page" → §7).
- **Comparer** checking what happens to a meeting's audio: summary 02, then §4 paragraph 2, then §7's "Meeting recordings" bullet.
- **Assistive-technology user:** AUDIT.md §3, §4, §9 and §12 rows for privacy.
- **Version line:** checked on all 12 legal pages (privacy, terms, legal and delete-account × EN/ES/CA) in the aria snapshots: "5 November 2026" / «5 de noviembre de 2026» / «5 de novembre del 2026»; no 2 November date left in `src/` or `docs/`.
- **Viewports and themes:** desktop 1440 × 1000 and mobile 390 × 664 in light and dark, text200 on desktop and mobile, zoom200, 320 px. All are Chromium renders from 97a7758 (rendered 09:13 UTC, after the commit at 09:11 UTC). There are no WebKit renders this run.

**Numbers:**
- Summary 02: EN 29 → 37 words, ES 29 → 37, CA 31 → 38. It is now the longest of the three cards: 5 lines on desktop, 7 on a phone, and it is cut by the fold on a phone in every language.
- §4 (paragraphs plus links): EN 337 → 430 words, ES 335 → 423, CA 321 → 415.
- Claims checked: 22. False: 1 (WEB-1901). Incomplete: 4 (WEB-1902, WEB-1903, WEB-1906 and part of WEB-1907). Named differently from the app: 2 (WEB-1904).
- Measured (AUDIT.md §1, rows 34–45): axe 0, no overflow at 320 px, at text200 or at zoom200 (§3, rows 161–172), and 0 of 50–53 focus problems.

**Attention** (predicted from the renders with guidelines.md's heuristic; not measured eye-tracking):
- `privacy.en.desktop.light.fold.png`:
  1. the H1, "TaskFlow Privacy Policy";
  2. summary card 02, the densest of the three and in the centre column;
  3. card 01 or "Delete account".

  Header navigation and the English pill compete. The Leaver's next step, "Delete account", sits among the first three. Card 02's added clause makes it the heaviest card, which is right, because what goes to Google is the question people come with.
- `privacy.{es,ca}.mobile.{light,dark}.fold.png`:
  1. the H1;
  2. the language pill, whose selected «Español» / «Català» has high contrast;
  3. summary card 01.

  Card 02 starts at about y = 1740 of 1992 device px and is cut after 3 lines. Its meeting clause sits below the fold in every language. That is acceptable for a summary, but it's one more reason to keep the card short (WEB-1905).

### Findings (most severe first)

**WEB-1901 · Severity 3 · §7: "a recording you stop" is the wrong case**
- Where: `src/content/legal/en.ts:126`, `es.ts:126`, `ca.ts:126` (§7, "Meeting recordings", fourth sentence). /privacy/, /es/privacy/ and /ca/privacy/, every viewport and theme.
- The moment: "So if I press Stop and don't 'finish', it stays on my phone for a week? Where's 'finish' in the app?"
- What happens: The sentence says "A recording you stop but don't finish becomes a note on your phone after 7 days." In the app, pressing Stop always makes the notes (`../TaskFlow/App/lib/models/meeting.dart`, phase `finishing`: "Stop was pressed: pieces upload, then `finish` is repeated"). The 7-day rule applies only to a recording that stopped without Stop: the app closed or the phone switched off (phase `interrupted`, `meeting.dart:10-12`), or a Stop on a recording that was almost all silence (`meeting_store.dart:670-680`). Even then, the 7 days count from when the app first asks about it, not from when it stopped (`meeting_store.dart:37-38, 694-711`: `askedAt`; "One never asked about waits"). The app's words for this case are "It stopped before you pressed Stop." (`app_en.arb:4114`, ES «Se cortó antes de que pulsaras Parar.» `app_es.arb:1447`, CA «S’ha tallat abans que premessis Atura.» `app_ca.arb:1151`). The app has no "finish" control; its buttons are "Keep recording", "Make the notes" and Discard.
- Why it fails: E (the site says what the app does, in the app's words) and I (what the site says about data matches the app). This is a retention claim, and the case it names doesn't exist in the app.
- Fix: replace that sentence:
  - EN: "A recording that stopped before you pressed Stop, and that you leave unanswered, becomes a note 7 days after the app asks you about it."
  - ES: «Una grabación que se cortó antes de que pulsaras Parar, y que dejas sin responder, se convierte en una nota 7 días después de que la app te pregunte por ella.»
  - CA: «Un enregistrament que s’ha tallat abans que premessis Atura, i que deixes sense resposta, es converteix en una nota 7 dies després que l’app te’n pregunti.» Needs a native Catalan read.
- Verify: a Playwright assertion on §7's bullet text in each language. No "you stop but don’t finish", «paras pero no terminas» or «atures però no acabes» may remain in `src/content/legal/`. Check the es/ca mobile full renders for a one-word last line.
- Evidence: verified in code (app repo, `App/lib/models/meeting.dart`, `App/lib/services/meeting_store.dart`, ARB).

**WEB-1902 · Severity 2 · §7 leaves out finished meetings whose notes never reached the phone**
- Where: `src/content/legal/en.ts:126`, `es.ts:126`, `ca.ts:126` (§7, "Meeting recordings", second sentence). All three privacy pages.
- The moment: "I pressed Stop and then lost the phone. Is my meeting's text on their server forever?"
- What happens: §7 covers two cases. The server deletes the text "once the app has saved its notes", and "A meeting that is never finished is deleted 30 days after its last piece arrived." It says nothing about a meeting that was finished but whose notes the app never saved (the phone was lost, uninstalled or never reopened after Stop). The server's sweep deletes every meeting whose last piece arrived over 30 days ago, "finished or not", and also final notes the app never acknowledged after 30 days (`../TaskFlow/Backend/core/meetings.py:642-647` on origin/main; `Backend/docs/MEETINGS.md`, Cleanup; MN-27). The rule is simpler and more reassuring than the page makes it look.
- Why it fails: I and E, because the retention statement is incomplete. A reader who checks both stated cases finds no limit for the third.
- Fix (subtract: one rule instead of a special case). Replace "A meeting that is never finished is deleted 30 days after its last piece arrived." with:
  - EN: "Whatever is left of a meeting on our server, finished or not, is deleted 30 days after its last piece arrived."
  - ES: «Lo que quede de una reunión en nuestro servidor, terminada o no, se borra 30 días después de recibir su última parte.»
  - CA: «El que quedi d’una reunió al nostre servidor, acabada o no, s’esborra 30 dies després de rebre’n l’última part.» Needs a native Catalan read.
- Verify: a text assertion per language, and a `since --app` check of `Backend/core/meetings.py` `sweep()` at verify time.
- Evidence: verified in code (`Backend/core/meetings.py` on origin/main, which deploys staging).

**WEB-1903 · Severity 2 · "Discarding deletes it on our server at once" isn't true offline**
- Where: `src/content/legal/en.ts:126`, `es.ts:126`, `ca.ts:126` (§7, "Meeting recordings", fifth sentence). All three privacy pages.
- The moment: "I hit Discard on the plane, so it's gone from their server, right?"
- What happens: The page says "Discarding a meeting deletes it on the phone and on our server at once." On the phone, Discard deletes the audio straight away. The server hears about it only when the phone can reach it. The meeting is kept in phase `discarding` ("local audio is gone, the server still has to hear it", `../TaskFlow/App/lib/models/meeting.dart`; `meeting_store.dart:713-740`; retried by `meeting_uploader.dart:164`). Offline, the server's text stays until the phone has signal again, or until the 30-day sweep. MN-25 and the server doc say "at once" from the server's side, once the request arrives.
- Why it fails: I. A privacy promise ("at once") that doesn't hold in a common case. Meetings are designed for long stretches without signal (MN-11).
- Fix:
  - EN: "Discarding a meeting deletes it from your phone at once, and from our server as soon as your phone is online."
  - ES: «Descartar una reunión la borra del teléfono al momento, y de nuestro servidor en cuanto el teléfono tiene conexión.»
  - CA: «Descartar una reunió l’esborra del telèfon a l’instant, i del nostre servidor tan bon punt el telèfon té connexió.» Needs a native Catalan read.
- Verify: a text assertion per language.
- Evidence: verified in code (app repo).

**WEB-1904 · Severity 2 · Catalan says «gravar», the app's meeting screens say «enregistrar»**
- Where: `src/content/legal/ca.ts:10` (summary 02, «una reunió que graves»), `ca.ts:33` (§2, «una reunió que graves»), `ca.ts:56` (§4, «pots gravar una reunió… Mentre graves»), `ca.ts:59` («abans de gravar-la») and `ca.ts:126` (§7, «Reunions gravades… Una gravació que atures»). In Spanish and Catalan, `es.ts:56` and `ca.ts:56` also name the notes' contents «tareas pendientes» / «tasques pendents».
- The moment (a Catalan speaker, after installing): "The website said «gravar una reunió», but I can't find it." The Notes tab says «Enregistra una reunió».
- What happens: The app's Catalan meeting strings all use «enregistrar» / «enregistrament»: «Enregistra una reunió» (`../TaskFlow/App/lib/l10n/app_ca.arb:1132`), «S’està enregistrant», «Continua enregistrant», «Enregistrament d’avui», and on the Pro screen «Notes de les reunions que enregistres» (`app_ca.arb:1211`). Dictation keeps «gravació», so §4's first paragraph is fine. For the notes' contents, the app says «las cosas por hacer» / «les coses per fer» (`app_es.arb:1506`, `app_ca.arb:1210`). The ARB's own note says: "The to-dos become one task's steps, so it says to-dos, not tasks" (`app_en.arb:4467`). The site's «tareas pendientes» / «tasques pendents» reintroduces "tasks". English "to-dos" already matches.
- Why it fails: G (one concept, one name, on the site and in the app) and E (the app's names, so visitors recognise them after installing).
- Fix:
  - CA, meeting sentences only:
    - summary 02: «…o per fer notes d’una reunió que enregistres.»
    - §2: «Amb Pro, una reunió que enregistres: …»
    - §4: «Amb Pro pots enregistrar una reunió per tenir-ne notes. Mentre enregistres, l’app envia…»
    - §4 last paragraph: «Avisa les persones d’una reunió abans d’enregistrar-la, i no gravis tercers…» (the general «gravis» can stay)
    - §7: «Reunions enregistrades: …»
  - The §7 sentence becomes WEB-1901's «Un enregistrament que…».
  - ES §4: «(un resumen, las cosas por hacer, las decisiones y las preguntas abiertas)».
  - CA §4: «(un resum, les coses per fer, les decisions i les preguntes obertes)».
  - Needs a native Catalan read.
- Verify: no «gravar una reunió», «que graves» or «Reunions gravades» in `src/content/legal/ca.ts`; no «tareas pendientes» or «tasques pendents» in §4. Check the es/ca mobile full renders for a one-word last line, because summary 02 changes length (see WEB-1502).
- Evidence: verified in code (ARB files).

**WEB-1502 · Severity 2 · (regression, existing ID) Spanish summary 02 ends on «grabas.» alone**
- Where: `src/content/legal/es.ts:10`; style `src/styles/legal.css:149` (`.legal-summary p`). /es/privacy/, mobile 390 × 664, light and dark. Render `privacy.es.mobile.light.full.png`, y ≈ 545–770.
- The moment: none for most readers; it looks unfinished. It's the known failure in `tests/ux-web-legal.spec.ts:2027`.
- What happens: The added clause «…o para hacer notas de una reunión que grabas.» wraps so that «grabas.» sits alone on the card's last line, seen in a crop of the current render. Catalan wraps to «per fer notes d’una reunió que graves.» (one full line), so it passes, and so does English. `.legal-summary p` has no `text-wrap`, unlike the site's other card paragraphs (`global.css:536, 586, 851, 939, 994`).
- Why it fails: F (scanning; a one-word last line reads as a stray). This is the regression type recorded in memory: "Longer copy leaves a widow on phones".
- Fix: add `text-wrap: pretty;` to `.legal-summary p` (`src/styles/legal.css:149`). Don't trim the claim. This also protects WEB-1904's Catalan change and any later summary change.
- Verify: `tests/ux-web-legal.spec.ts:2027` passes for es and ca; check the es/ca mobile full renders. `pretty` is unsupported in older Safari, so check on a real iPhone.
- Evidence: seen in a current render; the test fails (from the delegation).

**WEB-1905 · Severity 1 · Summary 02: a meeting is more than "your words"**
- Where: `src/content/legal/en.ts:10`, `es.ts:10`, `ca.ts:10`.
- The moment (Leaver or Comparer): "My words? It records everyone in the room."
- What happens: The summary opens "Your words go to Google’s AI only when…", and its new clause adds "to make notes from a meeting you record". A meeting's audio carries everyone's voices, and §2 rightly says "the text of what was said", not "what you said". The plain summary is the only part most people read.
- Why it fails: I (a plain summary before the legal text, true on its own).
- Fix: change only the clause:
  - EN: "…or to make notes from a meeting you record, with everyone’s words in it."
  - ES: «…o para hacer notas de una reunión que grabas, con lo que dice cada persona.»
  - CA: «…o per fer notes d’una reunió que enregistres, amb el que hi diu cadascú.» Needs a native Catalan read.
  - Or the owner keeps it as is. It isn't false, only narrow.
  - Either way, WEB-1502's `text-wrap` fix must land first.
- Verify: text assertions, and the es/ca mobile renders for a widow.
- Evidence: verified in code.

**WEB-1906 · Severity 1 · §4's new sentences: transcript missing, "outside the EU" said three times**
- Where: `src/content/legal/en.ts:57-58`, `es.ts:57-58`, `ca.ts:57-58`; the link label `en.ts:63`, `es.ts:63`, `ca.ts:63`.
- What happens:
  - (a) §4 paragraph 3 says Google returns "for a meeting, its notes". For a meeting, Google returns the text of each piece first (MN-16), then the notes. Fix: "and for a meeting, its text and notes" / «y, si es una reunión, su texto y sus notas» / «i, si és una reunió, el seu text i les seves notes».
  - (b) Paragraph 3 ends "Google can process it outside the EU." Paragraph 4 repeats "…and process it outside the EU" and then "We do not promise … EU-only processing". That's three times in 90 words. Delete ", and process it outside the EU" / «, y procesarlos fuera de la UE» / «, i processar-les fora de la UE» from paragraph 4.
  - (c) The ES and CA link labels «…, con Vertex AI» / «…, amb Vertex AI» read as "with Vertex AI". Use «Condiciones específicas de Google Cloud, incluida Vertex AI» and «Condicions específiques de Google Cloud, inclosa Vertex AI». Needs a native Catalan read.
- Why it fails: E for (a); F and G (subtract words, natural copy) for (b) and (c).
- Verify: text assertions.
- Evidence: verified in code.

**WEB-1907 · Severity 1 · §9 and §3 don't mention meetings where they now apply**
- Where:
  - §9: `src/content/legal/en.ts:151`, `es.ts:151`, `ca.ts:151` ("notifications for reminders"). The app now also asks for notifications for meetings: "Turn on notifications to stop the recording from there and to know when the notes are ready." (`../TaskFlow/App/lib/l10n/app_en.arb:4482`, D3 of 2026-11-04). The microphone is used in the background during a meeting (`meetingListeningHelp`, `app_en.arb:4028`).
  - §3: `en.ts:48`, `es.ts:48`, `ca.ts:48` ("The AI suggests titles, dates and priorities for your review"). It now also writes meeting notes.
- Why it fails: E, incomplete rather than false.
- Fix:
  - §9:
    - EN: "notifications for reminders and meeting recordings"
    - ES: «notificaciones para recordatorios y grabaciones de reuniones»
    - CA: «notificacions per recordar i per als enregistraments de reunions»
  - §3: "The AI suggests titles, dates and priorities, and writes meeting notes, for your review" (ES «La IA propone títulos, fechas y prioridades, y redacta las notas de reuniones, para tu revisión»; CA needs Catalan translation). Or leave both for the next legal version.
- Verify: text assertions.
- Evidence: verified in code.

### Claims checked
| Claim (page, `path:line`) | Source of truth (`path:line`) | Verdict |
|---|---|---|
| Summary 02: words go to Google's AI … to make notes from a meeting you record (`en.ts:10`) | `../TaskFlow/Backend/docs/MEETINGS.md` (pieces transcribed on Vertex) | true; narrow (WEB-1905) |
| §2: with Pro, a meeting's audio, the text of what was said and the notes (`en.ts:33`) | `MEETINGS.md` Access (Pro), the result, pieces' text | true |
| §4: with Pro you can record a meeting to get notes (`en.ts:56`) | `MEETINGS.md` Access 402 `pro_required`; DECISIONS D2 2026-11-04 | true |
| §4: pieces of about five minutes sent while recording (`en.ts:56`) | `MEETING_NOTES.md` MN-4, MN-8 | true |
| §4: each piece kept on the phone until the server has received it (`en.ts:56`) | `meeting_store.dart:25-28` ("deleted only once the server confirmed its text is saved") | true (in substance) |
| §4: the server has Google turn each piece into text, then deletes its audio (`en.ts:56`) | MN-15; `Backend/core/meetings.py:208, 397` (`del audio`) | true |
| §4: notes = summary, to-dos, decisions, open questions; saved as an ordinary note (`en.ts:56`) | MN-20, MN-21; `app_en.arb:4303-4311, 4465` | true; ES/CA names (WEB-1904) |
| §4: the server then deletes the meeting's text (`en.ts:56`) | MN-24; `MEETINGS.md` DELETE | true |
| §4: Pro includes up to 20 hours of meetings a month (`en.ts:56`) | `billingReasonMeetingNotesLimit` `app_en.arb:4490`; `MEETINGS.md` 240 pieces; D4 | true, in the app's words |
| §4: the app and the website demo use Vertex AI (`en.ts:57`) | app commit `aa627da`; `Backend/core/ai.py:169-170` on origin/main | true on main/staging. The app's working branch `claude/project-thread-xqvgpc` doesn't contain `aa627da` (its `ai.py:173-175` still has the AI Studio route) |
| §4: Google returns, for a meeting, its notes (`en.ts:57`) | MN-16, MN-18 | incomplete: the text too (WEB-1906) |
| §4: Google doesn't use what we send to Vertex AI to train its models without permission (`en.ts:58`) | `MEETING_NOTES.md` §6 (quote from Google's Vertex page); `docs/LEGAL_RELEASE.md` (Service Specific Terms) | unverifiable from the repos alone; consistent with the cited terms (not fetched: cloud.google.com isn't on the reviewer's source list) |
| §4: Google may keep some data for caching, safety and abuse monitoring (`en.ts:58`) | `LEGAL_RELEASE.md` ("stated as possible, not quantified") | unverifiable; hedged correctly |
| §4: tell the people in a meeting before you record it (`en.ts:59`) | D5 2026-11-04 (no in-app reminder) | consistent (advice in the policy, not an app claim) |
| §4 link: Google Cloud service terms (`en.ts:63`) | `LEGAL_RELEASE.md` | ok; ES/CA label wording (WEB-1906) |
| §7: audio deleted once it's text (`en.ts:126`) | MN-15 | true |
| §7: the text deleted once the app saved its notes (`en.ts:126`) | MN-24 | true |
| §7: a never-finished meeting deleted 30 days after its last piece (`en.ts:126`) | `meetings.py:642-647` (finished or not, plus unacknowledged results) | incomplete (WEB-1902) |
| §7: a recording you stop but don't finish becomes a note after 7 days (`en.ts:126`) | `meeting.dart` phases; `meeting_store.dart:37-38, 694-711`; `app_en.arb:4114` | **false** (WEB-1901) |
| §7: Discard deletes it on the phone and the server at once (`en.ts:126`) | `meeting.dart` `discarding`; `meeting_uploader.dart:164` | incomplete offline (WEB-1903) |
| §7: account deletion deletes its meetings (`en.ts:126`) | MN-29; `MEETINGS.md` Cleanup (cascade); `App/lib/services/account_deletion.dart:167-169` (local) | true |
| Version 2026-11-05 on every legal page (`company.json:10`) | aria snapshots, 12 pages × 2 viewports | true |

### Missing from the site (app features worth telling)
- None for the privacy page. What the recording screen says, "The audio is sent to make the notes, then deleted." (`app_en.arb:4478`, D5), is covered by §4. Whether the home or FAQ tells people about meeting notes is area F's.

### Keep
- §4's meeting paragraph follows the order things happen (record, send pieces, turn into text, delete audio, notes, delete text). That's the right shape for the Leaver.
- "Pro includes up to 20 hours of meetings a month" uses the app's Pro-screen words exactly, in all three languages.
- §4 now names one provider (Vertex AI) and one set of terms. The old paid/free Gemini paragraph is gone: 93 fewer words of contract tiers.
- The version line updated consistently on all 12 legal pages, with no stale date in `src/` or `docs/`.
- No overflow, axe 0 and full doubling at text200 on every privacy render (AUDIT.md §1 rows 34–45, §3 rows 161–172).

### Questions for the owner (product decisions only)
- None new. The legal sign-off for 2026-11-05 is given. The fixes above are a version move (2026-11-05 → the next date) under `docs/LEGAL_RELEASE.md` and need the owner's sign-off again. WEB-1901 to WEB-1903 and WEB-1904 are accuracy fixes; WEB-1905 to WEB-1907 could wait for the next legal edit if he'd rather not move the version for polish.

### Cross-slice notes
- F: the app's Catalan names the feature «Enregistra una reunió» / «reunions que enregistres» (`app_ca.arb:1132, 1211`), not «gravar», so any site/ca.ts claim about meeting notes should use it. The app's working branch lacks `aa627da` (origin/main has it).

### Memory notes
- Claims map:
  - privacy summary 02, §2 (`en.ts:33`), §4 (`en.ts:56-59`, link `:63`) and §7's "Meeting recordings" bullet (`en.ts:126`) now carry the meeting-notes claims;
  - sources: `../TaskFlow/App/docs/MEETING_NOTES.md` MN-15/20/24-29, `Backend/docs/MEETINGS.md`, `Backend/core/meetings.py` `sweep()` (finished or not), `App/lib/models/meeting.dart` phases (`interrupted` = stopped without Stop; `discarding` = waits to tell the server), `App/lib/services/meeting_store.dart:37-43` (7 days from `askedAt`);
  - the AI provider row (claims-map.md:33) is now "Vertex AI only, app and demo" (`aa627da`, on origin/main).
- Catalan naming: the app's meeting strings use «enregistrar/enregistrament». Dictation uses «gravació». ES/CA "to-dos" are «las cosas por hacer» / «les coses per fer», not «tareas/tasques pendientes».
- Recurring: `.legal-summary p` has no `text-wrap: pretty` (`legal.css:149`). Every summary lengthening risks a widow at 390 px (WEB-1502 regressed 2026-11-05).
- Technique: crop.mjs needs sharp from node_modules, which this Linux checkout lacks. A Python PIL crop into the scratchpad works the same (1 CSS px per px on full renders).
