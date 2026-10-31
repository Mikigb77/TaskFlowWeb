## UX web review — H2: the demos (`#voice`, every state) — 2026-10-29

**Verdict:** Ship after fixes. The demo is honest, plain and measured clean in all 69 states, but one failed AI call tells visitors "the live demo is off" and throws away their words (WEB-1301), and a recording can't be stopped without sending it to Google (WEB-1302).

**Walked:**
- **Evidence and its age.**
  - Chromium renders, 2026-10-28 17:57–17:59: 69 demo states, 280 PNGs, all in English; the home pages in EN, ES and CA, including text200, zoom200, w320 and no JavaScript.
  - `AUDIT.md`: production build of 2026-10-28 16:57 UTC; §13 covers the demo states.
  - WebKit renders, 2026-10-29 08:59: pages only, no demo states.
  - The demo's code last changed on 2026-10-21 (`VoiceDemo.tsx`, `voice.css`) and its copy on 2026-10-22 (`src/content/site/`). TaskFlowWeb is clean at 44e9921, so the renders are current.
  - `ux-web.sh since` shows no change to the demo files since the last web review.
  - The app renders I compared with (`App/build/ux/capture/*`, 2026-10-28) are newer than the app code they show (2026-10-22).
  - The real voice API was never called.
- **`src/components/TaskDemo.tsx` no longer exists.** WD1 removed the sample walkthrough. Its role is now the static example (`src/components/VoiceExample.tsx`), which shows in the intro, without JavaScript, when the demo is off, and after the security check gives up.
- **Newcomer** (Spanish, phone, light, then dark). 11 steps:
  1. The hero's «Pruébalo con tu voz».
  2. The `#voice` intro with the static example.
  3. «Probar la demo en directo».
  4. «Un momento…».
  5. The capture screen.
  6. «Toca para hablar».
  7. The browser's microphone prompt.
  8. «Escuchando · 0:05», then the 50 s state.
  9. «Listo».
  10. «Entendiendo…» at 1, 10, 30 and 39 s, then the timeout.
  11. The result (1, 3 and 6 tasks, a question, the transcript), «Volver a decirlo», the last try, and tries used.

  Branches walked:
  - the microphone refused, missing, busy or unsupported;
  - the security check pending, unreachable or given up;
  - offline, both on opening and on sending;
  - the demo off;
  - every API refusal: 41 states.

  The Spanish and Catalan copy was read in `es.ts` and `ca.ts`; the states themselves are rendered only in English.
- **Comparer** (desktop 1440 × 1000, light and dark). 6 steps: the intro, "Type instead", typing, Done, the two-column result, "See what I said".
- **Assistive-technology user.** For all 69 states: the ARIA snapshots (`aria/voice-*.txt`), and the focus and announcements in `AUDIT.md` §13. Also the keyboard path from "Tap to talk" to Done (WEB-1304), and the home's Tab path (AUDIT §10: 35 stops on desktop and 29 on the phone, all visible).
- **200% text and 320 px.** Only the intro state is rendered at these sizes, in the home renders; `AUDIT.md` §3 shows no sideways scrolling or clipping. The open WEB-801 (the tries badge at 200% text) can't be re-checked from this run (see the cross-slice notes).
- **Leaver.** Outside H2. The demo's privacy link goes to `/privacy/#website` in the page's language (`src/components/VoiceDemo.tsx:924`).

**Numbers:**
- **First view on landing at `#voice` from the hero:**
  - phone: 55 words and 1 filled button ("Try the live demo", at y ≈ 465–523 of 664);
  - desktop: 66 words and 1 filled button.
- **Taps from the hero to a spoken result on a first visit:** 5 (the hero button, Try the live demo, Tap to talk, the browser's Allow, Done), plus 1 when Cloudflare asks for a tap. The app takes 2 to a result and 1 to add (WEB-9).
- **Controls you can use while recording:** 1 (Done). After WEB-1302: 2.
- **Typing on a phone:** Done starts 286 CSS px below the text box (`voice-typing…panel.png`). After WEB-1308: about 30.
- **After a result on a phone (AP-13):**
  - with 1 or 2 plain tasks, the hand-over ("In the app… Coming soon to Google Play.") is in view (`voice-result-one…`; the 2-task `artifacts/voice-review-mobile.png` of 2026-10-23);
  - with 3 tasks, a note and a question, it starts about 74 px below the fold (y ≈ 738).

  The third card is cut at the fold, so the page visibly continues. Not filed.
- **The off stage:** 8 of the 69 states show it. 2 of those, `voice-error-unavailable` and `voice-connect-unavailable`, are passing failures shown as "off" (WEB-1301).
- **Measured** (`AUDIT.md` §13, lab):
  - axe violations: 0 in 69 states;
  - text under 12 px: 0;
  - text contrast failures: 0;
  - control contrast failures: 0;
  - unnamed controls: 0;
  - focus left on the page, not on a control: 2 states, `voice-mic-waiting` and `voice-recording` (WEB-1304).

  The 24 × 24 result checkboxes are listed as under 44 px. They sit inside 44 px rows whose label also toggles them, so the real target is the row; not filed.
- **Body text under 16 px on the homes:** 1, the 14 px label «Per exemple, digues:» (CA only; EN and ES are under the audit's 20-character threshold). It's a label, so it's accepted.
- **Claims checked:** 26. False: 2 (WEB-1301, and WEB-1302 at the 60 s limit). Outdated: 1 (WEB-1303). Drawn unlike the app: 3 (WEB-1305, WEB-1306, WEB-1307).

**Attention:** predicted from the renders with GUIDELINES §21.4; this is not measured eye-tracking.
- **`voice-intro.en.mobile.light.view.png`** (landing on `#voice` from the hero):
  1. The H2 "Try it with your voice": the largest, highest-contrast text, in the top half.
  2. The filled "Try the live demo". It's in the bottom third, but it's the only filled control and stands alone.
  3. The quote at the bottom edge, or the green "This demo: 3 tries a day, no sign-up" badge.

  Competing: the light grey intro paragraph. The one next step is among the first three.
- **`voice-intro.en.desktop.light.view.png`:**
  1. The H2, top left.
  2. "Try the live demo", filled, in the centre.
  3. The example's two cards.

  The thin grey intro and the small badge at the left are likely skipped.
- **`voice-capture.en.mobile.light.view.png`:**
  1. "What would you like to remember?"
  2. The filled round microphone with "Tap to talk", in the middle band.
  3. The quote, or the bold "Close demo" at the top right.

  The privacy line (14 px, grey) starts in the bottom third: probably skimmed, but it's in the first view.
- **`voice-recording.en.mobile.light.view.png`:**
  1. The heading.
  2. The filled Done.
  3. "Listening · 0:05" in grey.

  Nothing moves or reacts to the voice (WEB-1305). Close demo and Type instead are greyed out (WEB-1302).
- **`voice-result.en.mobile.light.view.png`:**
  1. "3 things to add".
  2. The first title, with its empty square box (its dark edge draws the eye; WEB-1306).
  3. The peach question box.

  The 14 px green date lines rank below the titles and boxes (WEB-1307). The hand-over and the filled button are below the fold.
- **`voice-result.en.desktop.light.view.png`:**
  1. "3 things to add".
  2. The card titles, left column first.
  3. The filled "Change the text", with the bold hand-over just above it competing.
- **`voice-tries-used.en.mobile.light.view.png`:**
  1. The tries-used sentence.
  2. The hand-over.
  3. The "0 of 3 tries left" badge.

  There's no filled control, which is right: there's nothing left to do.
- **`voice-error-unavailable.en.mobile.light.view.png`:**
  1. The static example's quote.
  2. Its two cards.
  3. The peach "The live demo is off for now…" box at the bottom.

  The visitor's own words are gone from the screen (WEB-1301).

### Findings (most severe first)

**WEB-1301 · Severity 3 · One failed AI call says "the live demo is off"**
- **Where:**
  - `src/components/VoiceDemo.tsx:67-72`: `unavailable` is grouped with `paused`, `budget_pause`, `not_ready` and `budget_config`. Both `submit` (:560-561, :609) and `statusFailed` (:368-375) use it.
  - The off stage: :797-802.
  - The copy, `errors.off`: `src/content/site/en.ts:223`, `es.ts:224`, `ca.ts:233`.
  - Pages `/`, `/es/` and `/ca/`, phone and desktop, both themes.
  - Renders: `voice-error-unavailable.en.{desktop,mobile}.light.{view,panel}.png`, `voice-connect-unavailable.en.mobile.light.*`.
- **The moment:** After "Understanding…", her own sentence disappears and the card says "The live demo is off for now." She thinks: "So it doesn't work. Never mind." She leaves. Or she closes the demo, opens it again, and finds "2 of 3 tries left" for nothing.
- **What happens:**
  - **What the server sends** (cause server-side). Any unexpected error gets `503 unavailable` (`src/lib/voice/security.ts:191-208`). That includes errors after the try is recorded (`src/app/api/voice/draft/route.ts:79-100`): an AI error or quota refusal, the model's 35 s timeout (`src/lib/voice/model.ts:48`), or an answer that isn't JSON (:75).
  - **What the page shows.** It treats `unavailable` like a deliberate pause:
    - the form, and the typed text or recording, give way to the static example and "The live demo is off for now. The example above shows what TaskFlow does." (`AUDIT.md` §13, row `voice-error-unavailable`);
    - there's no Try again;
    - the badge says "Live demo", so the spent try doesn't show.

    The status check's `unavailable` does the same when the demo opens.
  - **The demo isn't off.** Close demo, then Try the live demo, works again, but nothing says so.
  - **Slow calls end here too.** The model gives up at 35 s and the page at 40 s (`VoiceDemo.tsx:535`). So a slow AI call usually ends on "off", not on the page's own "This is taking too long… it won't use another try" (`en.ts:219-220`).
  - **The real off stage has no hand-over.** When the demo is really off (paused, budget), the stage ends without the hand-over line that the unverified stage has (:1122-1128).
- **Why it fails:**
  - OL-2 and OL-1 (Nielsen 2013): say what happened and what to do; every step can be retried.
  - PF-8 (Nielsen 1993): a way forward that keeps what was said.
  - FN-4: failures reflect the app's. The app says "Couldn't reach the assistant — your words are kept." (`captureUnavailable`, `App/lib/l10n/app_en.arb:1672`) and keeps them.
  - TR-3: errors are trust bugs.
  - Lens O: the demo fails gracefully.
- **Fix:**
  1. In `failureFor`, take `unavailable` out of the off group.
     - It shows the existing `errors.notAnswering`:
       - EN "The demo isn't answering right now. Try again in a few minutes."
       - ES «La demo no responde ahora mismo. Vuelve a probar en unos minutos.»
       - CA «La demo no respon ara mateix. Torna-ho a provar d’aquí a uns minuts.»
     - It keeps the form with the typed text or the recording.
     - A filled Try again sends them again as a new request. The failed request's ID would only come back as `previous_failure`.
     - On opening, it shows the connecting state's Try again.
  2. Keep "off" only for `paused`, `budget_pause`, `not_ready` and `budget_config`. End that stage with the existing hand-over line, as the unverified stage does.
  3. No new strings.
- **Verify:**
  - With the draft stubbed to 503 `unavailable`:
    - no `[data-stage="off"]`;
    - the textarea keeps its text (typing), or Try again shows (voice);
    - the alert is `notAnswering` in EN, ES and CA;
    - Try again sends a request whose `X-Request-Id` differs from the first one.
  - With the status stubbed to 503 `unavailable`: the connecting Try again shows, not the example.
  - `voice-error-paused` and `voice-error-budget-pause` still show the off stage, now ending with the hand-over.
  - Renders: `voice-error-unavailable`, `voice-connect-unavailable`.
- **Evidence:** seen in current renders; measured (`AUDIT.md` §13); verified in code. How often the AI fails needs the real service: the owner's check.

**WEB-1302 · Severity 3 · A recording can't be stopped without sending it**
- **Where:**
  - `src/components/VoiceDemo.tsx:777-788`: "Close demo" has `disabled={recording || loading}` (:779).
  - :989: "Type instead" is disabled while recording.
  - :506: the 60 s limit sends the recording.
  - `startAgain` (:656-676) doesn't stop the microphone.
  - The privacy line: `en.ts:152-153`, `es.ts:152-153`, `ca.ts:158-159`.
  - Renders: `voice-recording.en.{desktop,mobile}.{light,dark}.view.png`, `voice-recording-50s…`.
  - `aria/voice-recording.en.txt`: `button "Close demo" [disabled]`, `button "Type instead" [disabled]`.
- **The moment:** The wary Newcomer starts talking, then thinks better of it: "Stop, I don't want this sent." Close demo is greyed out. The only button she can use says Done, and the line under it says Done is what sends it to Google.
- **What happens:**
  - While listening, Done is the only control that works.
  - Scrolling away doesn't stop it: at 60 s the recording is sent anyway (`:506`). The app does the same (`App/lib/screens/voice_task_screen.dart:1001-1002`).
  - So at the 60 s limit, the privacy line "What you say or type goes to Google only when you tap Done" isn't true.
  - Her only private way out is to close the tab, which means leaving the site.
  - The app's listening screen has Cancel under Done (`App/build/ux/capture/sheet.listening.en.light.2x.png`; `voice_task_screen.dart:2471, :2537`).
- **Why it fails:**
  - OL-1: every step can be undone.
  - PV-3: the just-in-time note before the microphone must be true.
  - FN-3: the app's listening screen offers Cancel.
  - TR-2 and lens I: no dark patterns, here a greyed-out way out.
- **Fix:**
  1. Keep "Close demo" enabled while recording. It stops the microphone and throws the recording away, sends nothing and uses no try, then returns to the closed card as it does today.
  2. Say the 60 s rule in the privacy line:
     - EN "What you say or type goes to Google only when you tap Done or the minute is up. We don’t keep your recording, and the text is deleted automatically after 24 hours."
     - ES «Lo que dices o escribes va a Google solo cuando tocas Listo o se acaba el minuto. No guardamos tu grabación, y el texto se borra automáticamente pasadas 24 horas.»
     - CA «El que dius o escrius va a Google només quan toques Fet o s’acaba el minut. No desem la gravació, i el text s’esborra automàticament passades 24 hores.»
- **Verify:**
  - In `voice-recording`, the ARIA snapshot shows `button "Close demo"` enabled.
  - Clicking it ends the fake microphone's track (`readyState === "ended"`), sends no `/api/voice/draft/` request, and leaves a reopened demo at "3 of 3 tries left".
  - The privacy line has the new clause in EN, ES and CA.
  - Device: in Chrome on Android, the system's recording indicator goes off when Close demo is tapped.
- **Evidence:** seen in current renders and the ARIA snapshot; verified in code; the app compared on its current render and code.

**WEB-1303 · Severity 2 · No-tasks message is the app's old sentence**
- **Where:** `src/content/site/en.ts:195`, `es.ts:194-195`, `ca.ts:202-203`, shown by `VoiceDemo.tsx:1074-1080`. Renders: `voice-no-tasks.en.{desktop,mobile}.{light,dark}.*`.
- **The moment:** "No tasks were found. Your words are kept." She thinks: "Found where? What should I say?"
- **What happens:**
  - The site copied the app's `captureNoTasks` in run 2026-10-18-site (WEB-12).
  - On 2026-10-20 the app replaced it (app commit 7642a9e) with a sentence that says what to do: "I didn’t find a task. Say what and when, for example: “Tomorrow, call the dentist.”" (`App/lib/l10n/app_en.arb:1667`; ES `app_es.arb:889`; CA `app_ca.arb:704`).
  - The site still has the old one, plus "That used a try."
- **Why it fails:**
  - FN-2 and FN-1: the app's words, true today.
  - OL-2: say what to do next.
  - RD-1: the point first.
- **Fix:** the app's current sentence, then the demo's honest clause:
  - EN "I didn’t find a task. Say what and when, for example: “Tomorrow, call the dentist.” That used a try."
  - ES «No he encontrado ninguna tarea. Di qué y cuándo, por ejemplo: «Mañana, llamar al dentista». Ha contado como un intento.»
  - CA «No he trobat cap tasca. Digues què i quan, per exemple: «Demà, trucar al dentista». Ha comptat com un intent.»
- **Verify:**
  - With 0 tasks stubbed, the stage heading matches these strings in EN, ES and CA.
  - "No tasks were found", «No se encontraron tareas» and «No s’ha trobat cap tasca» no longer appear anywhere in `src/`.
  - `tests/support/ux-web-copy.ts` pins the app's ARB sentence, so the next change in the app breaks the test.
- **Evidence:** verified in code against the app's ARB files and their git history; seen in the `voice-no-tasks` renders.

**WEB-1304 · Severity 2 · Starting a recording drops keyboard focus to the page**
- **Where:**
  - `src/components/VoiceDemo.tsx:866-868`: the record button is `disabled` while `loading` (:488, :695).
  - :420-437: focus is managed only when the stage changes, and starting to record doesn't change the stage.
  - `AUDIT.md` §13: Focus is "page" in `voice-mic-waiting` and `voice-recording`, in all four of each state's rows.
- **The moment:** A keyboard user presses Enter on "Tap to talk", says the sentence and presses Enter again. Nothing happens. Tab lands on "How we use your data", where Enter would open the privacy page.
- **What happens:**
  - While the browser asks for the microphone, the button is disabled, so the browser drops focus to the page.
  - When listening starts, the same button becomes Done, but focus stays on the page.
  - Tab goes to the next stop after the button (the privacy link; Type instead is disabled), and Shift+Tab goes back up the page. Reaching Done takes two keystrokes.
  - Desktop screen-reader users lose their place the same way.
- **Why it fails:**
  - AX-4, and WCAG 2.4.3 Focus Order (A).
  - AX-10: show recording clearly, with its stop control.
  - WEB-719 fixed this same pattern for Try again.
- **Fix:** While waiting for the microphone, mark the button `aria-disabled="true"` and ignore presses, as Try again does (`:974-986`), instead of `disabled`. Focus then stays on it, and it becomes Done in place. If the microphone fails, focus goes to the text box, as today (WEB-14).
- **Verify:**
  - `AUDIT.md` §13 shows focus on `button#voice-record` in `voice-mic-waiting` ("Tap to talk") and `voice-recording` ("Done").
  - Playwright: focus the record button, press Enter, wait for the "Listening" status, press Enter again. Exactly one `/api/voice/draft/` request follows.
  - axe stays at 0.
- **Evidence:** measured (`AUDIT.md` §13); verified in code. NVDA and TalkBack behaviour need a device.

**WEB-1305 · Severity 2 · While listening, nothing shows the demo hears you**
- **Where:**
  - `src/components/VoiceDemo.tsx:853-891`: while listening, Done replaces the round microphone, and the hint is the only sign of recording.
  - `src/styles/voice.css:287-297`.
  - `src/lib/voice/recorder.ts:18-28`: the audio arrives, but its level isn't used.
  - Renders: `voice-recording.en.mobile.{light,dark}.view.png`, `voice-recording-50s…`.
- **The moment:** "Is it hearing me? Nothing moves." The Newcomer speaks louder, repeats herself, or taps Done after two words.
- **What happens:**
  - Listening looks like the screen before it, minus the microphone: the quote, a Done button and "Listening · 0:05" in grey. Nothing reacts to her voice.
  - The app keeps the microphone on screen, inside a ring that follows the voice level (`App/lib/screens/voice_task_screen.dart:2490-2519`; `App/build/ux/capture/sheet.listening.en.light.2x.png`). When it hears nothing, it says "Nothing heard yet…" (`captureNothingHeardYet`, `app_en.arb:1730`).
  - In the demo, a muted or wrong microphone records a minute of silence and spends a try on "No tasks".
- **Why it fails:**
  - AX-10: show recording clearly.
  - PF-8: feedback within 0.1 s of speaking.
  - FN-3: the demo's listening screen should look like the app's.
  - Lens O: a taste that feels like the app.
- **Fix:**
  - Keep the round microphone on screen while listening, above Done, as a picture rather than a button (`aria-hidden`).
  - Let its mint halo grow and shrink with the voice level, which the recorder already receives, as the app's ring does.
  - Under reduced motion, change the halo in steps, without easing.
  - Nothing new to read. It fills the space the microphone leaves empty today.
- **Verify:**
  - In `voice-recording`, the microphone circle shows above Done and is `aria-hidden`.
  - With Chromium's fake device (a beep), its halo differs from its idle size.
  - axe 0.
  - Device: a real phone, speaking and then silent.
- **Evidence:** seen in current renders; the app compared on its current render and code. How it feels needs a device.

**WEB-1306 · Severity 2 · Result tick boxes read as "pick what to add"**
- **Where:**
  - `src/components/VoiceDemo.tsx:1029-1051`; `src/styles/voice.css:453-475`.
  - Renders: `voice-result.en.{desktop,mobile}.{light,dark}.*`, `voice-result-six…`, `voice-last-try…`.
  - `aria/voice-result.en.txt`: `checkbox "Doctor appointment"`.
- **The moment:** Under "3 things to add", each task has an empty square box. "Do I tick the ones I want to add?" She ticks one, sees only the tick, and never reaches the "All clear. Take a breath." moment the owner asked for (WD16).
- **What happens:**
  - The square checkbox is named only by the task's title. Nothing, seen or spoken, says that ticking completes the task.
  - In the app:
    - the result has no tick at all: each card has × to remove it (`App/build/ux/capture/result.several.en.light.2x.png`);
    - command cards use ticks to choose which tasks an action includes (`.claude/ux-review/DECISIONS.md:57`);
    - a task is completed with a round circle named "Complete {title}" (`App/lib/widgets/task_tile.dart:278-288`; `completeNamedTask`, `app_en.arb:1904`). The hero image, one screen above the demo, shows that circle.
- **Why it fails:**
  - CT-5 and AX-8: a control shows what it does.
  - FN-2 and FN-3: the app's control and words.
  - OL-4: familiar design.

  WD16 decided the demo has completion controls. This finding changes only how they look and what they're called.
- **Fix:** Within WD16:
  - draw the toggle as the app's round circle, keeping the native checkbox underneath (WEB-901–903's tests rely on it);
  - give it the app's name: EN "Complete {title}", ES «Completar {title}», CA «Completa {title}»;
  - the title stays the visible label, and the row stays 44 px tall.
- **Verify:**
  - The ARIA snapshot shows `checkbox "Complete Doctor appointment"` (ES «Completar…», CA «Completa…»).
  - The box's computed border-radius is 50%.
  - `tests/ux-web-completion.spec.ts` still passes.
  - WCAG 2.5.3: the name contains the visible title.
  - A five-second test of the result with an older person.
- **Evidence:** seen in current renders and the ARIA snapshot; verified against the app's code and renders. That people read the boxes as a selection is a prediction; the test settles it.

**WEB-1307 · Severity 2 · The date to check is small print, never "Tomorrow"**
- **Where:**
  - `src/components/VoiceDemo.tsx:36-48`: `dateLine` always writes the weekday and date. Also :1053-1056 and :1060-1067.
  - `src/styles/voice.css:504-512`: the date line is 0.875rem and green. :523-527: the question is 0.875rem.
  - Renders: `voice-result.en.mobile.light.*`, `voice-result-one…`. Compare `voice-intro…`, where the static example says "Tomorrow".
- **The moment:** She says the example, "Tomorrow, call the dentist and buy bread", and the cards say "Thu, Oct 29" in small green type. "Is the 29th tomorrow?" The page has just told her: "It can get dates wrong, so check them."
- **What happens:**
  - The date line and the question are 14 px; the title is 18 px. In the app, the date is the card's main line (`.claude/ux-review/DECISIONS.md:269`; `App/build/ux/capture/result.question.es.light.2x.png`).
  - The app writes Today or Tomorrow when they apply, otherwise the weekday date (`App/lib/l10n/region.dart:24-34`; "Today" in `result.several.en.light.2x.png`). The demo always writes the weekday date, so its own example ("Tomorrow") and its live result disagree.
- **Why it fails:**
  - FN-3: show what the app shows.
  - RD-5 and OL-1: what the visitor has to check isn't small print.
  - SC-1: the key fact first.
  - HE-4: one concrete example.
- **Fix:**
  1. `dateLine` uses the app's words when they apply, by the visitor's date: EN "Today" / "Tomorrow", ES «Hoy» / «Mañana», CA «Avui» / «Demà» (the app's `today` and `tomorrow`), followed by " · " and the time. Other dates stay as they are.
  2. The date line and the question at 1rem, with the date's text in ink and its icon green.
- **Verify:**
  - With a task stubbed for tomorrow on the test's clock, the card reads "Tomorrow · 10:00 AM" (EN), «Mañana · 10:00» (ES), «Demà · 10:00» (CA).
  - Today reads "Today…"; other days are unchanged.
  - The computed font sizes are 16 px.
  - Render: `voice-result`.
- **Evidence:** seen in current renders; verified in code against the app's code and renders.

**WEB-1308 · Severity 2 · Typing on a phone: Done sits 286 px below**
- **Where:** `src/components/VoiceDemo.tsx:894-966`. The order today:
  1. the label;
  2. the text box;
  3. the counter;
  4. the Pro note (:919);
  5. the privacy line (:922-927);
  6. the security check;
  7. Done (:951-966).

  Renders: `voice-typing.en.mobile.light.panel.png` (the box ends at y ≈ 350, Done starts at ≈ 636); `voice-mic-denied…`, the path that forces typing; `voice-timeout…`.
- **The moment:** She types, then looks for the button. The phone's keyboard covers everything below the box. "How do I send it?"
- **What happens:**
  - Between the box and Done sit the counter, the 4-line Pro note and the 3-line privacy line: 286 CSS px.
  - With a phone keyboard up, roughly 290 px of page shows under the 73 px header. Done stays hidden until she closes the keyboard and scrolls.
  - A refused microphone lands here (WEB-14), so this is the Newcomer's fallback path.
- **Why it fails:**
  - AX-12 and CT-4: a field's action sits next to it.
  - CT-8: the action is in view.
  - OL-1.
- **Fix:** In typing mode only, use this order. Voice mode keeps its order, and no copy changes.
  1. The label.
  2. The text box.
  3. The counter.
  4. The security check, when it asks for a tap.
  5. Done.
  6. The privacy line. It stays next to the button it names, as it stays under the microphone in voice mode (PV-3).
  7. The Pro note.
  8. Talk instead.
  9. The fine print.
- **Verify:**
  - On `voice-typing` (390 × 664), the top of Done is within 60 px of the bottom of the box.
  - The privacy line directly follows Done.
  - With a 390 × 364 viewport (a keyboard's worth less) and the box focused, Done is in view.
- **Evidence:** measured on the current panel render; the keyboard's effect is inferred and needs a phone.

**WEB-1309 · Severity 1 · Typed text is called "what you said"**
- **Where:**
  - `errors.offline`, "What you said is kept…": `en.ts:214-215`, `es.ts:214-215`, `ca.ts:223-224`.
  - `errors.sayAgain`, "Something went wrong. Say it again.": `en.ts:232`, `es.ts:233`, `ca.ts:242`.
  - "See what I said" after a typed result: `en.ts:194`, `es.ts:193`, `ca.ts:201`; `VoiceDemo.tsx:1102-1105`.
  - Renders (all typed): `voice-offline…`, `voice-error-previous-failure…`, `voice-result-open…`.
- **The moment:** She typed, and is told "What you said is kept" and "Say it again" right beside her text box. After the result, "See what I said" opens the text she just typed.
- **Why it fails:**
  - Lens G: words that match what the visitor did; one concept, one name.
  - OL-2.
  - RD-2: fewer words.
- **Fix:** Neutral words and one subtraction; no new strings.
  - `errors.offline`, with the app's "your words are kept" (`captureUnavailable`):
    - EN "No connection. Check Wi-Fi or mobile data and try again. Your words are kept, and trying again won’t cost an extra try."
    - ES «No hay conexión. Revisa el wifi o los datos móviles e inténtalo de nuevo. Tus palabras se conservan y volver a probar no te costará otro intento.»
    - CA «No hi ha connexió. Revisa la wifi o les dades mòbils i torna-ho a provar. Les teves paraules es conserven i tornar-ho a provar no et costarà cap altre intent.»
  - `errors.sayAgain`:
    - EN "Something went wrong. Please try again."
    - ES «Algo ha fallado. Vuelve a probar.»
    - CA «Alguna cosa ha fallat. Torna-ho a provar.»
  - Drop "See what I said" after a typed result: Change the text already shows the text.
- **Verify:**
  - The `voice-offline` and `voice-error-previous-failure` alerts show the new strings in EN, ES and CA.
  - A typed `voice-result` has no `details.voice-transcript`; a spoken result still has it.
- **Evidence:** seen in current renders; verified in code.

**WEB-1310 · Severity 1 · "10 seconds left" stays until the minute ends**
- **Where:** `src/components/VoiceDemo.tsx:888-889`; `en.ts:168`, `es.ts:168`, `ca.ts:175`. Render: `voice-recording-50s.en.mobile.light.panel.png`, which reads "Listening · 0:51 · 10 seconds left".
- **What happens:** From 50 s to 59 s the hint keeps saying "10 seconds left". At 0:51 it's really 9, at 0:58 it's 2. The app counts down every second with `captureTimeLeft` (`App/lib/screens/voice_task_screen.dart:2166`).
- **Why it fails:**
  - FN-1 and FN-2: true, in the app's words.
  - AX-10: a visible countdown.
- **Fix:** From 50 s, the visible hint counts down with the app's plural:
  - EN "{n} seconds left" / "1 second left";
  - ES «Quedan {n} segundos» / «Queda 1 segundo»;
  - CA «Queden {n} segons» / «Queda 1 segon».

  Sources: `app_en.arb:1738`, `app_es.arb:912`, `app_ca.arb:727`. The live region still speaks once, at 50 s (WEB-15).
- **Verify:** At 55 s on the fake clock, the hint reads "Listening · 0:55 · 5 seconds left", and the status region was set only once.
- **Evidence:** seen in the current render; verified in code.

**WEB-1311 · Severity 1 · The 10-second line promises half a minute; page waits 40**
- **Where:**
  - The 10 s line: `en.ts:207-208`, `es.ts:208`, `ca.ts:216-217`.
  - `VoiceDemo.tsx:405-413`; :535, where the page gives up at 40 s.
  - `errors.processing`: `es.ts:231-232`.
  - Renders: `voice-waiting-10s`, `-30s`, `-39s`.
- **What happens:**
  - From 10 s the line says "Still understanding. This can take up to half a minute." It still says so at 31–39 s, then the page gives up at 40 s.
  - In Spanish, «Sigo entendiendo» reads oddly ("I keep understanding"). The Catalan «Encara ho estic entenent» is natural.
- **Why it fails:**
  - FN-1: true numbers.
  - SC-6: facts as digits.
  - PF-8: explain the wait.
  - ML-6: natural in each language.
- **Fix:**
  - The 10 s line:
    - EN "Still understanding. It can take up to 40 seconds."
    - ES «Todavía lo estoy entendiendo. Puede tardar hasta 40 segundos.»
    - CA «Encara ho estic entenent. Pot trigar fins a 40 segons.»
  - ES `errors.processing`: «Todavía lo estoy entendiendo. Vuelve a probar en un momento; no gastará otro intento.»

  The number must stay equal to the page's own limit (`:535`).
- **Verify:**
  - `voice-waiting-10s` shows the new line.
  - «Sigo entendiendo» no longer appears in `src/`.
  - A native Spanish read.
- **Evidence:** seen in current renders; verified in code.

**WEB-1312 · Severity 1 · Spanish and Catalan: a literal hint, two words for recording**
- **Where:** `micHint` in `es.ts:162` and `ca.ts:168-169`; `errors.recording` in `ca.ts:238-239`.
- **What happens:**
  - «El navegador te pedirá usar el micrófono» and «El navegador et demanarà fer servir el micròfon» say the browser will ask her to use the microphone. They're word-for-word versions of the English "will ask to use".
  - The Catalan recording error says «enregistrament». The privacy line beside it says «gravació», and so does the app, 6 times in `App/lib/l10n/app_ca.arb`, never «enregistrament».
- **Why it fails:**
  - ML-6: written for each language.
  - Lens G: one concept, one name.
  - FN-2: the app's words.
- **Fix:**
  - ES micHint: «Hasta un minuto. El navegador te pedirá permiso para usar el micrófono.»
  - CA micHint: «Fins a un minut. El navegador et demanarà permís per fer servir el micròfon.»
  - CA recording error: «No hem pogut sentir la gravació. Torna-la a gravar; no ha comptat com un intent.» (Needs a native Catalan read.)
- **Verify:** the strings in code; a native Spanish and Catalan read.
- **Evidence:** verified in code against the app's catalogs.

**WEB-1313 · Severity 1 · Dismissing the microphone prompt sends people to browser settings**
- **Where:** `src/components/VoiceDemo.tsx:508-516`: every `NotAllowedError` gets `micBlocked` (`en.ts:177-178`, `es.ts:177-178`, `ca.ts:184-185`). Render: `voice-mic-denied…`, Chromium's "permission denied"; the prompt itself is outside the page.
- **The moment:** The wary Newcomer taps outside the browser's prompt to make it go away. She reads "Turn it on in your browser’s settings for this site": a place she has never been.
- **What happens:**
  - A dismissed prompt and a blocked microphone both arrive as `NotAllowedError`.
  - After a dismissal, the browser asks again on her next tap, but the page sends her to settings.
  - The app tells the two cases apart:
    - "Without the microphone I can’t hear you. Tap Start talking to allow it, or Type instead." (`captureMicrophone`, `app_en.arb:1686`);
    - the settings path (`captureMicrophoneBlocked`, :1690).
- **Why it fails:**
  - AX-10: plain recovery steps for `NotAllowedError`.
  - OL-2.
  - FN-3.
- **Fix:** When the permission can still be asked for (`navigator.permissions.query({ name: "microphone" })` returns "prompt"), show:
  - EN "To talk, tap Talk instead and allow the microphone when your browser asks. Or type here."
  - ES «Para hablar, toca Hablar y permite el micrófono cuando el navegador te lo pida. O escribe aquí.»
  - CA «Per parlar, toca Parla i permet el micròfon quan el navegador t’ho demani. O escriu aquí.»

  Otherwise, or when the query isn't supported, keep `micBlocked`.
- **Verify:**
  - Playwright, with `getUserMedia` stubbed to reject with `NotAllowedError`:
    - when `permissions.query` returns "prompt", the new alert shows;
    - when it returns "denied", `micBlocked` shows.
  - Device: dismiss the prompt in Chrome on Android and in Safari on an iPhone (WEB-14's device check).
- **Evidence:** inferred from the code and the browsers' documented behaviour; needs a device.

**WEB-1314 · Severity 1 · On older Safari the wait never ends**
- **Where:**
  - `src/components/VoiceDemo.tsx:521-535`: `crypto.randomUUID()` (:528) and `AbortSignal.timeout(40_000)` (:535) run before the `try`.
  - :656-676: `startAgain` never clears `busy`.
  - :269-283: `busy` takes priority over every later stage.
- **What happens:** On browsers without `AbortSignal.timeout`, such as Safari before 16 (an iPhone 6s or 7 stays on iOS 15), tapping Done throws before any request is made.
  - The card stays on "Understanding…" for good.
  - Stop waiting does nothing, because there's no request to stop.
  - Close demo, then Try the live demo, opens the same "Understanding…" again. Only reloading the page clears it.
- **Why it fails:**
  - Lens O: fails gracefully.
  - PF-8 and OL-1.
- **Fix:**
  - Create the request ID and the timeout inside the `try`, or fall back to a timer when `AbortSignal.timeout` is missing.
  - Clear the waiting state when the demo is closed.
  - The visitor then gets `errors.notAnswering` with Try again.
- **Verify:**
  - In Playwright, delete `AbortSignal.timeout` before the page script runs. Done then shows an alert with Try again within 1 s, never a lasting "Understanding…".
  - Close demo, then Try the live demo, shows the capture stage.
  - Device: Safari on an iPhone with iOS 15.
- **Evidence:** inferred from code; needs a device.

### Claims checked
| Claim (page, `path:line`) | Source of truth (`path:line`) | Verdict |
|---|---|---|
| "This demo: 3 tries a day, no sign-up" (`en.ts:139`) | `src/lib/voice/policy.ts:4, :44-56` (3 per rolling 24 h); WD8 labels them the demo's | true |
| "Speak in English, Spanish or Catalan, for up to a minute." (`en.ts:140`) | `policy.ts:7`; `VoiceDemo.tsx:506`; `model.ts:53` (EN, ES, CA transcription) | true |
| "What you say or type goes to Google only when you tap Done." (`en.ts:152-153`) | `VoiceDemo.tsx:506`: the 60 s limit sends without Done (as the app does, `voice_task_screen.dart:1001-1002`) | false at the 60 s limit (WEB-1302) |
| "We don’t keep your recording" (`en.ts:153`) | `route.ts:77-91` (the audio only goes to the model); `store.ts:157-161` (only the result is stored); TaskFlowWeb `README.md:171` | true |
| "the text is deleted automatically after 24 hours" (`en.ts:153`) | `store.ts:122` (expires after 1 day); `README.md:171` (Firestore TTL deletion is asynchronous); `docs/LEGAL_RELEASE.md:40` | true; how fast TTL deletes is deployment config (cross-slice note L) |
| "It can get dates wrong, so check them. Nothing here is saved to the app." (`en.ts:155`) | No path to the app; `model.ts` is a separate model and prompt | true |
| Typing note: typed sentences are Pro; without Pro, say them or use a short form (`en.ts:175-176`) | `.claude/ux-review/DECISIONS.md:164-174` | true |
| Hand-over "In the app: tap Add a task, say it, tap Done, and add it to your calendar." (`en.ts:190-191`) | `app_en.arb:242` `addTask`; :1844 `captureFinish`; :1865-1867 (Add to calendar, Add {count} tasks) | true |
| "Coming soon to Google Play." (`en.ts:191`) | WD13; Play not published | true |
| "What would you like to remember?" (`en.ts:160`) | `app_en.arb:388` `rememberPrompt` (ES :221, CA :200) | true |
| "N things to add" (`en.ts:185`) | `app_en.arb:1857` (ES :985, CA :765) | true |
| "No date", "Check this detail: …" (`en.ts:186-187`) | `app_en.arb:233`, :34 | true |
| "See what I said", "Say it again", "Type instead" (`en.ts:192-194`, :170) | `app_en.arb:18`, :1875, :1722 | true (typing-mode wording: WEB-1309) |
| "One moment…", "Understanding…", "Listening · {time}", "Done" (`en.ts:156`, :169, :166, :164) | `app_en.arb:1702`, :1850, :596, :1059 | true |
| "10 seconds left" (`en.ts:168`) | `app_en.arb:1738`, a per-second countdown (`voice_task_screen.dart:2166`) | true at 50 s; stale from 51 s (WEB-1310) |
| "Say or type what you need to do first." (`en.ts:233`) | `app_en.arb:1756` `captureEmptyInput` | true |
| No-tasks "No tasks were found. Your words are kept. That used a try." (`en.ts:195`) | `app_en.arb:1667`, changed on 2026-10-20 (7642a9e) | outdated (WEB-1303) |
| Static example: “Tomorrow, call the dentist and buy bread.” gives 2 tasks on "Tomorrow" (`en.ts:143-151`) | The app's `dayLabel` (`App/lib/l10n/region.dart:24-34`); the hero image | true; the live result disagrees (WEB-1307) |
| "The live demo is off for now." after `unavailable` (`en.ts:223`; `VoiceDemo.tsx:67-72`) | `security.ts:191-208` (any error, also after the try is recorded) | false in that case (WEB-1301) |
| "We couldn’t hear that recording. Record it again; it didn’t use a try." (`en.ts:228-229`) | `route.ts:53-78` (body, payload and WAV checks run before `admit`, :79) | true |
| "We couldn’t turn that into tasks, and it used a try." (`en.ts:226-227`) | `route.ts:79-87` (admitted before the AI call) | true |
| "it won’t use another try" (`processing`, `timeout`; `en.ts:219-220`, :230-231) | `store.ts:55-77` (the same `X-Request-Id` brings back the stored result) | true for the Try again tap itself |
| The listening screen (Done and a timer) | `App/build/ux/capture/sheet.listening.en.light.2x.png`: a microphone ring, Cancel, the words as you speak | true, but drawn unlike the app (WEB-1302, WEB-1305) |
| Result cards with square tick boxes | App result: no ticks; done is a round circle, "Complete {title}" (`task_tile.dart:278-288`) | true under WD16, but drawn unlike the app (WEB-1306) |
| Completion "All clear. Take a breath." (`en.ts:188-189`) | No counterpart in `App/lib/l10n/app_en.arb` | owner question (WD16) |
| Plans line under the card (`HomePage.tsx`'s `closing.plans`, shown at `VoiceDemo.tsx:1154`) | WD2, WD14 | true (F's area) |

### Missing from the site (app features worth telling)
- **The words appear while you speak.** This is the app's listening screen (`App/build/ux/capture/sheet.listening.en.light.2x.png`). The demo can't show it without the browser's own speech service. If the site says it, it belongs in the FAQ's voice answer (area F); a product question, not a fix.
- **One tap answers the assistant's question.** The app offers chips such as «05:00 · 17:00 · Sin hora» (`App/build/ux/capture/result.question.es.light.2x.png`); the demo shows the question as text. That's fine for a taste, so no change.
- **A reminder said while dictating is kept** (free; `.claude/ux-review/DECISIONS.md`, 2026-10-22). The demo neither sets nor shows one. See Q3.

### Keep
- **The static example (WD1).** It teaches before asking, and stands in wherever the live demo can't run: without JavaScript, when the demo is off, and when the check gives up (`home-nojs…`, `voice-check-gave-up…`).
- **The app's own words through capture and result,** checked against the ARB keys above.
- **Plain messages for every server code, in three languages.** No server text reaches the page (`AUDIT.md` §13, the "Announced" column, 69 states).
- **Measured clean** in all 69 states, light and dark: axe 0, no small or low-contrast text, no weak control edges. Focus lands on the stage heading or the alert in 67 of 69 states.
- **Honest limits before use:** the badge, "up to a minute", the privacy line under the microphone with its link, and "It can get dates wrong, so check them."

### Questions for the owner
- **Q-H2-1. Should a demo try that fails on our side be given back?**
  - Today a try is recorded before the AI call and kept when the call fails or times out (`src/app/api/voice/draft/route.ts:79-100`, `src/lib/voice/store.ts:138-173`). A result with no task also counts.
  - The app counts a dictation only if the assistant answered: failed ones never count (`.claude/ux-review/DECISIONS.md:243-244`), and empty ones don't either (D4, :89).
  - **Recommendation:** yes, give back the try when the failure is ours (an AI error, a timeout, an unreadable answer). That's a server change. Keep "no task" counted, since it protects the €25 budget from empty requests; the copy already says so (WEB-1303).
- **Q-H2-2. Should the app get the demo's completion moment?** WD16's "All clear. Take a breath." is what visitors should "want daily from the app". Ticking off a day's last task in the app shows nothing like it; there's no such string in `App/lib/l10n/app_en.arb`.
  - **Recommendation:** bring the same line to the app's Calendar, through /ux, when the last task of the day is ticked. Until then, keep the demo's line: it describes a feeling, not a feature.
- **Q-H2-3. Should the demo's result show reminders?** A reminder said while dictating is kept by the app (free since 2026-10-22), and reminder plans are its newest feature. The live demo neither sets nor shows one, so "remind me the day before" seems to vanish.
  - **Recommendation:** not now. The demo teaches one thing: say it, and see it with its day. Reminders are already told on the calendar card and in the FAQ (WD20, WD21).

### Cross-slice notes
- **G / tester:** `webkit/home.en.*` show the Spanish home. WebKit sent Windows' Spanish Accept-Language, and `/` went to `/es/` (WD5 working as designed), so the WebKit set has no English home.
- **G / tester:** no render covers the WD16/WD17 completion state (`artifacts/ux-web/completion-banner/` is absent). No demo state is rendered in ES or CA, at 320 px or at 200% text, so WEB-801 and WEB-901 to WEB-903 can't be re-checked from this run.
- **L:** privacy §8 should match the demo's "the text is deleted automatically after 24 hours" (`README.md:171`: results expire at 24 h; TTL deletion is asynchronous) and WEB-1302's "or the minute is up".
- **H1:** the hero phone's week (19–25 October, "today" the 22nd) is already a week old on 2026-10-29 (WEB-5 and WEB-114: re-render before publishing).
- **F:** the plans line under the demo names Pro as "unlimited dictation and file space", right under the typing note that says typed sentences are Pro too. WD14 keeps the short wording; this only flags the two lines side by side.
- **Owner / server (out of my lane):** WD8's "same route as the app" is still pending. The demo calls Vertex `gemini-3.5-flash-lite` (`src/lib/voice/model.ts:51`); the app's free route is AI Studio's gemma with a Vertex fallback (`.claude/ux-review/DECISIONS.md:347`). Whether the demo is faster or smarter than the app (FN-4) needs the real AI.

### Memory notes
- **Demo map.** `#voice` is `src/components/VoiceDemo.tsx`. Its stages are in `data-stage`: intro, connecting, capture, processing, review, tries-used, off and unverified.
  - The static example is `VoiceExample.tsx` (WD1); `TaskDemo.tsx` is gone.
  - The copy is the `voice` block of `src/content/site/{en,es,ca}.ts` (`en.ts:135-235`).
  - Server codes are turned into copy in `failureFor` (`VoiceDemo.tsx:63-96`).
- **The app strings the demo mirrors,** to re-diff every run: `rememberPrompt`, `captureThingsToAdd`, `noDate`, `reviewResolve`, `reviewOriginal`, `captureSayAgain`, `captureTypeInstead`, `captureStarting`, `captureUnderstanding`, `listeningSeconds`, `captureTimeLeft`, `captureEmptyInput`, `captureNoTasks`, `addTask`, `done`. `captureNoTasks` changed on 2026-10-20 and the site missed it.
- **App comparison sources:**
  - renders: `App/build/ux/capture/sheet.listening.*`, `result.several.*`, `result.question.*`;
  - the day-label rule: `App/lib/l10n/region.dart:24-34`;
  - the done circle: `App/lib/widgets/task_tile.dart:278-288`.
- **Recurring problems:**
  - Focus is lost when a focused control becomes `disabled`. WEB-719 fixed Try again with `aria-disabled`; the record button still drops focus (WEB-1304).
  - A whole group of error codes is mapped to "off" (WEB-1301).
- **Techniques:**
  - `AUDIT.md` §13 showing Focus = "page" flags focus loss.
  - `git log -S'<string>' -- App/lib/l10n/app_en.arb` dates an app copy change.
  - On this machine, `webkit/home.en.*` is the Spanish home.
  - Demo states exist only in English and at 390/1440 px; there's no completion render.
