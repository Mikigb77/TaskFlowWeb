# Plan — run 2026-11-05-pages (privacy and the home's claims after version 2026-11-05)

Two packages, side by side, correct the legal text of version 2026-11-05 (meeting notes, Vertex AI only) before it is published. One question for the owner (WD36) blocks nothing. Nothing on the home is false. On the privacy page, one retention sentence is false, two are incomplete, and the Catalan text calls the feature by a different name from the app.

Reviews: `review-L.md` (privacy, legal), `review-F.md` (home, FAQ, terms). Evidence: Chromium renders and the audit from 97a7758. There are no WebKit renders in this cloud session.

## Why these legal edits are fixes, not decisions

The owner signed off version 2026-11-05 on 2026-11-05: "Not only draft a legal change, but actually go ahead and publish it through GitHub Actions" (`.claude/ux-web/DECISIONS.md`). That version hasn't reached `main` yet: `origin/main` is still at version 2026-11-02, and 97a7758 isn't in it. Both packages correct its text the same day, so the version stays 2026-11-05 and needs no new sign-off. Review L says "a version move… needs the owner's sign-off again". That holds only if the fixes are committed after 2026-11-05. In that case the version moves to that date, and the owner signs off again.

Review F asked for the owner's sign-off on WEB-2001 (Terms §5). I've planned it as a fix under the same reasoning: it brings the Terms in line with the meeting feature this version introduces. If the owner wants Terms edits kept out of this version, WP271 can be set aside.

## Decisions for the owner

- **WD36 — Should the home's FAQ name meeting notes in its list of what Pro gives?** (WEB-2002, review F.)
  - The app's Pro screen lists four benefits. The FAQ's Pro paragraph lists three, and the home never names meeting notes. Nothing on the home is false.
  - Options:
    - (a) Leave it off the home.
    - (b) One clause in the Pro paragraph, in the Pro screen's words.
    - (c) (b), plus a sentence in the Notes answer.
  - **Recommendation: (b).** The copy:
    - EN: "It also turns sentences you type into tasks, lets you ask for reminders in your own words, and makes notes from the meetings you record, up to 20 hours a month."
    - ES: «Además, convierte en tareas las frases que escribes, te deja pedir los recordatorios con tus palabras y hace notas de las reuniones que grabas, hasta 20 horas al mes.»
    - CA: «A més, converteix en tasques les frases que escrius, et deixa demanar els recordatoris amb les teves paraules i fa notes de les reunions que enregistres, fins a 20 hores al mes.»
  - Choose (a) instead if you'd rather wait until meeting notes are checked on a phone and against real Vertex calls.

## Packages (side by side)

### WP270 — Privacy §7: when a meeting is deleted or made into a note, as the app does it (L, S, S3)

Files: the §7 "Meeting recordings" bullet (line 126) in `src/content/legal/{en,es,ca}.ts`, `docs/LEGAL_RELEASE.md:37-38`, and a new test file `tests/ux-web-legal-meetings.spec.ts`.

- **WEB-1901 (S3)** — "A recording you stop but don't finish becomes a note after 7 days" is false. Pressing Stop always makes the notes. The 7-day rule is for a recording that stopped before Stop was pressed, and the 7 days count from when the app asks about it. The sentence now uses the app's own words.
- **WEB-1902 (S2)** — The 30-day rule covers every meeting, finished or not. That one rule replaces the special case for unfinished meetings.
- **WEB-1903 (S2)** — Discard deletes the meeting from the phone at once, and from the server as soon as the phone is online. The page's "at once" isn't true offline.
- The Catalan bullet also takes WEB-1904's naming: «Reunions enregistrades».
- The release notes in `LEGAL_RELEASE.md` repeated the same rules, and they are corrected too.

### WP271 — Privacy summary, §2–§4 and §9, Terms §5: meeting wording, no review-before-saving promise, no widow (L, M, S2)

Files: `src/styles/legal.css:149`, the other named lines in `src/content/legal/{en,es,ca}.ts` (not 126), and `tests/ux-web-legal.spec.ts` (existing copy constants and a new block).

- **WEB-2001 (S2)** — Terms §5 and privacy §4 ask people to check AI output "before saving", but meeting notes save themselves. The fix is one phrase: "before saving, sharing or relying on them". In privacy §3, meeting notes stay outside "for your review".
- **WEB-1904 (S2)** — The Catalan meeting sentences use «gravar», where the app says «enregistrar». In Spanish and Catalan, the notes' "to-dos" become «las cosas por hacer» / «les coses per fer», as in the app.
- **WEB-1502 (S2, regression)** — The Spanish summary 02 leaves «grabas.» alone on its last line on a phone. The fix adds `text-wrap: pretty` to `.legal-summary p`. It lands first, because the other copy changes lengthen the card.
- **WEB-1906 (S1)** — In §4:
  - Google returns a meeting's text and notes, not only its notes.
  - "Outside the EU" is said three times; the repeat in the fourth paragraph goes.
  - The Spanish and Catalan link labels change to «incluida» / «inclosa Vertex AI».
- **WEB-1905 (S1)** — Summary 02's meeting clause adds "with everyone's words in it".
- **WEB-1907 (S1)** — §9's notification permission now names meeting recordings, and §3 says the AI writes meeting notes.

## Skipped

None.

## Noted, not planned

- Delete-account §3's "Deleted" list doesn't name meeting recordings still waiting on the phone or the server (review F's cross-slice note, not a finding). Privacy §7 covers them. It's for a later legal edit, if the owner wants the two pages to mirror each other.
- `.claude/ux-web/DECISIONS.md`'s 2026-11-05 entry summarises the old rules ("30 days for an unfinished meeting, 7 days on the phone"). It's the owner's record, so the main session decides whether to annotate it after WP270.
- The app checkout's branch (`claude/project-thread-xqvgpc`, b9d1589) doesn't contain the Vertex-only commit `aa627da`, which is on `origin/main`. The site's Vertex claims were checked against `origin/main`.

## Round 2

After round 1, WP271 is merged and the final check passed with no failing tests. WP270 fixed its three findings and its first regression, but its second check found a new S1 polish point, so it was shelved unmerged (`unmerged-WP270.patch`). One package lands it. Nothing new goes to the owner.

### WP272 — Privacy §7 meeting bullet: land WP270, with no one-word last line in Spanish (L, S, S3)

Files: the §7 "Meeting recordings" bullet (line 126) in `src/content/legal/{en,es,ca}.ts`, `docs/LEGAL_RELEASE.md:37-38`, and `tests/ux-web-legal-meetings.spec.ts` (from the patch).

- **WEB-1901, WEB-1902, WEB-1903** — WP270's verified fixes, applied from `unmerged-WP270.patch` as they are. The main checkout still has the old, false bullet.
- **WEB-2003 (S1, R1-WP270-1)** — The 7-day sentence left out a quiet Stop. WP270's fix names "a recording the app asks you about", which covers both cases, and the release notes name both. This is in the patch. It replaces WP270's acceptance check on the word "Stop".
- **WEB-2004 (S1, R1-WP270-2)** — On a 390 px phone, the Spanish bullet ended on «reuniones.» alone. The fix is a no-break space in «sus reuniones.» (`es.ts:126`), as WEB-1609 did with Google LLC. English gets the same only if its render shows one word. The verifier's alternative, `text-wrap: pretty` on every legal list item, is not planned: it would re-wrap all three legal pages in three languages, outside this package, in a round meant to converge.

Noted, not planned: `.legal-body li` has no `text-wrap`, so any later copy change to a legal list item can leave a one-word last line (the verifier's memory note). A site-wide `text-wrap: pretty` there is for a later legal round, checked on every legal page.
