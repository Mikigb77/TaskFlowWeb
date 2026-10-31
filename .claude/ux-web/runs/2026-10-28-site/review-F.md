## UX web review — area F (features and faithfulness, the funnel to download and Pro, pricing), whole site — 2026-10-29

**Verdict:** Ship after fixes. Every claim the home makes about the app is true today, in the app's own words, in all three languages. Three small fixes remain: the free-and-Pro answer is one 110-word block; ES and CA promise "very soon"; and the notes example invites people to dictate a password. Five questions go to the owner. The main one is whether to tell repeating tasks, the one app feature a visitor deciding to install needs and the site never mentions.

**Walked** (renders of 2026-10-28 17:57, newer than every source file, latest 2026-10-22 23:23; app renders of 2026-10-28):
- **Newcomer**, ES phone 390 × 664, light (CA and EN checked the same way): WhatsApp preview → `/es/` hero → «Pruébalo con tu voz» → the demo (intro, example, result, tries used) → the hand-over → the free/Pro line → features → FAQ (download, free) → closing card → back to the demo. 8 steps. It ends at «Muy pronto», with nothing to take away.
- **Comparer**, EN and ES desktop 1440, light: header → "What it does" → 4 cards → FAQ "Is TaskFlow free?" (answer read in code; only the first answer is rendered open) → closing. 5 steps. Looked for price, Pro, platforms, repeats and moving from another app.
- **Free → Pro against the app:** the FAQ, the free/Pro line and the demo's typing line, against `App/lib/screens/subscription_screen.dart`, the free-tier strings and `App/build/ux/reminders/` (2026-10-23).
- **Site → first run:** `App/build/ux/auth/sign-in.sign-in.es.light.1x.png` and `App/build/ux/calendar/agenda.first-use*.png`.
- **Leaver:** only the delete page's claims against `Backend/docs/ACCOUNT_DELETION.md`; the page itself is area L's.
- **Not re-checked:** 320 px and 200% text for my copy. No F copy changed since 2026-10-22, when they were verified (WEB-1103 to WEB-1105). Dark only through `AUDIT.md` §7.

**Numbers:**
- **Claims checked:** 65 (table below). False 0; overstated 1 (ES/CA "very soon", WEB-1402); at odds with the site's own privacy advice 1 (WEB-1403); imprecise 1 (Pro's "reminders in your own words", WD25); incomplete or jargon 5, all in the legal texts (area L); unverifiable 1 (demo against app speed and accuracy, an owner check).
- **The free/Pro facts on a phone** first appear at y ≈ 2092 (ES), 2137 (EN) and 2157 (CA) CSS px, about 3.2 screens down. AT-6 asks for them within 1328 px.
- **"Is TaskFlow free?"** is about 6.4 screens down on ES phones (y ≈ 4234).
- **The free/Pro answer** is 108 / 107 / 112 words (EN/ES/CA) in one `<p>`. Its longest sentence is 30 / 33 / 34 words. At the measured ≈ 46 characters a line and 30 px line height, that's ≈ 13–15 lines, ≈ 400–450 px (`home-faq.en.mobile.light.view.png`). The next longest answer is voice, at 80–85 words.
- **First viewport (ES phone):** ≈ 65 words, 1 primary call to action, 0 words about cost; "not yet" at y ≈ 433–473 of 664.
- **Scrolls to the first call to action on a phone:** 0. **Steps to the honest "not yet":** 0, in every language. **Steps to a download:** none possible. Every "get it" path loops back to the demo: closing button → `#voice`; menu row → `#get-taskflow` → `#voice`; hand-over → nothing.
- **App features the site doesn't tell:** 13. One of them is recommended for telling (repeats).

**Attention** (predicted from the render with GUIDELINES §21's heuristic, not measured; H1 owns the pitch):
- **`home.es.mobile.light.fold.png`** (EN and CA have the same layout, checked):
  1. the H1 «Dilo y ya está en tu calendario.», top half;
  2. the filled «Pruébalo con tu voz», middle band;
  3. the bold quote card at the bottom, competing with the 5-line grey description.
  - «Muy pronto en Google Play. Todavía no se puede descargar.» is grey, at y ≈ 433–473, on the edge of the bottom third (AT-2: ≈ 14% of gaze). It's probably not in the first three.
  - Nothing about cost is in the viewport.
- **`home.es.desktop.light.fold.png`:**
  1. the H1, left;
  2. the phone screenshot, the largest image, right;
  3. the filled button, left, y ≈ 615–672.
  - The availability line, small and grey at y ≈ 705, competes with the description and the floating quote. It's probably not in the first three.
  - Nothing about cost.

### Findings (most severe first)

**WEB-1401 · Severity 2 · Free and Pro answer is one 110-word block**
- **Where:** `src/content/site/en.ts:94`, `es.ts:94`, `ca.ts:100`, drawn as one `<p>` at `src/components/HomePage.tsx:150`. Home, FAQ item 2, every language, viewport and theme. Not rendered open: `home-faq.*` opens only item 1.
- **The moment:** the Comparer asks "So what does Pro add, and what does it cost?" and gets 14 lines with no break. "Its price isn't set yet" is the last of seven sentences.
- **What happens:**
  - Free (3 sentences) and Pro (4 sentences) run together.
  - The Pro sentence is 30 / 33 / 34 words: "TaskFlow Pro, a monthly subscription that renews until you cancel it in Google Play, gives you unlimited dictation and file space (with a safety limit of 50 dictations a day)."
  - The Newcomer gets "Yes. You get 10 free dictations a month" first, which is right. The Comparer has to dig.
- **Why it fails:**
  - SC-3: no unformatted block (Pernice 2017).
  - RD-3: sentences of about 15–20 words (Loranger 2017p).
  - PR-2 and PR-5: the difference between Free and Pro readable at a glance (Moran 2024c).
  - RD-1: one idea per paragraph (Morkes 1997).
- **Fix:** the same claims, word for word except one split sentence, as two paragraphs, each its own `<p>`. For example, `answer` becomes a list of paragraphs, or is split on a blank line in `HomePage.tsx:150`. No other answer changes.
  - EN, paragraph 1: "Yes. You get 10 free dictations a month, and one dictation can hold several tasks. When they’re used up, you keep adding tasks with a short form, with no limit, until they come back the next month. Reminders are free too, even the ones that come more and more often as the day gets closer."
  - EN, paragraph 2: "TaskFlow Pro is a monthly subscription that renews until you cancel it in Google Play. It gives you unlimited dictation and file space (with a safety limit of 50 dictations a day). It also turns sentences you type into tasks, and lets you ask for reminders in your own words. Its price isn’t set yet."
  - ES, paragraph 1: unchanged.
  - ES, paragraph 2: «TaskFlow Pro es una suscripción mensual que se renueva hasta que la cancelas en Google Play. Te da dictado y espacio para archivos ilimitados (con un límite de seguridad de 50 dictados al día). Además, convierte en tareas las frases que escribes y te deja pedir los recordatorios con tus palabras. Su precio aún no está decidido.»
  - CA, paragraph 1: unchanged.
  - CA, paragraph 2: «TaskFlow Pro és una subscripció mensual que es renova fins que la cancel·les a Google Play. Et dona dictat i espai per a fitxers il·limitats (amb un límit de seguretat de 50 dictats al dia). A més, converteix en tasques les frases que escrius i et deixa demanar els recordatoris amb les teves paraules. El preu encara no està decidit.» Needs a native Catalan read of the split.
- **Verify:**
  - Playwright: `details:nth-of-type(2)` has two `<p>`. The first starts "Yes." / «Sí.»; the second starts "TaskFlow Pro is" / «TaskFlow Pro es» / «TaskFlow Pro és». No sentence is over 20 words.
  - The joined text equals today's claims: 10 free dictations, the form, free reminders, monthly, Google Play, 50 a day, typed sentences, own words, price not set.
  - Update `FREE_ANSWER` (`tests/ux-web-features.spec.ts:1024`) and `tests/support/ux-web-copy.ts:135`.
  - Add a render with item 2 open on a 390 px phone in ES.
- **Evidence:** verified in code; line length and height measured on `home-faq.en.mobile.light.view.png`; line counts inferred.

**WEB-1402 · Severity 1 · ES and CA promise "very soon"; English says "coming soon"**
- **Where:**
  - ES «muy pronto» / «Muy pronto»: `es.ts:7` (meta, og and twitter description, so the WhatsApp preview), `:23` (phone menu), `:52` (hero status, first viewport), `:129` (closing title), `:190` (demo hand-over).
  - CA «molt aviat» / «Molt aviat»: `ca.ts:7`, `:23`, `:52`, `:135`, `:198`.
  - The FAQs already say «llegará pronto» (`es.ts:89`) and «arribarà aviat» (`ca.ts:95`).
  - Seen in `home.es.mobile.light.fold.png` and `home.ca.mobile.light.fold.png`.
- **The moment:** "«Muy pronto», so in a few days." Two weeks later it's still «Muy pronto», and the wary Newcomer stops believing the page.
- **What happens:**
  - English says "Coming soon", which is neutral. Spanish and Catalan say "very soon", in the preview and the first viewport.
  - Nobody has set a date. The package is still `com.example.agenda` (`App/android/app/build.gradle:52`; `App/docs/PACKAGE_ID.md:3`).
  - Play's own gates take weeks once started: a 14-day closed test with 12 testers for new personal accounts, then the production review (GUIDELINES §0, "Play launch gates").
- **Why it fails:**
  - FN-1: every claim true today.
  - TR-3: errors are trust bugs (Fogg 2002).
  - Lens C: calls to action honest about what happens next.
  - ML-6: each language says what the others say.
- **Fix:** the neutral standard phrase. The FAQ lines stay as they are.
  - ES «Próximamente»: `:7` «…Para móviles Android, próximamente en Google Play.»; `:23` «Próximamente en Android»; `:52` «Próximamente en Google Play. Todavía no se puede descargar.»; `:129` «Próximamente en Android.»; `:190` «…añádelo al calendario. Próximamente en Google Play.»
  - CA «Properament»: `:7` «…Per a mòbils Android, properament a Google Play.»; `:23` «Properament a Android»; `:52` «Properament a Google Play. Encara no es pot descarregar.»; `:135` «Properament a Android.»; `:198` «…afegeix-ho al calendari. Properament a Google Play.» Needs a native Catalan read; «Aviat» is the shorter alternative.
- **Verify:**
  - Grep `src/` for «muy pronto» and «molt aviat»: none.
  - Update `tests/support/ux-web-copy.ts:31-32, 96-97, 226-227, 263-264` and `tests/ux-web-voice.spec.ts:155-156`.
  - Render `home.{es,ca}.mobile-w320.light.full.png`. At 32 px (`global.css:1378`) «Próximamente» is ≈ 205 px in a ≈ 244 px card, so it should fit; confirm, and that «Properament a Android.» wraps cleanly.
- **Evidence:** verified in code; seen in the current renders; the width is inferred from the CSS.

**WEB-1403 · Severity 1 · The notes answer suggests dictating a password**
- **Where:** `en.ts:119` "like a Wi-Fi password. Tap Add a note, then write or dictate it"; `es.ts:119` «como la clave del wifi… escríbela o díctala»; `ca.ts:125` «com la contrasenya del wifi… escriu-la o dicta-la». Home FAQ item 7, every language.
- **The moment:** "I'll say my Wi-Fi password into a note." On a phone that can't recognise the language by itself, Catalan often among them, that recording goes to Google's AI to be written down.
- **What happens:**
  - Privacy §4 (`src/content/legal/en.ts:58`) asks people to "avoid including … passwords … in AI input".
  - A dictated note is sent as audio when the phone can't recognise the speech itself. The server then has Google's model transcribe it (`Backend/core/ai.py:614-622`).
  - Typed notes never reach the AI. The app's own placeholder, "e.g. Wi-Fi password" (`App/lib/l10n/app_en.arb:95`), sits on a typed field, so the conflict exists only on the site, where the example sits beside "dictate".
- **Why it fails:**
  - Lens I: what the site says about data matches the privacy policy.
  - TR-3: one page contradicting another is a trust bug.
  - FN-1.
- **Fix:** swap the example for one that isn't a secret, as `notesEmptyHelp` puts it, "ideas and things to remember" (`app_en.arb:83`). Everything else in the answer stays.
  - EN: "…that isn’t a task, like a gift idea. Tap Add a note, then write or dictate it; add links or a checklist if you like."
  - ES: «…y no es una tarea, como una idea para un regalo. Toca Añadir nota y escríbela o díctala; si quieres, añade enlaces o una lista de pasos.»
  - CA: «…i no és una tasca, com una idea per a un regal. Toca Afegeix una nota i escriu-la o dicta-la; si vols, afegeix-hi enllaços o una llista de passos.» Needs a native Catalan read.
- **Verify:**
  - No "Wi-Fi", «wifi» or «contrasenya» left in `faq.items` in any language.
  - Update `tests/support/ux-web-copy.ts:200-202` and WEB-110's test in `tests/ux-web-features.spec.ts`.
  - The answer still names the Notes tab, Add a note, writing or dictating, links and a checklist.
- **Evidence:** verified in code (site, server, app).

### Claims checked
Site paths are `src/content/site/en.ts` unless noted; `es.ts`/`ca.ts` mirror them, and their line numbers are given where they differ. App paths are in the app repo.

| # | Claim (page, `path:line`) | Source of truth (`path:line`) | Status |
|---|---|---|---|
| 1 | Meta title "Say it, and it's on your calendar" `:5` | speed bar `.claude/ux-review/DECISIONS.md:216-221`; listening starts on open `App/lib/screens/voice_task_screen.dart:628-633, 747-763` | true |
| 2 | Meta and og description: note it down and TaskFlow puts it on your calendar; several things; Android; coming soon `:7` | sign-in line «Apunta lo que tienes que hacer y TaskFlow lo pone en tu calendario.» (`App/build/ux/auth/sign-in.sign-in.es.light.1x.png`); `.claude/ux-web/DECISIONS.md:100` | true; ES/CA overstated (WEB-1402) |
| 3 | Hero: "Tap one button and say what you need to do" `:49` | `voice_task_screen.dart:628-633, 747-763` (listening starts when the sheet opens; with TalkBack it waits for a tap) | true |
| 4 | Hero: "even several things at once" `:49` | `.claude/ux-review/DECISIONS.md:195-199` | true |
| 5 | Hero: "puts each one on its day and can remind you before it" `:49` | `App/lib/l10n/app_en.arb:1253` "Want a reminder before it?" | true |
| 6 | Hero: "An app for Android™ phones" `:49` | WD7 `.claude/ux-web/DECISIONS.md:65`; `App/android/app/build.gradle:52` | true |
| 7 | Not on Google Play; can't download: hero `:52`, menu `:23`, FAQ 1 `:89`, closing `:129-130`, hand-over `:191` | `.claude/ux-web/DECISIONS.md:100`; `App/docs/PACKAGE_ID.md:3` | true; ES/CA "very soon" (WEB-1402) |
| 8 | Hero and preview phone: `public/images/hero-calendar-*.png`, alt `:9, :55` | byte-identical to `App/build/web-assets/calendar-hero.done.*.1x-390.png` (cmp, 6 of 6); later app changes touch only undated rows with a deadline (`App/lib/widgets/task_tile.dart:45-50`); the same design in `App/build/ux/calendar/agenda.added.es.light.1x.png` (2026-10-28) | true; re-render before publishing (WEB-114, WD13) |
| 9 | Calendar card: by day, week or month `:61` | `app_en.arb:345-347` | true |
| 10 | Calendar card: phone calendars beside tasks, "if you like" `:61` | `app_en.arb:163-164`; D7 `.claude/ux-review/DECISIONS.md:92` | true |
| 11 | Calendar card: reminders "more and more often as the day gets closer" `:61` | `Backend/docs/REMINDER_PLANS.md:9-11, 59-65`; `app_en.arb:3491` | true ("can" covers repeating tasks, which get no plan, `REMINDER_PLANS.md:23`) |
| 12 | Calendar drawing: "This week", two timed "events" `:62-67`; `src/components/HomePage.tsx:69-102` | not an app screen: the app shows dated week cells and task cards (`hero-calendar-*.png`) | illustration, not a claim (WD26) |
| 13 | Voice card: one task for each thing, with its day and time `:71` | `app_en.arb:1857` | true |
| 14 | Voice card: check them, then add them all with one tap `:71` | `app_en.arb:1867` "Add {count} tasks" | true |
| 15 | Voice card: move yesterday's to tomorrow, complete many `:71` | `Backend/docs/VOICE_COMMANDS.md:172-222` | true |
| 16 | Details card: notes, a checklist or files on any task `:76` | `app_en.arb:268, 729` | true |
| 17 | Details card: files backed up, up to 6 MB each `:76` | `Backend/config/settings.py:103`; 100 MB free total untold by WD2 (`settings.py:106`) | true |
| 18 | Offline card `:80` | `App/docs/IMPLEMENTATION_STATUS.md:9, 47` | true |
| 19 | FAQ 1: an app for Android, in Spanish, Catalan and English `:89` | `App/lib/l10n/app_{en,es,ca}.arb` | true |
| 20 | FAQ 2: 10 free dictations a month `:94` | `settings.py:144`; `app_en.arb:2325` | true |
| 21 | FAQ 2: one dictation can hold several tasks `:94` | `VOICE_COMMANDS.md:393`; `.claude/ux-review/DECISIONS.md:228` | true |
| 22 | FAQ 2: a short form with no limit, until they come back next month `:94` | `app_en.arb:2332`; UTC month `.claude/ux-review/DECISIONS.md:241` | true |
| 23 | FAQ 2: reminders free, including the growing ones `:94` | `REMINDER_PLANS.md:11` | true |
| 24 | FAQ 2: Pro monthly, renews until cancelled in Google Play `:94` | `App/docs/REVENUECAT_SETUP.md:31, 40`; `app_en.arb:1993` | true |
| 25 | FAQ 2 and free/Pro line: Pro gives unlimited dictation and file space `:94, :133` | `app_en.arb:1981`; `REVENUECAT_SETUP.md:3` | true |
| 26 | FAQ 2: safety limit of 50 dictations a day `:94` | `settings.py:141`; `VOICE_COMMANDS.md:422` | true; the shared 200 a day (`settings.py:142`) can stop Pro sooner (WD14, the owner's) |
| 27 | FAQ 2 and demo `:176`: Pro turns typed sentences into tasks | `.claude/ux-review/DECISIONS.md:164-174`; `VOICE_COMMANDS.md:403` | true; the app's Pro screen doesn't list it (`billingIntro`, `app_en.arb:1981`) |
| 28 | FAQ 2: Pro "lets you ask for reminders in your own words" `:94` | `REMINDER_PLANS.md:13, 100-115`; `app_en.arb:3776` | true for Pro; free accounts also get a rhythm said in a dictation (`REMINDER_PLANS.md:12`; `App/build/ux/reminders/sheet.your-way-free-dictated.es.light.1x.png`) (WD25) |
| 29 | FAQ 2: Pro's price isn't set `:94` | `REVENUECAT_SETUP.md:24` (test price only) | true |
| 30 | FAQ 3: Continue with Google, or email, password and a 6-digit code `:99` | `app_en.arb:2039-2040, 895`; `Backend/docs/EMAIL_VERIFICATION.md:3` | true |
| 31 | FAQ 3: tasks kept if you change phones `:99` | `IMPLEMENTATION_STATUS.md:47` | true |
| 32 | FAQ 4: Add a task, say it, Done, one task each, add all `:104` | `app_en.arb:242, 1059, 1867` | true |
| 33 | FAQ 4: ask what you have this week `:104` | D4 `.claude/ux-review/DECISIONS.md:110`; `VOICE_COMMANDS.md:78-104` | true |
| 34 | FAQ 4: move, change, complete or delete, even all of yesterday's `:104` | `VOICE_COMMANDS.md:57-222` | true |
| 35 | FAQ 4: the change is shown first, and you can undo it `:104` | `VOICE_COMMANDS.md:8, 147, 160, 218-219` | true |
| 36 | FAQ 4: needs the internet; words sent to Google `:104` | `app_en.arb:527` | true |
| 37 | FAQ 5: check, add, complete offline; saving, understanding and uploading need a connection `:109` | as row 18 | true |
| 38 | FAQ 6: share a project (Home, Shopping), tap Share, invite by email `:114` | `app_en.arb:1061, 1083, 1105-1106` (the code is only a fallback); D6b `.claude/ux-review/DECISIONS.md:286-287` | true |
| 39 | FAQ 6: everyone sees its tasks; who created it; one person's tasks `:114` | `.claude/ux-review/DECISIONS.md:159, 161`; `app_en.arb:2310` | true |
| 40 | FAQ 7: Notes tab, Add a note, write or dictate, links and a checklist `:119` | `app_en.arb:83, 90, 266`; note dictation `Backend/core/ai.py:614-622` | true; the example conflicts with privacy §4 (WEB-1403) |
| 41 | FAQ 8: Dictate a task widget or shortcut; share from WhatsApp `:124` | `App/android/app/src/main/res/values*/strings.xml` (`capture_voice`, `capture_widget_label`); `AndroidManifest.xml:46-48` | true, in all three languages |
| 42 | Closing card and under the demo: free with an account, 10 dictations, tasks by hand with no limit; Pro monthly `:133`; `VoiceDemo.tsx:1154` | `app_en.arb:2332, 1981` | true |
| 43 | Demo: without Pro you say them, or use a short form `:176` | as rows 20, 22 | true |
| 44 | Hand-over: Add a task, say it, Done, add it to your calendar `:191` | `app_en.arb:242, 1059, 1865` | true; ES/CA "very soon" (WEB-1402) |
| 45 | Demo heading and example = the app's first run `:145, :160` | `app_en.arb:390`; `App/build/ux/calendar/agenda.first-use.es.light.1x.png` | true |
| 46 | Demo result: "N things to add", "No date" `:185-186` | `app_en.arb:1857, 233` | true |
| 47 | Footer: a product by GARBAR, IN-TEC, S.L.; the Android trademark line `:40-41` | `src/content/legal/company.json` | true |
| 48 | Privacy summary 02: your words go to Google's AI only to add, find or change tasks; `legal/en.ts:10` | `app_en.arb:527` | true |
| 49 | Privacy §2 "Organisation" list; `legal/en.ts:30` | each person's reminders and plans, including the words said for them, kept on the server (`REMINDER_PLANS.md:27-34, 57`; `Backend/core/models.py:242-256`) | incomplete (area L) |
| 50 | Privacy §3: "The AI suggests titles, dates and priorities"; `legal/en.ts:48` | the AI also suggests changes and reminder rhythms (`VOICE_COMMANDS.md:57`; `REMINDER_PLANS.md:91-99`) | incomplete (area L) |
| 51 | Privacy §4: speech on the phone; Pro's typed words; without Pro the form never reaches the AI; `legal/en.ts:55` | `REMINDER_PLANS.md:13`; WEB-1101 | true |
| 52 | Privacy §4: Gemini API with a Vertex AI fallback; the demo uses Vertex AI; `legal/en.ts:56` | `Backend/core/ai_routing.py:59-89`; `Backend/config/settings.py:126-135`; `src/lib/voice/model.ts:45-51` | true |
| 53 | Privacy §5: what members of a shared project see; `legal/en.ts:75` | `app_en.arb:1132` "Reminders aren't shared"; the check the app's plan asked for (`.claude/ux-review/runs/2026-10-22-changes/plan.md:68`) | true; it says nothing about reminders being shared |
| 54 | Privacy §7: we never delete your tasks on our own; RevenueCat's record deleted; `legal/en.ts:122, 128` | `.claude/ux-review/DECISIONS.md:134`; `ACCOUNT_DELETION.md:32` | true |
| 55 | Privacy §9: microphone, notifications for reminders, files, camera, calendar; `legal/en.ts:155` | `App/android/app/src/main/AndroidManifest.xml:5-10` also asks for exact alarms ("Alarms & reminders") | incomplete (area L) |
| 56 | Privacy §9: phone events read only, never uploaded or sent to the AI; `legal/en.ts:155` | `app_en.arb:164` | true |
| 57 | Terms §1: a private test version; no public download or paid checkout; `legal/en.ts:205` | `REVENUECAT_SETUP.md:24`; WD9 | true |
| 58 | Terms §3: "optional dictation that turns what you say into tasks"; `legal/en.ts:221` (ES/CA «IA opcional», `legal/es.ts:215`, `legal/ca.ts:215`) | dictation also finds, changes and deletes tasks and sets reminders (`VOICE_COMMANDS.md:3`; `REMINDER_PLANS.md:91-99`) | incomplete; EN ≠ ES/CA (area L) |
| 59 | Terms §5: "AI capture is optional"; `legal/en.ts:239` | — | jargon (area L, HE-10) |
| 60 | Terms §6 and delete §5: cancel Pro in Google Play; deleting doesn't cancel it; `legal/en.ts:248, 397` | `app_en.arb:2521` | true |
| 61 | Terms §8 and delete §1: Settings → Account → Delete account; the export has no files; `legal/en.ts:269, 355` | `App/lib/screens/settings_screen.dart:125`; `account_screen.dart:337`; `IMPLEMENTATION_STATUS.md:25`; CA «Configuració → Compte → Suprimeix el compte» = `app_ca.arb` | true |
| 62 | Delete §1: confirm with your password or Google; needs a connection; `legal/en.ts:356` | `ACCOUNT_DELETION.md:44-51, 63` | true |
| 63 | Delete §3: what's deleted and what stays; `legal/en.ts:373-375` | `ACCOUNT_DELETION.md:16-33`; each person's reminders go with the account (`Backend/core/models.py:249`, CASCADE) | true |
| 64 | Delete §4: no confirmation email; `legal/en.ts:382` | `ACCOUNT_DELETION.md:12`; the uncommitted backend work only adds a footer and Reply-To (`Backend/core/email_delivery.py`, working tree) | true |
| 65 | The demo reflects the app's speed and accuracy (FN-4) | demo `gemini-3.5-flash-lite` on Vertex AI (`src/lib/voice/model.ts:51`); app `gemma-4-26b-a4b-it` on AI Studio, then `gemini-3.1-flash-lite` on Vertex AI (`Backend/config/settings.py:126-135`; `ai_routing.py:59-89`) | unverifiable without the real AI (owner check) |

### Missing from the site (app features worth telling)
The bar: what a visitor deciding to install needs. Everything else stays untold.

1. **Repeating tasks.** Say "every Monday" or «cada día a las 9», or use More details › Repeat. Each time shows on the calendar, with its own reminder.
   - Sources: `Backend/core/ai.py:82-85, 353-357`; `app_en.arb:258, 604`; `.claude/ux-review/DECISIONS.md:170-173`; `IMPLEMENTATION_STATUS.md:24`.
   - The site has no repeat at all (0 hits for repeat, «repet» or «repeteix» in `src/content/site/`).
   - **Needed:** yes. For the Comparer it's table stakes; for the Newcomer it covers weekly routines. → WD22.
2. **Tasks you didn't finish move into Today** («Atrasadas · N»). Sources: D1, `.claude/ux-review/DECISIONS.md:256-258`; `app_en.arb:579`. Reassuring, not needed to decide. Untold.
3. **Complete, or Snooze 10 min, from the reminder itself.** Sources: `app_en.arb:1582-1583`; `App/lib/services/notification_service.dart:70`. Untold.
4. **Giving a task to someone in a shared project,** whose phone then rings for it. Sources: `.claude/ux-review/DECISIONS.md:113`; `REMINDER_PLANS.md:88`. FAQ 6's "see just one person's tasks" already hints at it, and D9 (readers' reminders) is open. Untold for now.
5. **Each person's reminders stay their own on shared tasks.** Sources: `app_en.arb:1132`; `REMINDER_PLANS.md:5`. Untold: D9 is open, and WD20/WD21 say "no more than the site needs".
6. **Notes, a list and a deadline taken from the dictation** (the owner's 2026-10-15 example). Sources: `.claude/ux-review/DECISIONS.md:195-199`; `Backend/core/ai.py:86, 349-351`. The demo already shows notes, and can't show lists or deadlines (`src/lib/voice/model.ts:20-27`). Untold.
7. **A reminder rhythm said while dictating,** free. Sources: `REMINDER_PLANS.md:12, 91-99`. The demo can't show reminders. Untold (see WD25).
8. **Bringing tasks over from Todoist, and exporting a copy.** Sources: `app_en.arb:1336, 1347`; `App/lib/screens/other_settings_screen.dart:89`. Few switchers. Leave it to the Play listing.
9. **Creating a project, or assigning a task, by voice.** Source: `VOICE_COMMANDS.md:61-75, 140-142`. Untold (HE-11).
10. **Deadlines, durations, the hourly day view, priority, labels.** Source: `app_en.arb:114-135, 250-252`. Untold: HE-11, and most people never set a deadline (`.claude/ux-review/DECISIONS.md:14`).
11. **A dictation that finds nothing doesn't count.** Source: `VOICE_COMMANDS.md:395`. Untold.
12. **Light and dark themes.** Untold (WEB-17 removed the section).
13. **Android 7.0 or later.** Source: `App/android/app/build.gradle:59`, `minSdk` 24. Leave it to the Play listing.

### Keep (5 bullets at most)
- **The app's first run speaks the site's words.**
  - «¿Qué quieres recordar? Prueba: toca Añadir tarea y di «Mañana, llamar al dentista y comprar pan».» (`App/build/ux/calendar/agenda.first-use.es.light.1x.png`; `app_en.arb:390`) matches the demo's heading and example.
  - The sign-in line matches the site's meta description (FN-3).
- **Honest availability everywhere.** No badge, no download, "You can't download it yet" in the first viewport, and every route to "get it" says "not yet" (AP-5).
- **Free and Pro in the app's words:** "tasks by hand with no limit" (`app_en.arb:2332`), "unlimited dictation and file space" (`:1981`). The 50-a-day clause appears once (WD14), and so does "its price isn't set yet" (PR-1).
- **The hero images are still the app's current calendar** (byte-identical, rows unchanged since). WEB-5's remaining checks stand.
- **The site is silent on readers' reminders (D9 open) and on reminders being shared.** Keep it that way until D9 is decided.

### Questions for the owner (product decisions only)
WD numbers are suggestions; the organizer's plan numbers them.

**WD22 — Tell repeating tasks?** (a new claim)
- **The app:** "every Monday", «cada día a las 9», or More details › Repeat, in all three languages. The live demo writes a repeat into the task's notes and never pretends it's scheduled (`src/lib/voice/model.ts:53`), so it can't contradict the claim. It can't show it either, so keep the claim away from the "Try it" links.
- **The copy:** a new FAQ item after "How do I add tasks by voice?".
  - EN Q: "Can I add something that repeats?" A: "Yes. Say “every Monday” or “every day at 9” when you add it, or tap More details and choose Repeat. Each time shows on your calendar, and TaskFlow can remind you."
  - ES Q: «¿Puedo añadir algo que se repite?» A: «Sí. Di «todos los lunes» o «cada día a las 9» al añadirlo, o toca Más detalles y elige Repetir. Cada vez aparece en tu calendario, y TaskFlow puede recordártelo.»
  - CA Q: «Puc afegir una cosa que es repeteix?» A: «Sí. Digues «cada dilluns» o «cada dia a les 9» quan l’afegeixis, o toca Més detalls i tria Repetició. Cada vegada surt al calendari, i TaskFlow t’ho pot recordar.» Needs a native Catalan read.
  - Avoid medical examples ("my pills"): privacy §4 asks people to keep health information out of AI input.
- **Against:** a 9th FAQ item. Repeating tasks get no "more and more often" plan (`REMINDER_PLANS.md:23`), so never pair the two sentences.
- **Recommendation:** yes, as this FAQ item only.

**WD23 — Say what's free in the first screen?** (WD2 placed the free/Pro line after the demo and in the closing card)
- **Today:**
  - nothing about cost in the first viewport;
  - the free/Pro line at ≈ 3.2 phone screens;
  - "Is TaskFlow free?" at ≈ 6.4.
  - The Newcomer is wary of paying (CT-10, AT-6, PR-2, FQ-2).
- **The copy:** the hero's status line gains the free/Pro line's first words; the rest follows WEB-1402.
  - EN: "Free with an account. Coming soon to Google Play. You can’t download it yet."
  - ES: «Gratis con una cuenta. Próximamente en Google Play. Todavía no se puede descargar.»
  - CA: «Gratuït amb un compte. Properament a Google Play. Encara no es pot descarregar.»
  - The limits (10 dictations, the form) stay one tap away, under the demo.
- **Against:** one more phrase in the hero (AT-5). The hero's button leads to the demo, which is already free ("3 tries a day, no sign-up").
- **Recommendation:** yes. H1 owns the hero's layout.

**WD24 — A way to hear about the launch (WD9, revisited with evidence)**
- **Today:** every "get it" route ends at "Coming soon" and loops back to the demo (closing button → `#voice`; menu row → `#get-taskflow`; hand-over → nothing), so a visitor who wants TaskFlow leaves with nothing.
- **What's blocking:** WD9 waits for Play pre-registration, which waits for the package ID. It's still `com.example.agenda`, and the steps are his (`App/docs/PACKAGE_ID.md`).
- **Options:**
  - (a) wait, as decided;
  - (b) do the package-ID console steps now, so pre-registration can open;
  - (c) an email list: new personal data, a privacy change, and a legal check.
- **Recommendation:** (a) on the site, and (b) moved up his launch list. Nothing to build now.

**WD25 — Pro's "reminders in your own words"** (WEB-1104's wording, from WD21)
- **The tension:**
  - Free accounts already get a rhythm said in a dictation (`REMINDER_PLANS.md:12`). Their sheet even shows it under «A tu manera» (`App/build/ux/reminders/sheet.your-way-free-dictated.es.light.1x.png`).
  - The FAQ lists "reminders in your own words" as Pro only, as the app's Pro screen does ("With Pro, ask for reminders in your own words:", `app_en.arb:3776`).
- **Options:**
  - (a) keep it: site and app agree (FN-6), and the free route is inside the 10 dictations;
  - (b) add to the free sentence: EN "…as the day gets closer, and the ones you ask for while dictating." / ES «…según se acerca el día y los que pides al dictar.» / CA «…a mesura que s’acosta el dia i els que demanes en dictar.»
- **Recommendation:** (a), unless the app's Pro screen changes too.

**WD26 — Show reminders with the app, not a drawing?** (lower priority)
- **Today:** the calendar card's drawing, with "A fresh start" and "Some time outside" (`HomePage.tsx:69-102`), is no app screen (EY-3, HE-5, AP-12). The card's newest claim, "more and more often", is only described.
- **The proposal:** replace the drawing (no new section) with the app's own Normal preview: the dots to the day, and «13 avisos · próximo: mañana, 09:00» (`App/build/ux/reminders/sheet.strength.*`). Render it per language and theme, as WD4's hero is.
- **Recommendation:** yes, at the pre-launch re-render (WD13, WEB-114).

**Owner checks** (not decisions):
- **FN-4, the demo against the app.**
  - The demo runs `gemini-3.5-flash-lite` on Vertex AI (`src/lib/voice/model.ts:51`).
  - The app's dictations run `gemma-4-26b-a4b-it` on AI Studio first, then `gemini-3.1-flash-lite` on Vertex AI (`Backend/config/settings.py:126-135`).
  - Say the same 3 sentences in each, timing them and checking the dates: «Mañana a las 5 llamar al dentista y el viernes comprar pan», «Recoger a los niños el jueves a las 17 y pagar la luz antes del día 5», «Demà a les 9 trucar a la mare i dissabte comprar pa».
  - If the app is slower or less accurate, the demo oversells. The cause is likely server-side.
- **D7, his RevenueCat paywall.**
  - When he adds «A tu manera», list the site's three Pro benefits there: unlimited dictation and file space, typed sentences into tasks, and reminders in your own words. Then paywall and site tell one story (FN-6).
  - The app's Pro screen line, `billingIntro`, names only the first. That one is for /ux.
- **WD14, still open:** the shared budget of 200 AI requests a day (`settings.py:142`) stops everyone, Pro included, once used up. Raise it before launch, or "unlimited … 50 a day" won't hold.

### Cross-slice notes
- **H1:** WD23 adds to the hero's status line, and WEB-1402 edits it and the closing title. The status line sits at y ≈ 433–473 of 664, on the edge of the bottom third (AT-2).
- **H2:** FN-4 (owner check above). The demo writes repeats into notes (`model.ts:53`), which is fine as a taste; keep repeat and reminder claims away from "Try it" links.
- **L:** legal leftovers for the next legal edit, which moves the version (WD3):
  - privacy §2 doesn't list reminders, now each person's own and kept per person;
  - privacy §3's list of what the AI suggests is short;
  - privacy §9 doesn't name exact alarms;
  - terms §3 is narrower than the app, and EN differs from ES/CA;
  - terms §5 says "AI capture".
  - Privacy §5 checked against "every reminder is personal": nothing reads wrong (the app's plan asked for this).
- **G:** WEB-1402 changes the ES/CA meta, og and twitter descriptions (`es.ts:7`, `ca.ts:7`) and the menu's `comingSoon` (`:23`).
- **App (/ux, main session):**
  - The Pro screen's first line (`app_en.arb:1981`) lists less than the site's FAQ (FN-6), and the Pro reason line frames own-words reminders as Pro-only (WD25).
  - The invitation email links the bare root (`Backend/core/invitation_email.py:18`), so a Catalan email opened in a Spanish browser lands on `/es/`.

### Memory notes
- **Claims map (2026-10-29):**
  - The home has no false claim.
  - The hero images are still current: since the 2026-10-22 render, the app's only tile change is to undated rows with a deadline (`task_tile.dart:45-50`).
  - Demo model: `src/lib/voice/model.ts:51` `gemini-3.5-flash-lite` (Vertex AI). App: `Backend/config/settings.py:126-135`, routed by `Backend/core/ai_routing.py:59-89`.
  - The memory's old pointer to `Backend/core/ai.py:118-133` for the provider is stale. The note path is `ai.py:614-622`, transcription only, no inference.
- **Copy pinned in tests:**
  - free answer: `tests/ux-web-features.spec.ts:1024` and `tests/support/ux-web-copy.ts:135`;
  - availability strings: `ux-web-copy.ts:31-32, 96-97, 226-227, 263-264` and `tests/ux-web-voice.spec.ts:155-156`;
  - notes answer: `ux-web-copy.ts:200-202`.
- **Site map:**
  - ES phone home: 9 screens. Demo on screens 2–4; the free/Pro line at y ≈ 2090–2160 (EN 2137, CA 2157); features 4–6; FAQ from ≈ 4079, "free" at ≈ 4234; closing ≈ 4813.
  - EN desktop home: 5 screens; the free/Pro line ≈ 1890.
  - Only FAQ item 1 is rendered open (`home-faq.*`).
- **Untold app features, with this run's judgements:** the 13 above. Only repeats are recommended for telling (WD22).
- **New recurring problem type:** "Pro-only" framing that a free path also gives (own-words reminders through dictation). Technique that worked: compare each Pro claim with the app's free-state renders (`App/build/ux/reminders/sheet.your-way-free-dictated…`).
- **Risk for later:** U13 (two tabs) would make "The Notes tab" (FAQ 7) outdated. The parallel whole-app run (2026-10-28) had written nothing yet when this review ran.
- **Settled checks, don't re-raise:** the widget and shortcut names; Settings → Account → Delete account in all three languages; «giny», «lista de pasos» and «llista de passos» match the app.
