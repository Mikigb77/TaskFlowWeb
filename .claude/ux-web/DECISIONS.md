# Owner decisions — the website

Every agent in the UX web loop reads this before reviewing or planning. Only the owner makes these decisions. Agents never add to this file; the main session records what the owner says in chat. Newest first.

The app's decisions are in `../TaskFlow/.claude/ux-review/DECISIONS.md`. They bind the site too: the site may only say what the app does, and anything open there is open here.


## 2026-11-08 — WD37: file allowances replace "unlimited file space", and completed tasks' files go after 15 days
- The owner, in the app (2026-11-08): every account's files on a task are deleted 15 days after it's completed; without Pro an account can upload 200 MB in all, for life, and with Pro 500 MB a month. The app's record: `../TaskFlow/.claude/ux-review/DECISIONS.md`, 2026-11-08.
- WD2's Pro line changes with it: "unlimited dictation and file space" becomes "unlimited dictation and 500 MB of files a month", in the closing line and the FAQ. The files feature card adds the 15 days and both allowances.
- Privacy §7 gains a bullet on completed tasks' files and the upload record: version 2026-11-08 (`docs/LEGAL_RELEASE.md`). The owner chose «Publish it with this change» (2026-11-08): that is the legal sign-off for this version.
## 2026-11-06 — WD36: meeting notes get their own place on the home page
- The owner, on the home page (2026-11-06): "have we stated clearly on the web and nicely on the web that […] we also have this feature of meeting recording? […] it's also a nice feature, so we should probably give it some importance on the web."
- That answers WD36 of run 2026-11-05-pages with more than its one clause:
  - a feature card of its own, a whole row of the features grid, with an example note beside its copy (aria-hidden, like the calendar card's week);
  - WD36's clause in the FAQ's Pro paragraph, as recommended.
- The facts are the app's: Pro only, Record a meeting in the Notes tab, the phone can be locked while it records, Stop, then a summary, the to-dos, the decisions and the open questions; Create task turns the to-dos into one task with a checklist; up to 20 hours a month.
## 2026-11-05 — Meeting notes on the privacy page, published (version 2026-11-06, the day it went out)
- The owner, on the privacy page for meeting notes (MN-34): "Not only draft a legal change, but actually go ahead and publish it through GitHub Actions." That is the legal sign-off for this version (`docs/LEGAL_RELEASE.md`).
- Privacy §2, §4 and §7 and the summary now cover meeting notes as the app does them: Pro only, up to 20 hours a month, pieces sent while recording, the audio deleted once it's text, the server's text deleted once the note is saved, 30 days for an unfinished meeting, 7 days on the phone.
- On 2026-11-05 the owner decided that every AI call goes through Vertex AI, with no Gemini API key (app repo, `aa627da`). That answers WD12's paid-or-free Gemini half: §4 now names Vertex AI only, and Google Cloud's terms. WD12's backup half is unchanged.
## 2026-10-31 — The plan of run 2026-10-28-site, approved with WD22–WD34 as recommended
The owner answered the list of what waited on him with "do everything" (and then: "after everything finishes, make a pr and merge it onto main"). Every package WP63–WP73 is approved, and each question is answered as `runs/2026-10-28-site/plan.md` recommends:
- **WD22, repeating tasks:** yes, as one FAQ item after "How do I add tasks by voice?", in review F's copy. Never said together with the "more and more often" reminders, which repeating tasks don't get.
- **WD23, what's free in the first screen:** (a), a third line under the hero's status in WD2's words: "Free with an account: 10 dictations a month, and tasks by hand with no limit." (ES «Gratis con una cuenta: 10 dictados al mes y tareas a mano sin límite.», CA «Gratuït amb un compte: 10 dictats al mes i tasques a mà sense límit.»)
- **WD24, hearing when TaskFlow launches:** (a), wait on the site, as decided (WD9). Settling the package ID moves up the owner's launch list; nothing to build.
- **WD25, reminders in your own words:** (a), keep them listed as Pro, as the app says.
- **WD26, the app's reminder preview instead of the calendar card's drawing:** yes, at the pre-launch re-render (WD13), not now.
- **WD27, Play's deletion link:** (a). `/delete-account/` follows the language too: a choice saved in the switch first, then the browser's language, never the location. English stays at that address.
- **WD28, reminders aren't shared:** yes, in the app's own sentence after "They can also show just one person's tasks." in privacy §5, joining WP66's legal edit (EN "Reminders aren’t shared: each person has their own.", ES «Los recordatorios no se comparten: cada persona tiene los suyos.», CA «Els recordatoris no es comparteixen: cada persona té els seus.»).
- **WD29, family sharing against "18 and over":** for the lawyer at the legal sign-off (WD3). Nothing changes now.
- **WD30, a demo try that fails on our side:** yes. An AI error, a timeout or an unreadable answer gives the try back; a result with no task still counts.
- **WD31, crawlers and the noindex before launch:** yes, as a launch-checklist item: whenever the site is reachable before launch, allow crawling and keep the noindex. Nothing is deployed now.
- **WD32, "your calendar":** not now; ask in the five-person test.
- **WD33, reminders in the demo's result:** not now.
- **WD34, the app's completion moment:** yes, through the app's /ux (the app's DECISIONS.md, 2026-10-31). The demo keeps its line.
- Since then in the app: a reader («lector») may choose their own reminders (the app's D9, server bc80025). Reminders stay personal for everyone, so WD28's sentence holds.

## 2026-10-22 (evening) — WD20 and WD21 of run 2026-10-22-changes
The owner answered both "yes", WD21 against the recommendation («not now»):
- **WD20, the calendar card's reminder sentence:** yes. It says that reminders can come more often as a task's day gets closer.
- **WD21, the FAQ's Pro list:** yes: "Let's add that your way in [the FAQ]". «A tu manera», reminders asked for in your own words, joins the Pro list next to unlimited dictation and file space. The free answer still says the until-the-day reminders are for everyone, and the privacy pages already cover the words going to Google's AI.
- The app's answers the same evening bind the site too (see `../TaskFlow/.claude/ux-review/DECISIONS.md`, «D1–D7 of run 2026-10-22-changes»). Plans on shared tasks are personal (D6), and a rhythm said is kept as said (D2). Say no more than the site needs.

## 2026-10-21 (evening) — WD18 and WD19 of run 2026-10-21-changes
The owner answered both, and not as recommended («not now» for both):
- **WD18, changing many tasks at once beyond the FAQ:** "Yes, on the card". One sentence on the «Say several things at once» card says that voice can also move or finish many tasks at once, as in «move all of yesterday's tasks to tomorrow». The hero stays as it is. The FAQ's voice answer still names it too (WP53).
- **WD19, the other ways into TaskFlow:** "Yes, briefly". One short line, or one FAQ answer, names the home-screen widget, the launcher shortcuts and sharing a message from another app such as WhatsApp. Each is named as the app shows it in that language (the widget and shortcuts say «Dictate a task» in English since 2026-10-21; see `../TaskFlow/.claude/ux-review/DECISIONS.md`).
- Both stay short, in English, Spanish and Catalan, and the live demo still only adds tasks.

## 2026-10-21 — WD17: completion belongs above the complete task group
The owner clarifies that the final all-clear / take-a-breath message should apply across all generated tasks: show it on top, in front of the task list, rather than inside the final task. This corrects the placement chosen for WD16 and authorizes a bounded group-level banner change, with tasks/details and undo retained. The owner also requests an explanation and assessment of the earlier layout changes; that does not authorize a broader redesign. Existing EN/ES/CA completion copy remains.

## 2026-10-21 — WD16: a warm completion moment in the live demo
The owner requests a rewarding, emotionally warm response after a visitor marks every generated demo task complete, to convey a feeling they want daily from the app. The current request authorizes local completion controls and feedback in this demo journey. The primary session’s bounded implementation brief keeps the existing card and completed tasks visible, permits undo/retry, excludes account saving, additional voice requests, quota changes and new download/subscription capabilities, and clears feedback on undo, new results and reset. Those details are the implementation constraints for this run, rather than a broader change to product policy.

WD16 supersedes WEB-7’s earlier no-ticking rule for generated demo results; WEB-7’s historical record remains intact.

This is the current bounded request. The temporary owner-away authority below is historical and does not apply to new work.

## 2026-10-18 (night) — The owner is away: the main session decides, records and moves on
**The owner, before leaving:** "whatever question you have for me, whatever decisions, even if it concerns the product, just for now, record what decision you made, what was your recommendation, and you move forward with your recommendation… you are on your own… prioritize completing everything to the best degree possible."

What that means for the loop:
- The main session answers each decision here, and the loop builds it.
- Whole-site runs don't stop for approval.
- Everything is reversible. He reviews it afterwards; the summary is `.claude/AWAY-2026-10-18.md`.
- Unchanged: never push, never deploy, never commit or revert the other session's work in TaskFlowWeb. Edits to its files stay uncommitted for him.

The owner also asked that the reviewers get every tool they need before they judge ("we cannot compromise the quality"). Then they recheck their areas:
- the live demo in every state, with the API stubbed;
- 200% text, zoom and 320 px renders;
- a measured audit: axe, target sizes, contrast, a screen-reader snapshot, the keyboard path, lab speed;
- WebKit renders if possible.

**Run 2026-10-18-site, WD1–WD13 (details in its `plan.md`), decided as recommended unless noted:**
- **WD1 — the sample walkthrough (`#demo`):** removed. One static example takes its place in the live demo's intro: the spoken "Tomorrow, call the dentist and buy bread." and its two task cards. It shows without JavaScript, and whenever the live demo can't run.
- **WD2 — free and Pro on the site:** yes, without a price and without "100 MB":
  - 10 dictations a month without Pro;
  - tasks by hand with no limit;
  - TaskFlow Pro, monthly, for unlimited dictation and file space.

  It goes in the FAQ, in one line in the closing card and in one line after the demo, in three languages.
- **WD3 — editing the legal documents:** yes. The privacy policy gains:
  - the email codes;
  - the first name from Google;
  - speech recognised on the phone;
  - phone calendars staying on the phone;
  - «Creada por».

  The jargon, the Catalan «Eliminar» and "Versión 2026-10-16" are fixed, and `company.version` moves to the edit date. These are the other session's untracked files, so the changes stay uncommitted for his sign-off.
- **WD4 — the hero image and the link preview:** the Calendar with the hero card's example done: "Call the dentist" and "Buy bread" on tomorrow, with the one «Añadir tarea» button. One image per language and theme (6 PNGs, 780 × 1688), rendered by the main session from the app.
- **WD5 — the language of the bare `/`:** chosen from the browser's language on `/` only, never from the IP, falling back to English.
  - A choice made in the language switch is remembered in the browser and always wins.
  - Privacy §8 says so (with WD3).
- **WD6 — "A little focus. A little flow.":** dropped from the footer.
- **WD7 — Android only:** the site says "for Android phones". The Apple mentions go from the legal pages (with WD3), and the app's own "Android and iOS" line goes through /ux.
- **WD8 — the live demo against the free app:** kept as it is; its tries are labelled as the demo's. Once UX-616's route is deployed, the demo gets the same one.
- **WD9 — "tell me when it launches":** not yet. Use Play pre-registration once the package ID is final.
  - The research (second pass) found a Spanish "Pre-register" badge but no Catalan one, so /ca/ would use a text link.
- **WD10 — a family-sharing section:** not now; the FAQ answer is rewritten instead.
- **WD11 — Privacy and Terms inside the app:** yes, at sign-up and in Ajustes, through /ux. It's recorded in `../TaskFlow/.claude/ux-review/DECISIONS.md`.
- **WD12 — backup retention, and paid or free Gemini:** only the owner knows these.
  - The site states nothing new about backup windows or model training; today's cautious wording stays ("no prometemos retención cero").
  - Ask him when he's back.
- **WD13 — publishing:** the site goes out together with, or after, the app and backend it describes. Play Console gets `/delete-account/`. Nothing is deployed now.

**From the recheck (2026-10-19), decided the same way:**
- **WD14 — "unlimited" and its safety limit:** yes, once, in the FAQ only.
  - After "unlimited dictation and file space" it says EN "(with a safety limit of 50 dictations a day)", ES «(con un límite de seguridad de 50 dictados al día)», CA «(amb un límit de seguretat de 50 dictats al dia)».
  - The closing card and the line under the demo keep WD2's short wording.
  - Raising the shared 200-a-day dictation budget before launch is the owner's: it's a server setting in `../TaskFlow/Backend/config/settings.py`, which another session is editing.
- **WD15 — thin type in WebKit:** treated as an artifact of Playwright's WebKit build for Windows. Nothing changes.
  - The site's `@font-face` already declares the variable font's weight range (`font-weight: 200 800`, `src/styles/global.css:7`), and Safari on iOS has supported variable fonts since iOS 11.
  - Reviewers: weight differences in `webkit/` aren't findings unless they're seen on a real iPhone.
  - The owner can confirm on his iPhone (/, /es/privacy/ and a missing page) when he's back.

**Also decided:**
- **Analytics:** none before launch.
  - At launch, the first choice is server-log or first-party audience measurement within the AEPD's 2024 conditions (the guide's PV-6 and FN-9): no consent banner, own audience only, anonymous, cookies at most 13 months.
  - Whether a given tool qualifies is a legal check for him.
- **The Android trademark line** ("Android is a trademark of Google LLC." and ™ on first use): added wherever the site names Android.
  - Approval by Google's Android brand team is his action, at launch.

## 2026-10-18 — What the website is for, and how the UX web loop runs
The owner asked for a review-and-fix loop for the website, as thorough as the app's. His goals, paraphrased:
- **The website is the entry point.** Many people will only know TaskFlow through it, so their experience must be flawless.
- **The journey must be seamless:** seeing TaskFlow on the web → downloading the app → getting into the app → thinking "this feels amazing" → buying Pro.
- **The site teaches; the app provides.** The web must not provide what the app provides. It teaches what TaskFlow can do and makes people think "I really need this app".
- **The site stays faithful to the app.** When app features change, the web reflects them.
- **What he wants from the loop:** a check of whether the web is built correctly, the corrections it needs, and a visual improvement.
- **Google Play isn't published yet.** A download page waits until the app is on Google Play. Until then, the calls to action must be honest.

How the loop runs, the same policy as the app's:
- Fix everything the reviewers find **except product decisions**, at every severity, 1 to 4.
- Stop for the owner's approval only on whole-site runs (`/ux-web site`). Scoped runs fix straight away.
- Commit each verified round on `dev`, in each repo: the site's files in TaskFlowWeb, the loop's records in the app repo. Never push, and never deploy.
- From the loop's brief (main session, 2026-10-18):
  - the site's copy is written in English, Spanish and Catalan, as the app's is (CLAUDE.md, "Text");
  - the reviewer and organizer run at max effort, the implementer and tester at high, all on Opus;
  - another session has uncommitted work in TaskFlowWeb (the legal pages and content, docs, `Dockerfile`, `package.json`, `src/app/layout.tsx` and more). The loop never commits, stages or reverts it.

## Standing decisions
- The decisions in the 2026-10-18 entry above.

## Open — not decided; anything that depends on these is a decision, not a fix
- WD1–WD13 of the first whole-site run were decided by the main session on 2026-10-18 (night); see the top. Still for the owner: WD12's two facts, the legal checks, and the Android brand approval at launch.
- The app's open items bind the site too: see the Open section of `../TaskFlow/.claude/ux-review/DECISIONS.md`. Account deletion and the clean-up of completed tasks are listed there, and the privacy and delete-account pages must match whatever is chosen.
