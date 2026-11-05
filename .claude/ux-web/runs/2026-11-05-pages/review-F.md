## UX web review — F: the site's claims about meeting notes and the AI provider — 2026-11-05
**Verdict:** Ship after fixes. Nothing on the home or in the FAQ is false now, in any language. But the Terms still tell people to check AI output "before saving", and meeting notes save themselves. Whether the FAQ's Pro list names meeting notes is the owner's call (WEB-2002).

**Walked:**
- **Comparer.** Home → FAQ "Is TaskFlow free?", opened, Pro paragraph → footer Privacy Policy → summary 02 → §4. Four steps, EN/ES/CA, phone 390 × 664, light.
- **Newcomer.** Home first viewport → "Try it with your voice" → demo capture state with its privacy line → "How we use your data" (privacy #website). Three steps, ES and EN, phone, light.
- **Careful reader.** Terms §5 "AI suggestions", EN/ES/CA, from the code only. No terms render was needed: its copy is unchanged since 2026-11-03.

**Numbers:**
- Claims checked: 17. False: 0. Out of date or incomplete: 2 (the FAQ's Pro list, a decision; Terms §5, a fix). True: 15.
- The home's copy (`src/content/site/*.ts`, `HomePage.tsx`) hasn't changed since 2026-11-03 09:10 UTC. No line in the home's first viewport touches meetings or the AI provider.
- The app's Pro screen lists 4 benefits. The FAQ's Pro paragraph lists 3: dictation and file space, typed sentences, and reminders in your own words.
- The Spanish Pro paragraph is ≈ 60 words, 8 lines at 390 px (`home-faq-pricing.es.mobile.light.view.png`).

**Attention** (predicted from the render with guidelines.md's heuristic, not measured). `home.es.mobile.light.fold.png` (the first viewport is unchanged, so only this render was read):
1. the H1 «Dilo y ya está en tu calendario.»;
2. the green primary button «Pruébalo con tu voz»;
3. the white quote card «Mañana, llamar al dentista y comprar pan» at the bottom edge.

The «Qué hace ›» link and the two grey status lines compete only weakly. Neither meetings nor Google appears in the first viewport, which is right for the newcomer.

**Evidence base:**
- The renders and `AUDIT.md` in `artifacts/ux-web/` (09:15–09:17 UTC) postdate the last change to the copy they show (legal content 09:05; site content 2026-11-03).
- App side: `ux-web.sh since --app` answers `NO_SNAPSHOT` in this cloud clone, so I read the changes with `git log`/`git show`.
- The app checkout's branch (`claude/project-thread-xqvgpc`, HEAD `b9d1589`) **doesn't contain `aa627da`**. That commit is on `origin/main` (merged by `24e2240`). So the Vertex-only claims were checked against `origin/main`: `git show origin/main:Backend/core/ai.py:160-173` (one Vertex client, no API key) and `Backend/core/meetings.py`. The working tree's `Backend/core/ai.py` still has the AI Studio route. That's a stale checkout, not a site problem.

### Findings (most severe first)

**WEB-2001 · Severity 2 · Terms say check AI notes before saving; meeting notes save themselves**
- **Where:** `src/content/legal/en.ts:235`, `es.ts:235`, `ca.ts:235` (Terms §5 "AI suggestions", `#ai`), every language and viewport.
- **The moment:** a Pro user reads the Terms after a meeting. "Check … notes … before saving? The app saved the notes for me. Did I break the terms?"
- **What happens:**
  - EN: "Output can omit, misinterpret or invent details. Check titles, dates, times, priorities, notes, recipients and project assignments before saving or sharing."
  - ES and CA say the same («antes de guardar o compartir», «abans de desar/compartir»).
  - The app does it differently. Once every piece is in, the app saves the meeting's notes as an ordinary note with no review step (`../TaskFlow/App/lib/services/meeting_uploader.dart:380`, `store.saveNote(...)`; MN-21, `../TaskFlow/App/docs/MEETING_NOTES.md`). Only the to-dos go through the review screen, when the person taps Create task (MN-22).
  - So for the one AI feature that writes a summary, decisions and to-dos, the Terms set a duty the person can't meet. Meeting notes are also the AI output most likely to "invent details": a decision nobody took, or a to-do given to the wrong person.
- **Why it fails:**
  - FN-1: every claim true today, in the app's words.
  - TR-3: errors in the legal text are trust bugs.
  - The Terms are the contract, so the lawyer at the WD3 sign-off will want the duty to match what the app does.
- **Fix** (subtract-first; one phrase, no new sentence). Replace "before saving or sharing" so that the sentence covers notes that are already saved:
  - EN: "Check titles, dates, times, priorities, notes, recipients and project assignments before saving, sharing or relying on them."
  - ES: «Revisa título, fecha, hora, prioridad, notas y destinatarios antes de guardarlos, compartirlos o fiarte de ellos.»
  - CA: «Revisa títol, data, hora, prioritat, notes, projecte i destinataris abans de desar-los, compartir-los o refiar-te’n.» (needs a native Catalan read)
  - This is a legal edit. It goes through `docs/LEGAL_RELEASE.md` and the owner's sign-off (WD3); ride it with any privacy fix from review L.
  - If it ships after today, `company.json` `version` moves to its date.
- **Verify:**
  - `tests/ux-web-legal.spec.ts`: Terms `#ai` contains "relying on them" / «fiarte de ellos» / «refiar-te’n», and no longer the bare "before saving or sharing" / «antes de guardar o compartir» / «abans de desar/compartir».
  - `npm run legal:check`.
  - A crop of `terms.<lang>.mobile.light.full.png` at §5.
- **Evidence:** verified in code (site and app). Not a render finding.

### Claims checked
| Claim (page, `path:line`) | Source of truth (`path:line`) | Verdict |
|---|---|---|
| Voice FAQ: "Understanding what you say needs the internet: your words are sent to Google." (home, `src/content/site/en.ts:107`; es/ca `:107`/`:113`) | `origin/main:Backend/core/ai.py:160-173` (Vertex client only); `../TaskFlow/App/lib/l10n/app_en.arb:553` `capturePrivacyLine` "Your words go to Google’s AI." | true |
| Demo: "What you say or type goes to Google only when you tap Done or the minute is up." (`en.ts:161`; es `:161`, ca `:167`; render `voice-capture.en.mobile.light.view.png`) | `src/lib/voice/model.ts:44-51` (`vertexai: true`, no key); privacy §8 `src/content/legal/en.ts:141` | true |
| Privacy §4: "The app and the website demonstration use Google Cloud’s Vertex AI." (`legal/en.ts:57`) | `origin/main` `aa627da`; `Backend/core/meetings.py` (all AI on Vertex); `src/lib/voice/model.ts:45` | true (L's area, checked for consistency with the home) |
| No "Gemini API", "AI Studio" or "API key" left in visible copy (grep of `src/content/`, `src/components/`) | `aa627da` removes the AI Studio route | true |
| FAQ Pro paragraph: "unlimited dictation and file space (with a safety limit of 50 dictations a day)" (`en.ts:96`; es `:96`, ca `:102`) | `app_en.arb` `proBenefitDictation`; `origin/main:Backend/config/settings.py:141` `AI_REQUESTS_PER_DAY` 50 | true |
| FAQ Pro paragraph: "turns sentences you type into tasks, and lets you ask for reminders in your own words" (`en.ts:96`) | `app_en.arb` `proBenefitTyping`, `proBenefitReminders` | true |
| FAQ Pro paragraph, read as the list of what Pro gives (`en.ts:96`, `es.ts:96`, `ca.ts:102`) | `../TaskFlow/App/lib/screens/subscription_screen.dart:186-193` (4 lines, the last `proBenefitMeetingNotes(20)`); `app_en.arb:4469` | incomplete → **WEB-2002 (decision)** |
| Closing card: "TaskFlow Pro, a monthly subscription: unlimited dictation and file space." (`en.ts:141`) | WD2's short form (ux-web DECISIONS, 2026-10-18 night) | true (by decision) |
| Demo: "In the app, turning typed sentences into tasks is part of TaskFlow Pro." (`en.ts:184`) | `proBenefitTyping` | true |
| Free FAQ: "10 free dictations a month… form with no limit" (`en.ts:95`); hero free line (`en.ts:53`) | `origin/main:Backend/config/settings.py:144`; meetings don't use free dictations (`Backend/docs/MEETINGS.md`, Models and cost) | true; meetings aren't offered as free anywhere on the home |
| Notes FAQ: "Tap Add a note, then write or dictate it" (`en.ts:127`; es «Añadir nota», ca «Afegeix una nota») | `../TaskFlow/App/lib/screens/notes_screen.dart:312` `addNote`; `app_es.arb:39`, `app_ca.arb:40` | true (Record a meeting sits beside it, Pro only: `notes_screen.dart:279-288`) |
| Offline FAQ: "Saving to your account, understanding what you say, and uploading files need a connection." (`en.ts:117`) | MN-11 (recording works offline; the notes wait for a connection) | true |
| Features card "Notes, checklists and files" (`en.ts:76-77`) | unchanged app features | true; no meeting claim |
| Privacy summary 02: "…or to make notes from a meeting you record." (`legal/en.ts:10`) and §4 "Pro includes up to 20 hours of meetings a month" (`:56`) | `proBenefitMeetingNotes` "up to 20 hours a month"; `Backend/docs/MEETINGS.md` Access (240 pieces); D2/D4 of 2026-11-04 | true; no home line contradicts it, but the home never names the feature (WEB-2002) |
| Privacy §4: the audio is deleted once it's text (`legal/en.ts:56`) | `app_en.arb:4478` `meetingAudioDeleted` "The audio is sent to make the notes, then deleted." (D5) | true, same fact as the app's line |
| Terms §3: "Available features and any storage or AI limits are shown in the app and the offer you select." (`legal/en.ts:217`) | the Pro screen shows "up to 20 hours a month" | true |
| Terms §5: "Check … notes … before saving or sharing." (`legal/en.ts:235`) | `meeting_uploader.dart:380` (meeting notes saved without review) | outdated → **WEB-2001** |

### Missing from the site (app features worth telling)
- **Meeting notes** (Pro: record a conversation, get a summary, decisions, to-dos and a task with a checklist; up to 20 hours a month).
  - Sources: `../TaskFlow/App/docs/MEETING_NOTES.md` §4, `app_en.arb:4016` `meetingRecord`, `:4469` `proBenefitMeetingNotes`.
  - Where it would belong: one clause in the FAQ's Pro paragraph. The owner decides whether it goes there (WEB-2002), so it isn't proposed as a fix.

### Keep
- The voice FAQ and the demo say "Google", not a product name. The Vertex-only change needed no home edit, and the privacy page carries the detail (PV-1 layers).
- The Pro paragraph's wording is the Pro screen's, line by line (FN-6). Any meeting clause should reuse `proBenefitMeetingNotes`' words.
- The home's free lines never promise meeting notes. Meeting notes are Pro only, and free accounts get the Pro screen (D2).
- The privacy page's meeting sentence matches the app's own recording-screen line (D5, MN-34).

### Questions for the owner (product decisions only)
**WEB-2002 · Severity 2 · decision · The FAQ's Pro list leaves out meeting notes**
- **Where:**
  - FAQ "Is TaskFlow free?", second paragraph (`src/content/site/en.ts:96`, `es.ts:96`, `ca.ts:102`).
  - Possibly the Notes answer (`en.ts:127`, `es.ts:127`, `ca.ts:133`).
- **The moment** (comparer): "Pro is unlimited dictation, typed sentences and reminders in my words." Then the privacy page's second summary line: "…or to make notes from a meeting you record." "What meeting? Can TaskFlow do that? Is it in Pro?"
- **What's true:**
  - The app's Pro screen has four lines; the fourth is "Notes from your recorded meetings, up to 20 hours a month" (`subscription_screen.dart:186-193`, `app_en.arb:4469`).
  - The privacy page now describes the feature in its summary, §2, §4 and §7.
  - The home names it nowhere.
  - Nothing on the home is false. The Pro paragraph reads like the whole list, but it doesn't say "only".
- **Options:**
  - **(a) Not on the home** (subtract before adding). Only the privacy page tells, and the Pro paragraph stays 3 of 4.
  - **(b) One clause in the Pro paragraph, in the app's words.** Nothing else changes: no new section, and the closing card keeps WD2's short form.
    - EN: "It also turns sentences you type into tasks, lets you ask for reminders in your own words, and makes notes from the meetings you record, up to 20 hours a month."
    - ES: «Además, convierte en tareas las frases que escribes, te deja pedir los recordatorios con tus palabras y hace notas de las reuniones que grabas, hasta 20 horas al mes.»
    - CA: «A més, converteix en tasques les frases que escrius, et deixa demanar els recordatoris amb les teves paraules i fa notes de les reunions que enregistres, fins a 20 hores al mes.» (needs a native Catalan read)
  - **(c) (b), plus one sentence in the Notes answer:** EN "With Pro, you can also record a meeting and get its notes."
- **Recommendation: (b).**
  - FN-6 asks Pro to be described as the app's paywall describes it, and TR-2 asks what Pro gives to be on the page before any commitment.
  - One clause inside an answer the comparer opens doesn't touch the newcomer's path.
  - (c) adds a second place for a Pro-only feature on a newcomer's question. Not now.
  - Caveat: MEETING_NOTES.md's status line says the feature isn't yet checked on a phone or against real Vertex calls. If the owner wants the site to wait for that, (a) until then.
- **Verify, if (b):**
  - The FAQ test asserts the clause in EN/ES/CA, with "20" matching `meetingHoursPerMonth` (`../TaskFlow/App/lib/l10n/meeting_copy.dart:13`).
  - `home-faq-pricing.es.mobile.light.view.png` and its 320 px / text200 renders show no widow (recurring problem: longer ES/CA copy).

### Cross-slice notes
- **L:**
  - **Catalan wording.** The Catalan privacy page says «gravar una reunió» / «graves» / «Reunions gravades» (`legal/ca.ts:10, 33, 56, 59, 126`). The app's button and Pro line say «Enregistra una reunió» / «reunions que enregistres» (`app_ca.arb:1132, :1211`). FN-2.
  - **Review before saving.** Privacy §3 ("The AI suggests titles, dates and priorities for your review", `legal/en.ts:48`) and §4 ("Review every generated date, time, assignment and note before saving", `:59`) have WEB-2001's gap: meeting notes save without review.
  - **"Your words".** Privacy summary 02 says "Your words go to Google’s AI … to make notes from a meeting you record" (`legal/en.ts:10`). For a meeting it's the audio, other people's voices included, that goes (§4).
  - **Delete page.** Delete-account §3's "Deleted" bullet (`legal/en.ts:368`) doesn't name meeting recordings waiting on the phone or the server. Privacy §7 does (`:126`), and the app clears them (`../TaskFlow/App/lib/services/account_deletion.dart:167-169`).

### Memory notes
- **Claims map, AI provider row is out of date.** It's now "app and demo both on Google Cloud’s Vertex AI only, no API key" (privacy §4 `legal/en.ts:57-58`; app `origin/main` `aa627da`, `Backend/core/ai.py:160-173`). WD12's paid-or-free half is answered (ux-web DECISIONS, 2026-11-05).
- **Claims map, new meeting-notes rows:**
  - privacy summary 02 (`legal/*.ts:10`), §2 voice bullet (`:33`), §4 ¶2 (`:56`) and §7 meeting bullet (`:126`);
  - home: none (WEB-2002);
  - app sources: `proBenefitMeetingNotes` `app_en.arb:4469`, `meetingAudioDeleted` `:4478`, `meetingRecord` `:4016`, `meetingHoursPerMonth` `App/lib/l10n/meeting_copy.dart:13`, `Backend/docs/MEETINGS.md` (Pro only, 240 pieces a month, not counted in free or daily dictations);
  - meeting notes auto-save (`App/lib/services/meeting_uploader.dart:380`), so any "review before saving" copy is untrue for them.
- **App Pro screen.** Four benefit lines (`subscription_screen.dart:186-193`); the reminders and meetings lines drop when the screen opens for that reason.
- **Technique.** In a cloud clone, `ux-web.sh since --app` answers `NO_SNAPSHOT`: use `git log`/`git show` in `../TaskFlow`. Also check `git merge-base --is-ancestor <commit> HEAD`: the app checkout can lag `origin/main`, where the decision's commit lives (here `aa627da`), so read claims from `origin/main`.
- **Recurring problem.** When the app adds an AI feature that writes without a review step, grep the legal pages for "review", "check … before saving", «revisa», «antes de guardar», «abans de desar».
