---
name: claims-map
description: Where the website claims each app feature and the app/backend source that backs it, for tracing app changes to site lines
metadata:
  type: project
---

Snapshot 2026-11-05 (meeting/Vertex rows from run 2026-11-05-pages; rest from 2026-11-02, after run 2026-10-28-site b2 and 2026-11-02-changes; FAQ now 9 items, questions at en.ts 88/93/100/105/110/115/120/125/130) (English lines in `src/content/site/en.ts` / `src/content/legal/en.ts`; ES/CA mirror them). Re-grep before citing.

| Feature claimed | Site (en) | Source of truth |
|---|---|---|
| Android only; not on Google Play yet, can't download | site en.ts hero ~7, status ~52, FAQ ~89, closing ~124, demo hand-over ~184, header `comingSoon` ~23 | ux-web DECISIONS (Play not published) |
| Several tasks in one dictation; calendar card ends "TaskFlow can remind you of tasks with a date, more and more often as the day gets closer." (WD20; ES «cada vez más a menudo según se acerca el día», matches app `reminderPlanGrowing` «Cada vez más a menudo»); hero "can remind you before it" | en/es/ca.ts:61, hero | `../TaskFlow/Backend/docs/REMINDER_PLANS.md:11, 50-56` (strengths free), app ARBs, `../TaskFlow/App/lib/services/reminder_plans.dart:105-110` |
| Privacy §4: "With Pro, words you type for the AI are sent the same way. Without Pro, the task form never sends anything to the AI." (Pro reminder sheet sends own-words to `ai/reminder-plan/`) | legal en.ts:55 | `../TaskFlow/App/lib/widgets/reminder_plan_sheet.dart:207,219,252,476` (free: own-words row opens Pro) |
| Voice finds and changes tasks too, incl. bulk (move yesterday's to tomorrow, complete many at once; one undo) | FAQ "How do I add tasks by voice?" en.ts ~104; calendar/voice card sentence ~71 | ux-review DECISIONS 2026-10-21 "Bulk voice commands"; `../TaskFlow/Backend/docs/VOICE_COMMANDS.md:400` (no Pro needed) |
| Home-screen shortcut/widget "Dictate a task" / «Dictar una tarea» / «Dicta una tasca»; share text from WhatsApp | FAQ 8th item en.ts ~122-125 | `../TaskFlow/App/android/app/src/main/res/values{,-es,-ca}/strings.xml:3,11`; `AndroidManifest.xml:46-48` (`text/plain`) |
| Phone calendars shown beside tasks, stay on the phone | en.ts ~61; privacy §9 permissions | App device-calendar bridge |
| Notes tab: Add a note, write or dictate, links/checklist | FAQ ~117-119 | ARB `notes`, `addNote`, `notesEmptyHelp`, `noteTitleHint` |
| Files on tasks, backed up, 6 MB each | en.ts ~76 | free-tier plan / backend limits |
| Repeating tasks: say "every Monday"/"every day at 9", or More details › Repeat; "TaskFlow can remind you" (no escalating plan) | FAQ item 5 en.ts:110-114 (es 110-114, ca 116-120) | `../TaskFlow/Backend/core/ai.py:82-85`, `app_en.arb:266,286` (Repeat, More details), `REMINDER_PLANS.md:23` |
| Hero free line: "Free with an account: 10 dictations a month, and tasks by hand with no limit." | en.ts:53 `hero.free` | free-tier-plan.md (same as FAQ free) |
| Notes example "like a gift idea" | FAQ notes en.ts ~127 | `app_en.arb:90` `notesEmptyHelp` |
| Demo task completion: "Complete {title}"; Today/Tomorrow; "Original text"; no-tasks copy | `voice.completeTask`, `today`/`tomorrow`, `originalText`, `noTasks` | `app_en.arb:2028` completeNamedTask, `:19` reviewOriginalText, `:1763` captureNoTasks |
| Failed demo request doesn't use a try; empty result does | `voice.errors.*`, `noTasks` | `src/lib/voice/store.ts` admit/finish, `policy.ts:59-67` `withoutTry` |
| `/delete-account/` opens in visitor's language | privacy §8 legal en.ts:142 | `src/proxy.ts`, WD27 |
| Offline use | features offline card ~78, FAQ ~107 | IMPLEMENTATION_STATUS |
| Sharing with family | FAQ ~112 | sharing docs, ARBs |
| Free (FAQ item 2 is now two paragraphs, Free then Pro, en.ts:94-97): 10 dictations/month; form unlimited after; "Reminders are free too, even the ones that come more and more often…" (WD21); Pro: unlimited dictation + files, 50/day safety limit, then separate sentence "It also turns sentences you type into tasks, and lets you ask for reminders in your own words."; monthly, price not set (price sentence last) | FAQ "Is TaskFlow free?" en.ts:94, es.ts:94, ca.ts:100 | free-tier-plan.md, REVENUECAT_SETUP.md, `REMINDER_PLANS.md:13, 90-105` (own words Pro only, 402), `reminder_plan_sheet.dart:454-461`, `app_en.arb` `billingReasonReminderPlans` |
| Live demo: 3 tries; recording not kept; quota records only | demo badge; privacy §8 #website | `src/lib/voice/policy.ts` |
| Google sign-in keeps first name only, no photo (NOT "no surname": falls back to full `name`) | privacy §2 #data | `../TaskFlow/Backend/core/google_auth.py:42-45` |
| 6-digit email code, 30 min | privacy §2 | `../TaskFlow/Backend/docs/EMAIL_VERIFICATION.md:3` |
| On-device speech | privacy §4 | `../TaskFlow/App/lib/services/native_speech.dart` |
| AI provider (version 2026-11-05): app AND website demo use Google Cloud's Vertex AI only (no Gemini API / AI Studio); Google may process outside the EU, may keep some data for caching, safety and abuse monitoring; "We do not promise zero retention or EU-only processing"; link label "Google Cloud service terms, including Vertex AI" (ES «incluida», CA «inclosa») | privacy §4 ¶3-4 legal en.ts:57-58, :63; §5 Google Cloud processor :80 | `origin/main:Backend/core/ai.py:160-173` (commit `aa627da`; the app checkout's branch may lack it: check `origin/main`) |
| Meeting notes (Pro, 2026-11-05): summary 02 "make notes from a meeting you record, with everyone’s words in it"; §2 what a meeting stores; §3 "writes the notes of meetings you record" (outside "for your review": notes save themselves); §4 ¶2 audio sent in ~5-min pieces, kept on phone until received, server deletes each piece's audio after transcription; notes list = summary, to-dos («las cosas por hacer» / «les coses per fer»), decisions, open questions; §4 ¶5 tell people before recording | privacy legal en.ts:10, :33, :48, :56, :59 | `../TaskFlow/App/docs/MEETING_NOTES.md` (MN-21), `meeting_uploader.dart:380` (`store.saveNote`, no review), `app_es.arb:1506`, `app_ca.arb:1210` |
| Meeting retention (privacy §7 bullet, WEB-1901-1903/2003): piece audio deleted once transcribed, meeting text once notes saved; anything left on the server, finished or not, deleted 30 days after the last piece; "a recording the app asks you about" left unanswered becomes a note 7 days after it asks (covers cut-off AND quiet Stop; never name Stop); Discard deletes from phone at once, from server as soon as phone is online; account deletion deletes meetings | legal en/es/ca.ts:126, `docs/LEGAL_RELEASE.md:37-38` | `meeting_store.dart:39` (`unanswered` 7 days), `:695-706` (counted from first ask), `meeting.dart:27` (`discarding`), `Backend/core/meetings.py:645` (`SWEEP_DAYS`); phase `interrupted` = `meetingStoppedCut` + `meetingStoppedQuiet` |
| AI duty (terms §5, privacy §4 last sentence): check output "before saving, sharing or relying on them" (ES «antes de guardarlos, compartirlos o fiarte de ellos», CA «abans de desar-los, compartir-los o refiar-te’n») | legal en.ts:235, :59 | `meeting_uploader.dart:380` |
| Notification permission names meeting recordings (§9; ES/CA comma before the list's last «y»/«i») | legal en.ts:151 | `app_en.arb:4482` `meetingNotifyAsk` |
| Home/FAQ never name meeting notes; the FAQ's Pro list has 3 benefits vs the app Pro screen's 4 (owner question WD36, see ux-web DECISIONS) | FAQ free en.ts ~94-97 | app Pro screen ARB |
| Demo privacy line: "What you say or type goes to Google only when you tap Done…recording not kept…text deleted after 24 hours" | site en.ts:148 `voice.privacy` | privacy §8, FAQ ("sent to Google"), `src/lib/voice/policy.ts` |
| Usage limits (not "allowances") collected/applied | privacy §2 #data, terms §2/§3/§6 | free-tier-plan.md |
| Privacy: voice text sent "to add, find or change tasks"; returns "suggested tasks and changes" | privacy summary 02, §2 ~33, §4 ~55-56 | same as voice-commands row |
| Legal effective date 2026-11-05 (meeting notes, Vertex AI only; owner signed off 2026-11-05; same-day corrections keep the date, a later fix moves it and needs sign-off again) | `company.json:10` version, `docs/LEGAL_RELEASE.md:3` | ux-web DECISIONS (2026-11-05 entry, WD3) |
| Account deletion; RevenueCat record deleted best-effort; backups expire on their own | privacy §7, delete-account #scope/#timing | `../TaskFlow/Backend/docs/ACCOUNT_DELETION.md:32` |
| Retention (WEB-1801): "We never delete your tasks on our own, done or not."; kept while you have the account / until you delete them; a deleted project takes its tasks; your tasks in continuing shared projects stay with that project | privacy §7 first bullet legal en/es/ca.ts:122 | `../TaskFlow/Backend/core/task_views.py:108-120` (soft delete + files), `list_views.py:232-246`, `account_deletion.py:60-78` |
| Activity (WEB-1802): your name shows in a shared task's Activity next to each change and its date; reminders aren't shared | privacy §5 second sentence legal en.ts:75 | ARB `Activity`/«Actividad»/«Activitat» (`app_en.arb:2335`), `activity_screen.dart:384-386` (actor · shortDate) |
| On deletion your name is taken off shared items, "Created by" included (doesn't name Activity, though server removes it; privacy §7 says "activity attribution are removed") | delete-account §3 second bullet legal en.ts:368 | `account_deletion.py:198-213` |
| Account FAQ (WEB-1701): app's buttons "Continue with Google" / "Continue with email" (never "sign in"/«Inicias sesión»); Google before the semicolon, password + 6-digit code after email (WEB-708) | FAQ account answer en.ts:102, es.ts:102, ca.ts:108 | `app_en.arb:2178-2179` `continueWithGoogle`/`continueWithEmail`, `verifyEmailHelp` (`app_es.arb:458`) |
| Voice FAQ last sentence (WEB-1702) reuses the offline answer's wording "understanding what you say" (no "It needs the internet"); EN cap 88 words (WEB-1001 test) | FAQ voice en.ts:107 / offline en.ts:117 (ca +6) | app DECISIONS D1, `captureOffline` `app_en.arb:1767` |
| Resend sends automatic email | privacy §5 | CLAUDE.md Email |
| Language cookie up to 1 year, never location | privacy §8 | `LanguageSwitch.tsx:17`, `src/proxy.ts:4-10` |
| No Apple/iOS anywhere in legal | — | removed (WEB-210); re-flag any "Apple" |
| Empty-dictation error = app's `captureEmptyInput` | demo `errors.empty` | app_en.arb ~1530 |

Leftover wording: terms §3 "optional dictation…" and §5 "AI capture is optional" no longer found (re-grepped 2026-11-02). Availability still split by design: hero/status/FAQ/demo hand-over say "Google Play", header/menu/closing say "Android".

Related: [[site-map]].
