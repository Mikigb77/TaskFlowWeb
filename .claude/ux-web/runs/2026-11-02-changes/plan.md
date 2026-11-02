# UX web loop run 2026-11-02-changes: plan

**In short.** The site says nothing false about the app you merged on 2026-11-01, except one privacy sentence: deleting a task leaves much more on the server than "synchronisation metadata". The reviewers found 5 sentences to correct, in 2 small packages that can run side by side, and 1 question only you can answer: how long deleted things stay on the server.

**You asked for a review only** ("Nothing is fixed in this run"). So this plan waits: the packages run when you say so (`/ux-web fix`). Neither package waits on your answer to WD35.

Sources: `review-F.md` (features and faithfulness: ship) and `review-L.md` (legal: ship after fixes). They checked the site at d4c4e94 against the app at b8a4c8d, with the site's Chromium renders of 2026-11-02 and the app's widget-test renders of 2026-11-01. Nothing was checked on a device. Today is 2026-11-02.

## Your question

### WD35: how long should a task, note or project someone deletes stay on the server? (WEB-1804, review L; raised with WEB-1801)
- **Today:**
  - Deleting a task, note or project only marks it deleted. Its files are removed. The server keeps the rest, hidden: title, notes, checklist, dates, and since D2 the times it was ticked.
  - It stays until the account is deleted. In a shared project it stays with the project.
  - Nothing ever cleans it up. The only cleanup job "never deletes tasks or attachments".
- **Options:**
  - **(a)** Keep it that way, and the privacy policy says so. That's WP268's copy, which goes in either way.
  - **(b)** A server job removes the content of deleted items after a set time, for example 30 days, as with the server logs. It keeps only the "deleted" mark that offline phones need. The privacy policy then gives the period.
- **Recommendation:** (b), before launch.
  - `Backend/docs/ARCHITECTURE.md` already plans it: tombstones kept only "long enough for offline clients".
  - It's server work, done through the app's loop, not the site's.
  - Until it ships, WP268's copy tells the truth about today.
- **Also:**
  - Keeping deleted content with no end date raises a storage-limitation question (GDPR art. 5(1)(e)). It's a legal check for your WD3 sign-off.
  - It sits next to the app's open question on cleaning up completed tasks. Both could be answered as one retention policy.

## Packages, in order

Both run at once: they share no file and depend on nothing.

**WP268 · L · S · severity 3: Legal. Privacy §7 says what a deletion leaves on the server, §5 names a task's Activity, and the delete page names notes; one version move.**
- **WEB-1801** (S3): privacy §7 now says a deleted task, note or project leaves your devices and loses its files, but the server keeps the rest, hidden, until you delete your account (in a shared project, it stays with the project). "Synchronisation metadata" goes. "We never delete your tasks on our own, done or not." stays.
- **WEB-1802** (S2): privacy §5 says members also see your name in a task's Activity («Actividad», «Activitat», as the app spells it), next to each change you made and its date.
- **WEB-1803** (S2): the delete page's §3 says "tasks, notes and files" stay for the others, as its summary and privacy §7 already do.
- The legal version moves once, to the day it runs. Your WD3 sign-off then covers that version, in place of the pending one for 2026-11-01.

**WP269 · F · S · severity 1: Home FAQ. The account answer names the app's two buttons; the voice answer says only understanding needs the internet.**
- **WEB-1701** (S1): "Do I need an account?" names the app's buttons, "Continue with Google" or "Continue with email" («Continuar con Google» / «Continuar con mi correo»), and drops "You sign in once" («Inicias sesión una vez»). The app dropped those words on 2026-11-01. The facts don't change: a password, then the 6-digit code, on the email path only.
- **WEB-1702** (S1): the voice answer's last sentence becomes "Understanding what you say needs the internet: your words are sent to Google." («Para entender lo que dices necesita internet…»). Since your D1, a dictation made offline can still be saved with «Guardar como tarea». The new sentence uses the offline answer's own words.
  - The English answer grows from 85 to 88 words, so an earlier test's 85-word cap moves to 88. No sentence goes over 24 words.

## Skipped

None.

## Checks for you (not findings)

1. **WD3 sign-off** of WP268's new legal version, with review L's legal checks: the retention information for deleted items, and storage limitation (WD35).
2. **Native reads:**
   - Spanish: WP268's §7 bullet and §5 sentence, and WP269's two answers. The subjunctive «hasta que elimines» is my change to the review's «eliminas».
   - Catalan: the same three legal sentences, the delete page's «les tasques, les notes i els fitxers», and WP269's two answers. «fins que suprimeixis» is also my change.
3. **On a phone with the current app:**
   - the first screen shows «Entra o crea tu cuenta», «Continuar con Google» and «Continuar con mi correo», and the email path asks for a password, then the code;
   - a dictation in airplane mode offers «Guardar como tarea» and adds one task. This is the app's own check, UX-2612, and it keeps WEB-1702's new sentence true.

## For the main session, outside the site

- **App (/ux):** the deletion screen's "{count} tasks you added to shared projects" also counts notes (`Backend/core/account_deletion.py:107`).
- **Stale app records:**
  - `Backend/docs/ACCOUNT_DELETION.md:26` names only tasks among what stays.
  - `ACCOUNT_DELETION.md:65` and the app's DECISIONS Open item still quote «Las tareas completadas no se eliminan automáticamente a los 30 o 90 días». The site now says «Nunca borramos tus tareas por nuestra cuenta, estén hechas o no.»
- **The loop:** `ux-web.sh since --app` printed nothing this run.
  - The app snapshot was saved at the end of run 2026-10-28-site. That came after app changes its review never saw.
  - Both reviewers diffed from the app commit the last review read (30c8ce0) instead.
  - Fix: take the app snapshot when a review starts, not when its fix ends.

## Ledger

- New, open:
  - WEB-1801, WEB-1802 and WEB-1803 (WP268);
  - WEB-1701 and WEB-1702 (WP269).
- New, decision: WEB-1804 (WD35). It's review L's Q-L1, which had no ID, so it's filed in L's number block.
