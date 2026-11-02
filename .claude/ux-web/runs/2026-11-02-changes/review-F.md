## UX web review — area F (features and faithfulness), changes since the last web review — 2026-11-02

**Verdict:** Ship. Nothing on the home page, in the FAQ, in the demo or in the images is false about the app merged on 2026-11-01. Two FAQ answers no longer match what the app says (S1 each). The account answer doesn't use the words of the app's new first screen. The voice answer says dictation needs the internet, but in airplane mode the app now offers to save a dictated task.

**Scope and base:** `ux-web.sh changed` and `since --app` both come back empty.
- The app-side snapshot (`refs/ux-web/app-last`, eba6a22, saved 2026-11-02 03:20) sits on the app's b8a4c8d, which already includes 2026-10-28-app and 2026-11-01-screens.
- So I diffed the app repo from 30c8ce0 to HEAD. Its app-side files and `App/lib` are identical to 6281e3d, the app that review F of 2026-10-28-site checked the site against.
- The changed app-side files: `App/lib/l10n/app_{en,es,ca}.arb`, `Backend/docs/COMPLETION_TIMES.md` (new), `REMINDER_PLANS.md`, `VOICE_COMMANDS.md`, `ACCOUNT_DELETION.md`, `App/docs/PACKAGE_ID.md` and the app's `DECISIONS.md` (D1, D2, D9, WD34).
- The site's copy hasn't changed since the last web review.

**Walked** (site renders made 2026-11-02 02:51–02:52, after the content's last change at 02:08; the app's preview renders were made during the app run on 2026-11-01. Both are Chromium or Flutter widget-test renders, not a device):
- **Newcomer, ES phone, 390 px, light:** hero → FAQ (account, voice, offline) → closing. Checked against the app's first screen (`../TaskFlow/App/build/ux/auth/sign-in.sign-in.es.light.1x.png`, 12:08) and its capture flow (`capture/result.several.en.light.2x.png`, 13:57). 4 steps.
- **Comparer, EN desktop, 1440, light:** feature cards → FAQ free and Pro → closing plans line. Checked against the app's Pro screen (`settings/pro.free.es.light.1x.png`, 13:25) and the ARBs. 3 steps.
- **The demo's result → completion → hand-over,** against the app's result card and Calendar's last-tick message (`calendar/agenda.all-clear.es.light.1x.png`, 09:57).
- **The hero and link-preview screenshot** (`public/images/hero-calendar-*.png`), against the app's current Calendar renders (`calendar/agenda.*`, 2026-11-01).

**Numbers:**
- Claims checked: 34, each in EN, ES and CA. False: 0. Out of date: 1 (WEB-1702). Named differently from the app: 1 (WEB-1701). Unverifiable: 0.
- App changes that touch a site claim: 4. The Pro screen's benefit list (now the site's own words), WD34's last-tick line (now the demo's), D1 offline dictation (WEB-1702), and the first screen's heading (WEB-1701).
- First viewport, scrolls to the first call to action on a phone, and steps to the honest "not yet": unchanged since 2026-10-28-site (0 scrolls, 0 steps).

**Attention** (predicted from the render, not measured, using guidelines.md §21; layout unchanged since 2026-10-28-site):
- **`home.es.mobile.light.fold.png`:**
  1. the H1;
  2. the filled «Pruébalo con tu voz»;
  3. the quote card at the bottom edge, competing with the 4-line description.

  Every claim in this viewport is true of the app today.
- **`home.es.desktop.light.fold.png`:**
  1. the H1;
  2. the phone screenshot, which still matches the app's Calendar;
  3. the filled button.

### Findings (most severe first)

**WEB-1701 · Severity 1 · Account answer lags the app's new first screen**
- **Where:** `src/content/site/en.ts:102`, `es.ts:102`, `ca.ts:108`. Home, the FAQ "Do I need an account?", every viewport and theme. It's a closed answer, so no render shows it.
- **The moment:** the Newcomer installs, sees «Entra o crea tu cuenta» with «Continuar con Google» and «Continuar con mi correo», and thinks: "The page said «Inicias sesión». Is this the same thing? Which one is my email?"
- **What happens:**
  - The site says "You sign in once: tap Continue with Google, or use your email and a password…" (ES «Inicias sesión una vez… o usa tu correo y una contraseña…»).
  - Since UX-2606 (2026-11-01), the app's first screen reads "Sign in or sign up" / «Entra o crea tu cuenta» / «Entra o crea el teu compte» (`../TaskFlow/App/lib/l10n/app_en.arb:925`, `app_es.arb:425`, `app_ca.arb:404`). The app changed it because «Inicia sesión» told people without an account that the screen wasn't for them.
  - The email button is "Continue with email" / «Continuar con mi correo» / «Continua amb el correu» (`app_en.arb:2179`, `app_es.arb:1117`, `app_ca.arb:821`), and the site never names it.
  - Every fact is still true: Google or email, a password, a 6-digit code, valid for 30 minutes (`../TaskFlow/Backend/docs/EMAIL_VERIFICATION.md:3`).
- **Why it fails:** FN-2 (the app's names for things; Budiu 2020, Pernice 2014). FN-3 (what the site shows first, the app shows first).
- **Fix:** name both buttons and drop "sign in". Same length as now (41 words in EN). The semicolon keeps the code on the email path only, as WEB-708 requires.
  - EN: "Yes. The first time, tap Continue with Google; or tap Continue with email, choose a password and type the 6-digit code we email you. Your tasks are kept in your account, so you don't lose them if you change phones."
  - ES: «Sí. La primera vez, toca Continuar con Google; o toca Continuar con mi correo, elige una contraseña y escribe el código de 6 cifras que te enviamos. Tus tareas se guardan en tu cuenta, así no las pierdes si cambias de móvil.»
  - CA: «Sí. La primera vegada, toca Continua amb Google; o toca Continua amb el correu, tria una contrasenya i escriu el codi de 6 xifres que t'enviem. Les tasques es desen al teu compte, així no les perds si canvies de mòbil.» (needs a native Catalan read)
- **Verify:** `tests/ux-web-features.spec.ts` (WEB-708's test) asserts both app button names in each language and no "sign in" / «Inicias sesión» / «Inicies la sessió». Check the answer opened at 320 px and at text 200%.
- **Evidence:** verified in code (site content; app ARBs) and seen in the app's current render (`sign-in.sign-in.es.light.1x.png`).

**WEB-1702 · Severity 1 · Voice answer says dictation needs the internet**
- **Where:** the voice FAQ's last sentence, `src/content/site/en.ts:107`, `es.ts:107`, `ca.ts:113`. A closed answer, so no render shows it.
- **The moment:** a Comparer with patchy signal reads "It needs the internet" and thinks: "So voice is useless on the bus."
- **What happens:**
  - Since D1 (2026-10-31, `../TaskFlow/.claude/ux-review/DECISIONS.md:7`), dictation works offline. A dictation made offline shows "No internet. Tap Save as a task, or try again when you're online." (`app_en.arb:1767`; ES «Sin conexión. Toca Guardar como tarea…»).
  - «Guardar como tarea» then shows the task as a normal result card, with the day and time read on the phone, and «Añadir al calendario» saves it (`../TaskFlow/App/lib/screens/voice_task_screen.dart:1706-1709`). The app's own device check is "dictate in airplane mode" (`runs/2026-10-28-app/report-b3.md:33`).
  - Understanding several tasks or a command still needs the connection. A phone that only records (no on-device speech) keeps the recording until it's back online (`app_en.arb:1771`).
  - The site's offline answer already draws that line correctly: "understanding what you say … need[s] a connection" (`en.ts:117`).
- **Why it fails:** FN-1 (every claim true today; UCPD art. 6). Lens G: one concept, one name. The two answers should say it the same way.
- **Fix:** narrow the sentence to the part that needs the internet, in the offline answer's words. Add nothing new.
  - EN: "Understanding what you say needs the internet: your words are sent to Google."
  - ES: «Para entender lo que dices necesita internet: tus palabras se envían a Google.»
  - CA: «Per entendre el que dius necessita internet: les teves paraules s'envien a Google.» (needs a native Catalan read)
- **Verify:**
  - `tests/ux-web-features.spec.ts` (WEB-1001's voice-answer test) asserts the new sentence in all three languages, and no bare "It needs the internet" / «Necesita internet:» / «Necessita internet:» at the start of a sentence.
  - The answer opened at 320 px.
- **Evidence:** verified in code (site content; app ARB, `voice_task_screen.dart` and the D1 record). The app's airplane-mode flow itself is still a device check on the app side (UX-2612).

### Claims checked
ES lines match EN's unless noted. In CA, the features and FAQ lines are EN + 6.

| Claim (page, `path:line`) | Source of truth (`path:line`) | Verdict |
|---|---|---|
| Android only, coming soon to Google Play, can't download yet (hero, FAQ 1, closing, meta; `en.ts:7, 52, 90, 137-138`) | `.claude/ux-web/DECISIONS.md` (Play not published) | true |
| Meta: "Note down what you need to do, and TaskFlow puts it on your calendar" (`en.ts:7`) | `authPitch`, `app_en.arb:929` (ES `:426`, CA `:405`) | true |
| Tap one button and say it, several at once; each on its day; can remind you (hero, `en.ts:49`) | `addTask` `app_en.arb:250`; `captureThingsToAdd` `:1981`; `REMINDER_PLANS.md` | true |
| Hero image and alt: tomorrow's Calendar, two tasks, the Add a task button (`en.ts:55-56`, `public/images/hero-calendar-*.png`) | `calendar/agenda.all-clear.es.light.1x.png`, `agenda.added.*` (same header, rows, button and tabs) | true (see Keep) |
| Free with an account: 10 dictations a month, tasks by hand with no limit (`en.ts:53, 141`) | `Backend/config/settings.py:143`; `freeVoiceNoticeBody` `app_en.arb:2528` | true |
| Day, week or month (`en.ts:62`) | `week`/`month`/`day` `app_en.arb:352-354`; `calendar_screen.dart:877-879` | true |
| Beside your phone calendars' events (`en.ts:62`) | `calendarSeeAllEvents` `app_en.arb:203`; D7 2026-10-20 | true |
| Reminders more and more often as the day nears, for free (`en.ts:62, 95`) | `REMINDER_PLANS.md` (only D9's readers line changed, `:39`); `reminderPlanUntilDay` `app_en.arb:3637` | true |
| One task for each thing, with its day and time; add them all with one tap (`en.ts:72, 107`) | `captureAddTasks` "Add {count} tasks" `app_en.arb:1991`; `voice_task_screen.dart:4676` | true |
| Move all of yesterday's to tomorrow, complete many; ask what you have this week; delete; change shown first; undo (`en.ts:72, 107`) | `VOICE_COMMANDS.md` (only Novedades' `fields` added, `:455`); `commandDeletedTitle`, `commandChangeLine` (new ARB) | true |
| Notes, a checklist or files on any task; files backed up, 6 MB each (`en.ts:77`) | `fileUploadHelp`, `fileLimit` `app_en.arb:1330-1331`; `settings.py:102` | true |
| Tasks on the phone: check, add and complete offline; account, understanding and file uploads need a connection (`en.ts:81, 117`) | UX-2301 (ticks don't wait for the server); `captureOffline` `app_en.arb:1767` | true |
| In Spanish, Catalan and English (`en.ts:90`) | `app_{en,es,ca}.arb` | true |
| Pro: monthly, renews until cancelled in Google Play (`en.ts:96`) | `billingRenewalHelp` `app_en.arb:2132`; `billingManage` `:2136` | true |
| Pro: unlimited dictation and file space (`en.ts:96, 141`) | `proBenefitDictation` `app_en.arb:2112` (ES `:1097`, CA `:801`) | true, now word for word |
| Pro: a safety limit of 50 dictations a day (`en.ts:96`) | `settings.py:140`; WD14 | true |
| Pro: typed sentences become tasks (`en.ts:96`; demo `textPro` `en.ts:184`) | `proBenefitTyping` `app_en.arb:2116` | true |
| Pro: reminders in your own words (`en.ts:96`) | `proBenefitReminders` `app_en.arb:2120`; `reminderPlanYourWay` `:3653`; WD25 | true |
| Pro: price not set (`en.ts:96`) | WD2; the price is the store's (`billingMonthlyPrice`) | true |
| Account: Continue with Google, or email, a password and a 6-digit code (`en.ts:102`) | `signInOrUpHeading` `app_en.arb:925`; `continueWithEmail` `:2179`; `EMAIL_VERIFICATION.md:3` | true, named differently (WEB-1701) |
| Tap Add a task, speak, tap Done (`en.ts:107`; hand-over `en.ts:203`) | `addTask` `:250`, `done` `:1147`, `captureListeningOnline` `:1840`, `captureAddToCalendar` `:1989` | true |
| Voice "needs the internet" (`en.ts:107`) | D1 `DECISIONS.md:7`; `captureOffline` `app_en.arb:1767`; `voice_task_screen.dart:1709` | out of date (WEB-1702) |
| Your words are sent to Google (`en.ts:107`) | `capturePrivacyLine` "Your words go to Google's AI" `app_en.arb:553` | true |
| Repeats: say "every Monday", or More details › Repeat (`en.ts:112`) | `moreDetails` `app_en.arb:286`, `repeat` `:266`; `task_editor.dart:1049, 1441-1446` | true |
| Family: Share, invite by email, accept, everyone sees the tasks, created by, one person's tasks (`en.ts:122`) | `shareProject` `app_en.arb:1149` (`home_screen.dart:689`); `inviteWho` `:1171`; `createdBy` `:2506`; `forMe` `:2209` | true |
| Reminders aren't shared (privacy §5; a family claim) | `sharedDataHelp` `app_en.arb:1226`; D9 makes readers' reminders their own too | true |
| Notes tab, Add a note, write or dictate, links or a checklist (`en.ts:127`) | `notes` `:274`, `addNote` `:97`; `notes_screen.dart:271-293, 319` | true |
| Dictate a task widget or shortcut; share from WhatsApp (`en.ts:132`) | `res/values{,-es,-ca}/strings.xml:3,11` (unchanged); `homeCaptureInstructions` `app_en.arb:411` | true |
| Demo's completion line "All clear. Take a breath." (`en.ts:200`, `es.ts:200`, `ca.ts:207`) | `dayAllClear` `app_en.arb:679`, `app_es.arb:335`, `app_ca.arb:314` (WD34) | true, now the app's own line |
| Demo strings from the app: question, things to add, See what I said, Original text, Complete {title}, Say it again, Type instead, Done, Understanding…, No date (`en.ts:168-208`) | `rememberPrompt` `:395`, `:1981`, `:18`, `:19`, `:2028`, `:1999`, `:1828`, `:1147`, `:1971`, `:241` | true (unchanged) |
| Demo no-task line = the app's own (`en.ts:210`) | `captureNoTasks` `app_en.arb:1763` | true |
| Demo errors keep words, never "save" them (`en.ts:229`, `es.ts:231`, `ca.ts:238`) | UX-2105, the app's "kept, never saved" rule (`app_en.arb:1768-1769`, `:1973` descriptions) | true |
| No "assistant" anywhere on the home (grep of `src/content/site/`) | `captureUnavailable` "names no assistant" (`app_en.arb:1775`) | true |
| Hero's primary button (inside the image) | UX-2108: the app's primary buttons are now 60 dp; the image shows 52 dp | true in substance (see Keep) |

### Missing from the site (app features worth telling)
- None to add. The new app features since 2026-10-29 are D2 (Completadas newest first), D9 (a reader chooses their own reminders), Novedades' «ha movido», reminder-chip states and moving notes into a shared project. None of them helps a visitor decide.
- Offline dictation (D1) is handled by narrowing WEB-1702, not by a new claim.

### Keep
- The FAQ's Pro paragraph and the app's Pro screen now say the same three things, in all three languages (UX-2603 took the site's words).
- The demo's reward line is now what the app says at the day's last tick (WD34). The demo previews a real moment, as WD34 decided ("the demo keeps its line").
- Every demo string copied from the app survived the app run unchanged. The demo errors already follow the app's new "kept, never saved" rule.
- The hero and link-preview screenshot still match the app's Calendar. The only difference is that the primary button grew from 52 to 60 dp (UX-2108), which can't be seen at hero size. WD13's pre-launch re-render (WEB-5's "render again right before publishing") will pick it up. No finding until then.

### Questions for the owner (product decisions only)
- None.

### Cross-slice notes
- **L:** D2 (`Backend/docs/COMPLETION_TIMES.md`) now stores the time of each completion on the server. Privacy §2's "completion history" (`src/content/legal/en.ts:30`) probably covers it; please confirm (the app plan's own note, `runs/2026-10-28-app/plan.md:289`).
- **L:** D9 lets a «lector» set their own reminders. Privacy §5's "Reminders aren't shared: each person has their own" still holds. `ACCOUNT_DELETION.md`'s item 3 (cleaning up completed tasks) is still open.
- **Main session (loop process):** `refs/ux-web/app-last` was saved after the app's merge, so `since --app` can't show the 2026-10-28-app changes. A future changes run should diff from the app commit the last F review read (here 30c8ce0, with the same app-side files as 6281e3d).

### Memory notes
- **claims-map:**
  - The Pro paragraph = `proBenefitDictation/Typing/Reminders` (`app_en.arb:2112-2120`, `app_es.arb:1097-1099`, `app_ca.arb:801-803`).
  - The demo's `completionTitle` = `dayAllClear` (`app_en.arb:679`) since WD34.
  - The account answer ↔ `signInOrUpHeading` (`:925`) and `continueWithEmail` (`:2179`; ES «Continuar con mi correo», CA «Continua amb el correu»).
  - The voice answer's internet sentence ↔ D1, `captureOffline` (`:1767`) and `_saveAsWritten` (`voice_task_screen.dart:1709`).
  - The result's add button is "Add {count} tasks" (`:1991`) for several and "Add to calendar" (`:1989`) for one.
- **recurring-problems:**
  - The app-side snapshot can be saved after the app has already moved, which leaves `since --app` empty for changes the site was never checked against. Find the app commit the last F review read, and diff from it.
  - After any app copy sweep, grep the site for "assistant / asistente / assistent" and for "saved" used of words waiting (the app's "kept" rule, UX-2105).
- **site-patterns:** the app's primary buttons are 60 dp (UX-2108). The hero PNGs show 52 dp; they get re-rendered at WD13, not now.
