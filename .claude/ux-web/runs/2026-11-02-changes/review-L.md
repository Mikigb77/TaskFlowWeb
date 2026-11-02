## UX web review — L: legal, privacy, terms, delete-account (run 2026-11-02-changes) — 2026-11-02

**Verdict:** Ship after fixes. The delete page matches every row of `../TaskFlow/Backend/docs/ACCOUNT_DELETION.md` it describes, and nothing on the legal pages contradicts D2 (completion times) or D9 (a reader's own reminders). But privacy §7 says that deleting something leaves only "synchronisation metadata", while the server keeps the whole task until the account goes (and, since D2, when it was ticked). Two lists of what's shared or kept also leave something out.

**Walked** (Leaver first, then Comparer and Newcomer; EN, ES, CA; phone 390 × 664 and desktop 1440 × 1000, light; dark has the same text):
- **A Leaver who tidies up first:** deletes tasks and a project in the app, then reads privacy §7 (≈ 25 phone screens long; §7 at about screen 15). She believes only sync data is left → WEB-1801.
- **A Leaver from Play's link, a legal page or the app's Privacy link:** reaches the delete page in 1 tap, reads the summary, then §3 ("What is deleted and what stays"). A note she shared with her family is listed as deleted → WEB-1803. «Ajustes → Cuenta → Eliminar cuenta» still matches the app in all three languages.
- **A Comparer with a family project:** reads privacy §5 to see what the others see. A task's «Actividad» is missing: it shows a name and a day next to each change, and since 2026-10-31 also «Ha movido la tarea» → WEB-1802. "Reminders aren't shared: each person has their own" is now true for readers too (D9).
- **Assistive technology:** no legal file changed since the last review. AUDIT §1 covers the 4 legal pages × 3 languages × 2 viewports × 2 themes: 0 axe violations, 0 contrast failures, 0 focus problems, and 0 phone targets under 44 px.

**Evidence:**
- **Website:**
  - `ux-web.sh changed` is empty, and the tree is clean (HEAD d4c4e94).
  - The legal content last changed on 2026-11-02 at 00:28 UTC (committed in d86a2a2). The renders are from 01:15 UTC and the AUDIT from 01:14–02:52 UTC, so both are current. Chromium only.
- **App side:**
  - `ux-web.sh since --app` prints nothing (see the loop note). So the changes were read with `git -C ../TaskFlow diff 30c8ce0 HEAD`; 30c8ce0 was the app's HEAD at the last L review, on 2026-10-29.
  - Files read: `ACCOUNT_DELETION.md` (item 5 marked done), `COMPLETION_TIMES.md` (new, D2), `REMINDER_PLANS.md` (D9), `VOICE_COMMANDS.md` (UX-2508), `.claude/ux-review/DECISIONS.md` (D1, D2, D9) and `app_en.arb`.
  - App and server code were read only to confirm the rules behind the claims.
- **Crops:** `crop.mjs` can't run here: there's no `node_modules`, so no sharp. I cropped with PIL instead, into `/tmp/l-crops/`, outside the repo: `privacy.en.desktop.light.full.png` screens 6 and 8, and `delete-account.en.desktop.light.full.png` screens 2–3.

**Numbers:**
- **Claims:** 28 checked · 1 false (WEB-1801) · 2 incomplete (WEB-1802, WEB-1803) · 0 outdated · 0 unverifiable.
- **`ACCOUNT_DELETION.md`:** 13 of its rows are described on the site, and all 13 match.
- **Leaver:**
  - From any legal page to deletion: 1 tap, in the first screen, in every language.
  - `/es/delete-account/` shows «Escribir solicitud de eliminación» inside the first phone screen (`delete-account.es.mobile.light.fold.png`).
- **Cost of the fixes (EN):** ≈ 15 more words in privacy §7, ≈ 12 in §5 and 1 in delete §3, under one legal version move.

**Attention** (predicted from the fold renders with guidelines §21's heuristic, not measured; the same as at the last review):
- **delete-account, phone (ES):**
  1. The H1 «Elimina tu cuenta de TaskFlow.»
  2. The filled «Escribir solicitud de eliminación».
  3. The in-app line «Con la app: Ajustes → Cuenta → Eliminar cuenta», or the language pill.
  - Competing: «Menú». What's deleted and what's kept is below the fold.
- **delete-account, desktop (EN):**
  1. The H1.
  2. The filled button, in the right half.
  3. The in-app line, then the summary cards at the bottom edge.
- **privacy, phone (ES):**
  1. The H1.
  2. The language pill.
  3. «Eliminar cuenta →».
  - Summary 01 sits in the bottom third.
- **privacy, desktop:**
  1. The H1.
  2. The summary row.
  3. The two links.
- All three findings sit deep in the pages (privacy §5 and §7, delete §3). Only a Leaver or a Comparer looking for them reads that far. The problem there is truth, not attention.

### Findings (most severe first)

**WEB-1801 · Severity 3 · Deleted tasks stay whole on the server, not as metadata**
- **Where:**
  - Privacy §7, first bullet: `src/content/legal/en.ts:122`, `es.ts:122`, `ca.ts:122`. All viewports and themes.
  - Render: `privacy.en.desktop.light.full.png`, screen 8 (y ≈ 7487–7596).
- **The moment:** she dictated «cita con el oncólogo el jueves», ticked it, then deleted it. §7 tells her «hasta que eliminas el contenido o la cuenta… Borrar un elemento puede dejar metadatos de sincronización». «La borré: ya no está.»
- **What happens:**
  - Deleting a task or note only marks it deleted (`../TaskFlow/Backend/core/task_views.py:108-120`). The app uploads the whole row as a tombstone (`../TaskFlow/App/lib/repositories/cloud_task_repository.dart:41-45`) and gets it back at each full sync (`:304`, `include_deleted=true`).
  - Deleting a project does the same to every task in it (`../TaskFlow/Backend/core/list_views.py:232-246`).
  - The row keeps its title, notes, checklist and dates. Since D2, it also keeps `completed_at` and `completed_times` (`../TaskFlow/Backend/docs/COMPLETION_TIMES.md:11-12`). Only the files are removed.
  - Nothing purges it. The only cleanup job "Never deletes tasks or attachments" (`../TaskFlow/Backend/core/management/commands/maintain_staging.py:10`).
  - The rows go only with the account ("soft-deleted rows included", `ACCOUNT_DELETION.md:21`). In a shared project they're kept for the group, like the rest (`../TaskFlow/Backend/core/account_deletion.py:78`).
  - The sentence describes the plan, not the code. `../TaskFlow/Backend/docs/ARCHITECTURE.md:92` keeps tombstones only "long enough for offline clients", and `:110` lists that cleanup as not done.
- **Why it fails:**
  - FN-1: every claim must be true today (UCPD art. 6).
  - PV-1: privacy facts in plain words (WP260 2018).
  - TR-3: errors are trust bugs.
  - Retention periods are GDPR art. 13(2)(a) information *(legal check)*.
  - Severity 3, not 4: the rows stay inside the person's own account, are never shown or shared, and go with the account, as the page says.
- **Fix:** take out the false clause and say what happens. Replace the whole bullet:
  - EN "Account and personal cloud content: kept while you have your account. We never delete your tasks on our own, done or not. A task, note or project you delete leaves your devices and its files are removed, but our server keeps the rest of it, hidden, until you delete your account (if it was in a shared project, it stays with that project). Account deletion removes your personal database records and sessions."
  - ES «Cuenta y contenido personal en la nube: se conservan mientras tengas la cuenta. Nunca borramos tus tareas por nuestra cuenta, estén hechas o no. Una tarea, nota o proyecto que borras desaparece de tus dispositivos y se eliminan sus archivos, pero nuestro servidor guarda el resto, oculto, hasta que eliminas tu cuenta (si estaba en un proyecto compartido, se queda con ese proyecto). Eliminar la cuenta suprime sus registros personales en la base de datos y sus sesiones.»
  - CA «Compte i contingut personal al núvol: es conserven mentre tinguis el compte. No esborrem mai les teves tasques pel nostre compte, fetes o no. Una tasca, nota o projecte que esborres desapareix dels teus dispositius i se’n suprimeixen els fitxers, però el nostre servidor en conserva la resta, oculta, fins que suprimeixes el compte (si era en un projecte compartit, es queda amb aquell projecte). Suprimir el compte elimina els registres personals de la base de dades i les sessions.» (needs a native Catalan read)
  - **Version move:** this edits legal text, so it moves the version together with WEB-1802 and WEB-1803, and needs the owner's WD3 sign-off. The version lives in `src/content/legal/company.json:10`, `docs/LEGAL_RELEASE.md:3`, `tests/ux-web-legal.spec.ts:691-695` and `tests/legal.spec.ts:35`.
  - If the owner chooses (b) in Q-L1, the sentence names the purge period instead, once the server does it.
- **Verify:**
  - A `tests/ux-web-legal.spec.ts` assertion: §7's first bullet has none of "synchronisation metadata" / «metadatos de sincronización» / «metadades de sincronització», none of "until you delete the content" / «hasta que eliminas el contenido» / «fins que suprimeixes el contingut», and has the new sentence.
  - `npm run legal:check` passes.
  - §7 still reflows in `privacy.*.mobile-w320.light.full.png`.
- **Evidence:** verified in the server and app code cited above; seen in a current render.

**WEB-1802 · Severity 2 · Privacy §5 omits Activity: members see what you did**
- **Where:**
  - Privacy §5, first paragraph: `src/content/legal/en.ts:75`, `es.ts:75`, `ca.ts:75`.
  - Render: `privacy.en.desktop.light.full.png`, screen 6 (y ≈ 5212–5457).
- **The moment:** a father reads «ven tu nombre en las tareas que creas en él («Creada por») y en las que tienes asignadas». His daughter opens a family task's «Actividad» and sees «Ha movido la tarea · Papá · 2 nov». «No sabía que quedaba apuntado.»
- **What happens:**
  - Every shared task's page has an «Actividad» section (`../TaskFlow/App/lib/screens/activity_screen.dart:360`). Any member who can see the task can open it (`../TaskFlow/Backend/core/task_views.py:123`).
  - Each entry shows what was done, who did it and the day (`activity_screen.dart:386`).
  - Since 2026-10-31, an update that only moved the task reads "Moved the task" / «Ha movido la tarea» (UX-2508, `../TaskFlow/Backend/docs/VOICE_COMMANDS.md:455`).
  - §5 names only «Creada por» and assignments. The only mention of activity is §7's promise to remove "identifying activity attribution" (`en.ts:124`), so readers meet the activity only when it's being removed.
  - Since D2, every member's phone also receives the exact time a shared task was ticked. Nothing shows it, so "available to its authorised members" already covers it, and no more words are needed for that.
- **Why it fails:**
  - FN-1: the list it gives must be true and complete.
  - PV-1: the surprising part, in plain words.
  - FN-2: use the app's name, «Actividad».
- **Fix:** sharpen the existing sentence (same version move as WEB-1801):
  - EN "Members of a shared project see your name on the tasks you create there (“Created by”), on tasks assigned to you, and in a task’s Activity, next to each change you made and its date; if you haven’t given a name, they see the start of your email address."
  - ES «Los miembros de un proyecto compartido ven tu nombre en las tareas que creas en él («Creada por»), en las que tienes asignadas y en la «Actividad» de cada tarea, junto a cada cambio que hiciste y su fecha; si no has dado un nombre, ven el principio de tu correo.»
  - CA «Els membres d’un projecte compartit veuen el teu nom a les tasques que hi crees («Creada per»), a les que tens assignades i a l’«Activitat» de cada tasca, al costat de cada canvi que hi has fet i la data; si no has donat cap nom, veuen l’inici del teu correu.» (needs a native Catalan read)
- **Verify:** an assertion that §5 names "Activity" / «Actividad» / «Activitat», as the app spells them (`../TaskFlow/App/lib/l10n/app_en.arb:2335`, `app_es.arb:1188`, `app_ca.arb:892`).
- **Evidence:** verified in code; seen in a current render.

**WEB-1803 · Severity 2 · Delete page omits shared notes from what stays**
- **Where:**
  - Delete page §3, second bullet: `src/content/legal/en.ts:368`, `es.ts:368`, `ca.ts:369`.
  - Render: `delete-account.en.desktop.light.full.png`, screen 3 (y ≈ 2560–2670).
- **The moment:** she put the Wi-Fi note in the family project. The page says «Se elimina…: tu cuenta, tus tareas, notas y archivos», then «Se queda para los demás: las tareas y archivos que añadiste a proyectos compartidos». «La nota se borra.» In fact it stays for the family, without her name.
- **What happens:**
  - The server keeps every task **and note** she created in a shared project that continues (`../TaskFlow/Backend/core/account_deletion.py:78`; `:152-165`, "Tasks and notes the person created…").
  - Privacy §7 already says "tasks, notes and files" (`en.ts:124`), and the summary says "what you added". Only §3 drops notes.
  - Since 2026-11-01, before a note is shared, the app warns that it "can’t be made private again" (`app_en.arb:2234`, UX-2510).
- **Why it fails:**
  - PV-7: TaskFlow's bar is saying what's deleted and what's kept, matching the app and the privacy policy.
  - FN-1: every claim true.
  - The same page uses two different lists of nouns for one set of things.
- **Fix:** replace the bullet's first sentence; the rest stays (same version move):
  - EN "Stays for the others: tasks, notes and files you added to shared projects."
  - ES «Se queda para los demás: las tareas, notas y archivos que añadiste a proyectos compartidos.»
  - CA «Es queda per als altres: les tasques, les notes i els fitxers que vas afegir a projectes compartits.»
- **Verify:**
  - An assertion on the bullet's first sentence in EN, ES and CA.
  - The delete page still has no overflow at 320 px (AUDIT §3).
- **Evidence:** verified in code; seen in a current render.

### Claims checked

| Claim (page, `path:line`) | Source of truth (`path:line`) | Verdict |
|---|---|---|
| Privacy summary 02: words go to Google's AI only to add, find or change tasks, or to ask for reminders in your own words (`src/content/legal/en.ts:10`) | `../TaskFlow/Backend/config/urls.py:39-42` (only the draft and reminder-plan AI routes; none added since 2026-10-29); the app's own note says the same since 2026-10-31 (`../TaskFlow/App/lib/l10n/app_en.arb:549`) | true |
| Privacy §2: "completion history" (`en.ts:30`) | `../TaskFlow/Backend/docs/COMPLETION_TIMES.md:3, 11-12` (D2: the time of each tick, per task and per repeat, on the phone and the server; never shown) | true; covers D2's times |
| Privacy §2: reminders kept as organisation data (`en.ts:30`) | `../TaskFlow/Backend/core/models.py:246-264` (`TaskReminder`, one row per person); readers too since D9 (`REMINDER_PLANS.md:39`) | true |
| Privacy §2: collaboration roles (`en.ts:32`) | `app_en.arb:1112-1114` (Owner, Editor, Viewer) | true |
| Privacy §4: without Pro, the task form sends nothing to the AI (`en.ts:55`) | D1 (UX-2612): «Guardar como tarea» reads the words on the phone (`../TaskFlow/.claude/ux-review/DECISIONS.md:7`) | true |
| Privacy §5: members see your name in "Created by" and on assignments (`en.ts:75`) | `../TaskFlow/App/lib/screens/activity_screen.dart:360, 386`; `../TaskFlow/Backend/core/task_views.py:123`; `VOICE_COMMANDS.md:455` | incomplete → WEB-1802 |
| Privacy §5: "Reminders aren’t shared: each person has their own." (`en.ts:75`) | `../TaskFlow/Backend/docs/REMINDER_PLANS.md:36, 38-39` (nobody sees anyone else's; a reader's change makes no activity or notification); `app_en.arb:1226, 2038` | true, now for readers too (D9) |
| Privacy §5: shared content is available to members according to their roles (`en.ts:75`) | The task API sends `completed_at` to every member (`../TaskFlow/Backend/core/serializers.py:312`), and nothing shows it (`COMPLETION_TIMES.md:3`) | true |
| Privacy §5 and terms §4: copies other people exported can't be erased (`en.ts:75, 225`) | `app_en.arb:1230` ("Copies you exported stay.") | true |
| Privacy §7: content kept "until you delete the content or account"; "Deleting an individual item can leave synchronisation metadata" (`en.ts:122`) | `task_views.py:108-120`; `list_views.py:232-246`; `management/commands/maintain_staging.py:10`; `ACCOUNT_DELETION.md:21` | false → WEB-1801 |
| Privacy §7: we never delete your tasks on our own, done or not (`en.ts:122`) | `maintain_staging.py:10`; the clean-up of completed tasks is still open (`../TaskFlow/.claude/ux-review/DECISIONS.md:343`); D2 only orders Completadas | true today |
| Privacy §7: shared content stays until a member deletes it or the space ends; membership, assignments and activity attribution are removed (`en.ts:124`) | `ACCOUNT_DELETION.md:26-28` | true (deleted items stay hidden: WEB-1801) |
| Privacy §7: invitation history stays without the sender's account link (`en.ts:126`) | `ACCOUNT_DELETION.md:30` | true |
| Privacy §7 and delete §5: this phone clears its copy, and other devices clear theirs at their next contact (`en.ts:125, 392`) | `ACCOUNT_DELETION.md:53-58`; `../TaskFlow/App/lib/providers/auth_provider.dart:91-93` | true |
| Privacy §7 and delete §3: RevenueCat is asked to delete its record; Google Play keeps its own (`en.ts:128, 367, 369`) | `ACCOUNT_DELETION.md:32-33` | true |
| Delete summary 01: account, tasks, notes and files deleted on all devices (`en.ts:340`) | `app_en.arb:2627` (`deleteAccountIntro`, the same words); `ACCOUNT_DELETION.md:20-22` | true |
| Delete summary 02: what you added to shared projects stays, without your name (`en.ts:341`) | `ACCOUNT_DELETION.md:26`; `account_deletion.py:78` | true |
| Delete summary 03 and §5: Pro on Google Play isn't cancelled (`en.ts:342, 391`) | `app_en.arb:2717`; `ACCOUNT_DELETION.md:39` | true |
| Delete §1, the request box and terms §8: Settings → Account → Delete account, in each language (`en.ts:263, 349`; `index.ts:49-50`) | `../TaskFlow/App/lib/screens/settings_screen.dart:127-134`; `account_screen.dart:337-339`; `app_en.arb:223, 2001, 2619`; ES «Ajustes → Cuenta → Eliminar cuenta», CA «Configuració → Compte → Suprimeix el compte» | true |
| Delete §1: the screen names the account, counts what goes, shows what stays and who receives it; the copy leaves out files (`en.ts:349`) | `../TaskFlow/App/lib/screens/delete_account_screen.dart:380-385, 486-496, 638-661`; `ACCOUNT_DELETION.md:35-40` | true |
| Delete §1: password or Google; needs a connection; opening deletes nothing; a changed plan asks again; signs out with a confirmation (`en.ts:350`) | `ACCOUNT_DELETION.md:44-60`; `app_en.arb:2788, 2809, 2833` | true |
| Delete §3: sign-in, Google link, sessions, memberships, notification settings and the free-dictation count are deleted (`en.ts:367`) | `ACCOUNT_DELETION.md:20`; `models.py:179-183` (`ProjectPreference.notifications`); `TaskReminder` cascades (`models.py:253`) | true |
| Delete §3: "tasks and files you added to shared projects" stay, without your name (`en.ts:368`) | `account_deletion.py:78, 152-165` (notes too) | incomplete → WEB-1803 |
| Delete §3: projects and groups you own pass to another member, and the app says who first (`en.ts:368`) | `ACCOUNT_DELETION.md:23-25, 38` | true |
| Delete §3: Play's records, support emails, security logs and backups aren't deleted by the app (`en.ts:369`) | `ACCOUNT_DELETION.md:33` | true |
| Delete §4: deleted on confirming, files right after; no email is sent (`en.ts:376`) | `ACCOUNT_DELETION.md:16, 63` (the confirmation email is still a later step) | true today |
| Delete §5: your Google account isn't deleted (`en.ts:392`) | `app_en.arb:2737` | true |
| Terms §4: owners and administrators control membership and permissions (`en.ts:225`) | `task_views.py:51-53` (a reader may change only their own reminders, D9) | true |

### Missing from the site (app features worth telling)
- None. D9 is covered by WD28's sentence, and D2 changes only an order the app never shows.

### Keep
- The in-app route uses the app's own labels in all three languages, in all three places it appears (the request box, delete §1 and terms §8).
- Delete summary 01 is the app's own sentence (`deleteAccountIntro`, `app_en.arb:2627`).
- WD28's reminders sentence needed no edit for D9: it was already written for everyone.
- Since 2026-10-31, privacy summary 02 gives the same reasons as the app's own voice note (`capturePrivacy`, `app_en.arb:549`).
- No legal page names anything the app's 2026-10-28-app run removed: "exporting creates a personal copy", `fileLocalHelp` and `billingSettingsHelp` appear nowhere.

### Questions for the owner (product decisions only)
- **Q-L1 · How long should deleted tasks, notes and projects stay on the server?** (WEB-1801)
  - Today they stay, hidden, until the account is deleted.
  - (a) Keep that, and the site says so (WEB-1801's copy).
  - (b) A server job removes their content after a set time, for example 30 days, like the server logs, and keeps only the "deleted" mark that offline phones need. The site then names the period.
  - Recommendation: (b) before launch, as `../TaskFlow/Backend/docs/ARCHITECTURE.md:92, 110` already plans, with WEB-1801's copy until it ships.
  - Storage limitation (GDPR art. 5(1)(e)) is a *(legal check)* for the WD3 sign-off.

### Cross-slice notes
- **App (/ux):** the deletion preview's "{count} tasks you added to shared projects" (`app_en.arb:2680`, `app_es.arb:1254`, `app_ca.arb:958`) also counts notes (`../TaskFlow/Backend/core/account_deletion.py:107`).
- **App records:**
  - `../TaskFlow/Backend/docs/ACCOUNT_DELETION.md:26` names only tasks among the contributions that stay.
  - `ACCOUNT_DELETION.md:65` and the app's DECISIONS Open item still quote «Las tareas completadas no se eliminan automáticamente a los 30 o 90 días». The site now says «Nunca borramos tus tareas por nuestra cuenta, estén hechas o no.» (`src/content/legal/es.ts:122`).
- **F:** nothing from this area.

### Loop note
- `ux-web.sh since --app` and `ux-web.sh app` print nothing in this run.
- The cause: `refs/ux-web/app-last` was saved on 2026-11-02 at 03:20, at the end of run 2026-10-28-site. That was after the app commits of 2026-10-31 and 2026-11-01, which that run's review (2026-10-29) never saw.
- So a snapshot that moves at the end of a fix run marks the app changes made during the run as reviewed.
- This run's file list came from the workflow, and its diffs from `git -C ../TaskFlow diff 30c8ce0 HEAD`.

### Memory notes
- **Claims map, rows to add:**
  - Privacy §7, bullet 1 (`en.ts:122`) ↔ the server's soft delete: `../TaskFlow/Backend/core/task_views.py:108-120`, `list_views.py:232-246`, `management/commands/maintain_staging.py:10` ("Never deletes tasks"); the app's tombstone upload, `../TaskFlow/App/lib/repositories/cloud_task_repository.dart:41-45, 304`; the unbuilt plan, `Backend/docs/ARCHITECTURE.md:92, 110`.
  - Privacy §2 "completion history" (`en.ts:30`) ↔ `Backend/docs/COMPLETION_TIMES.md` (D2).
  - Privacy §5 (`en.ts:75`) ↔ a task's Activity (`App/lib/screens/activity_screen.dart:325, 360, 386`; `Backend/core/task_views.py:123`; `VOICE_COMMANDS.md:455`, UX-2508 "moved"). Its reminders sentence ↔ `REMINDER_PLANS.md:36-39` (D9, readers).
  - Delete §3, bullet 2 (`en.ts:368`) ↔ `Backend/core/account_deletion.py:78, 107, 152-165` (notes are kept too).
- **Recurring problem: a retention sentence describes the plan, not the code.** Privacy §7 described tombstones as `ARCHITECTURE.md` plans them, but nothing purges deleted rows. Technique: for each retention claim, read the delete handler and look in `Backend/core/management/commands/` for a cleanup job. "Soft-deleted rows included" in a contract doc is the clue.
- **Recurring problem: one page, two noun lists.** "Deleted: tasks, notes and files", then "Stays: tasks and files". Check that every list on the same page names the same set.
- **Loop:** `ux-web.sh since --app` can be empty even though the app changed after the last review, because `app-last` moves at the end of the fix run. Diff from the app's HEAD at the review instead (30c8ce0 for this run).
- **Container:** there's no WSL and no `node_modules`, so `crop.mjs` can't run. PIL crops written to `/tmp` worked.
