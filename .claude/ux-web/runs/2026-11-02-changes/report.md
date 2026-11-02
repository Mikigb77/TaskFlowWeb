# UX web run 2026-11-02-changes: report

**Verdict:** One round fixed all five findings and they are confirmed. Tests now protect every one of them. There were no regressions and no escalations, and nothing is still open from this run.

All five still need a check by a person:
- the owner's WD3 sign-off of legal version 2026-11-02;
- native Spanish and Catalan reads;
- a phone check of the app's first screen;
- the app's airplane-mode dictation check.

So the ledger lists all five as `device-check`, not `verified`.

All of this evidence is code, Playwright in Chromium, renders and axe. No device was used.

## Fixed (in code and by tests; `device-check` in the ledger)

| ID | Sev · Area | Title | Package | Proof |
|---|---|---|---|---|
| WEB-1801 | S3 · L | Deleted tasks stay whole on the server, not as metadata | WP268 | `tests/ux-web-legal.spec.ts:2214`, `:2287`, `:693`; `tests/legal.spec.ts` |
| WEB-1802 | S2 · L | Privacy §5 omits Activity: members see what you did | WP268 | `tests/ux-web-legal.spec.ts:2230` |
| WEB-1803 | S2 · L | Delete page omits shared notes from what stays | WP268 | `tests/ux-web-legal.spec.ts:2253`, `:2275`, `:2287` |
| WEB-1701 | S1 · F | Account answer lags the app's new first screen | WP269 | `tests/ux-web-features.spec.ts:1750`, `:1773`, `:1840`, `:1858`, `:1873` |
| WEB-1702 | S1 · F | Voice answer says dictation needs the internet | WP269 | `tests/ux-web-features.spec.ts:1795`, `:1819`, `:1840`, `:1873`, `:809` |

What changed:

- **WP268, the legal pages** (verify-r1-L.md):
  - **Privacy §7, first bullet:** it now says what a deletion leaves on the server, in EN, ES and CA. ‘We never delete your tasks on our own, done or not.’ is kept, and no ‘synchronisation metadata’ is left.
  - **Privacy §5:** it now names a task's Activity / «Actividad» / «Activitat».
  - **Delete page, §3's second bullet:** it now names notes.
  - **Legal version** moved to 2026-11-02 (`company.json`, `docs/LEGAL_RELEASE.md:3`), and `legal:check` passes.
  - Checks: everything reflows at 320 px, and axe reports no violations.
- **WP269, the home page's questions** (verify-r1-F.md):
  - **Account answer:** it names the app's two buttons, Continue with Google and Continue with email, in all three languages, with no ‘sign in’ left. The password and the 6-digit code still come only on the email path (WEB-708 holds).
  - **Voice answer:** only its last sentence changed, to ‘Understanding what you say needs the internet: your words are sent to Google.’ The English answer is now 88 words, so WEB-1001's word cap in its test moved from 85 to 88, as the brief set.

## Still open
None from this run.

## Escalations
None.

## Checks for a person or a real device
- **The owner's WD3 sign-off of legal version 2026-11-02** (WEB-1801, WEB-1802, WEB-1803).
  - It replaces the pending sign-off of 2026-11-01 (WEB-1502), and the items under that one.
  - The legal checks to make at that sign-off: the retention information for deleted items (GDPR art. 13(2)(a)) and storage limitation (art. 5(1)(e)). WD35 (WEB-1804) answers the second.
- **Native Spanish reads:**
  - privacy §7's new bullet and §5's Activity sentence;
  - the account answer and the voice answer's last sentence.
- **Native Catalan reads:**
  - privacy §7's new bullet, §5's sentence and the delete page's §3 bullet;
  - the account answer and the voice answer's last sentence.
- **On a phone with the current app** (WEB-1701):
  - the first screen shows «Entra o crea tu cuenta», «Continuar con Google» and «Continuar con mi correo»;
  - the email path asks for a password, then the 6-digit code.
- **The app's own airplane-mode check, UX-2612** (WEB-1702): a dictation made offline on a real phone offers «Guardar como tarea» and adds one task. This is what keeps the narrowed sentence true.

## Notes from the verifiers (not regressions)
- **The delete page doesn't name Activity.**
  - Privacy §5 now says your name shows in a task's Activity, but the delete page's §3 says only ‘Your name is taken off them, “Created by” included’.
  - Nothing there is false: the server does remove the person from Activity (`../TaskFlow/Backend/core/account_deletion.py:198-213`).
  - If the owner wants the two pages to mirror each other, ‘“Created by” and Activity included’ would be a later legal edit, under WD3.
- **One state has no test.** The account answer opened on a phone at 200% text isn't tested; the 200% text test runs on desktop only. The risk is low: it's plain wrapping text in an existing question that other answers already pass at that size.
- **WD35 (WEB-1804) is still waiting on the owner:** how long deleted items stay on the server. WP268's copy says what happens today, so it stands whichever way WD35 goes.

## Files changed
The site's files:
- `docs/LEGAL_RELEASE.md`
- `src/content/legal/en.ts`, `src/content/legal/es.ts`, `src/content/legal/ca.ts`, `src/content/legal/company.json`
- `src/content/site/en.ts`, `src/content/site/es.ts`, `src/content/site/ca.ts`
- `tests/legal.spec.ts`, `tests/ux-web-legal.spec.ts`
- `tests/support/ux-web-copy.ts`, `tests/ux-web-features.spec.ts`

The loop's files:
- `.claude/ux-web/ISSUES.md`
- `.claude/ux-web/runs/2026-11-02-changes/verify-r1-L.md` and `verify-r1-F.md` (untracked)
- `.claude/ux-web/runs/2026-11-02-changes/report.md` (the main session saves it)

None of these files holds another session's uncommitted work. The fix run's base (`refs/ux-web/base`) is the same tree as HEAD (e7f1ba3), so every uncommitted change in them belongs to this run.

## Rounds
- **Round 1:** WP268 and WP269, in one wave of two packages run one after the other. Both are done.
  - Tests passed, and the tests cover all five findings; no finding was left to a device alone.
  - Verification: verify-r1-L.md and verify-r1-F.md both found every finding fixed and no regressions.
