## UX web verify — run 2026-11-02-changes, round 1, area L (WP268) — 2026-11-02

**Verdict:** All three findings are fixed. I found no regressions in the changed files or the pages they touch. What's left is the owner's WD3 sign-off of version 2026-11-02 (it replaces 2026-11-01's, WEB-1502) and the native ES/CA reads.

**Evidence used:**
- the run's own diff (`ux-web.sh diff`) of `src/content/legal/{en,es,ca}.ts`, `company.json`, `docs/LEGAL_RELEASE.md` and both specs;
- the renders, made 05:03 UTC, after the content changed at 04:57 UTC, so they are current;
- `AUDIT.md` (05:28 UTC) and the aria snapshots;
- the app and server sources the brief cites.

All of it is Chromium only. No device was used.

### Findings

**WEB-1801 · fixed**
- Privacy §7's first bullet matches the brief exactly in EN, ES and CA (`src/content/legal/en.ts:122`, `es.ts:122`, `ca.ts:122`):
  - ‘We never delete your tasks on our own, done or not.’ is kept word for word in each language;
  - the organizer's subjunctives ‘mientras tengas’ / ‘hasta que elimines’ and ‘mentre tinguis’ / ‘fins que suprimeixis’ are present.
- `grep` over `src/content/` finds no ‘synchronisation metadata’ / «metadatos de sincronización» / «metadades de sincronització» and no ‘until you delete the content’ / «hasta que eliminas el contenido» / «fins que suprimeixes el contingut».
- The claim holds against the server:
  - deleting a task only marks it deleted and removes its files (`../TaskFlow/Backend/core/task_views.py:108-120`);
  - deleting a project does the same to every task in it (`list_views.py:232-246`);
  - on account deletion, a deleted project takes its tasks, and the person's tasks in continuing shared projects stay, deleted ones included (`account_deletion.py:60-78`).
- Render: `privacy.ca.mobile-w320.light.full.png`. §7's bullet reflows inside 320 px.
- `AUDIT.md` §3: privacy es and ca at w320 show ‘no’ sideways scroll and ‘none’ clipped.

**WEB-1802 · fixed**
- §5's second sentence matches the brief exactly in all three languages (`:75`).
- ‘Reminders aren’t shared: each person has their own.’ still follows ‘…just one person’s tasks.’, and the rest of the paragraph is unchanged.
- `tests/ux-web-legal.spec.ts`: `WP66_SHARING_BEFORE` was updated only in its second sentence.
- The app's names match: ‘Activity’ / «Actividad» / «Activitat» (`app_en.arb:2335`, `app_es.arb:1188`, `app_ca.arb:892`).
- Each entry shows the person and the day (`activity_screen.dart:384-386`, ‘actor_name · shortDate’), so ‘next to each change you made and its date’ is true.
- Render: `privacy.ca.mobile-w320.light.full.png`. The aria snapshots for privacy en/es/ca carry the new text.

**WEB-1803 · fixed**
- The delete page's §3 second bullet starts with the brief's sentence in EN, ES and CA (`en.ts:368`, `es.ts:368`, `ca.ts:369`), and the rest of the bullet is unchanged.
- The old phrases are gone from `src/content/legal/`.
- Render: `delete-account.ca.mobile-w320.light.full.png`. The bullet reflows at 320 px.
- `AUDIT.md` §3: delete-account es and ca at w320 show none.
- Version move:
  - `company.json` is 2026-11-02, and `docs/LEGAL_RELEASE.md:3` says ‘2 November 2026’;
  - the aria snapshots read ‘In force since 2 November 2026’ and ‘En vigor des del 2 de novembre del 2026’;
  - the testers report that `legal:check` passes.

`AUDIT.md` §4 reads ‘No violations on any page.’

### Regressions
None.

What I checked:
- the three diffs are limited to the briefed sentences;
- no other legal sentence contradicts the new §7 bullet:
  - the shared-content bullet ‘until deleted by an authorised member’ is consistent with ‘it stays with that project’;
  - the delete page's ‘Deleted… your tasks, notes and files’ is consistent too;
- the test changes are only the briefed updates, plus a `test.slow()` on the twelve-page focus test, which is not user-facing.

### Note for the organizer (not a regression, not new to this run)
- §5 now tells people their name shows in a task's Activity.
- The delete page's §3 second bullet says ‘Your name is taken off them, “Created by” included’ but doesn't name Activity.
- The server does remove the person from Activity (`../TaskFlow/Backend/core/account_deletion.py:198-213`), and privacy §7's shared-content bullet already says ‘identifying activity attribution are removed’.
- So nothing on the delete page is false. If the owner wants the two pages to mirror each other, ‘“Created by” and Activity included’ would be a later legal edit, under WD3.

### Left for a person
- The owner's WD3 sign-off of version 2026-11-02.
- A native Spanish read of §7 and §5.
- A native Catalan read of §7, §5 and the delete page's §3.
