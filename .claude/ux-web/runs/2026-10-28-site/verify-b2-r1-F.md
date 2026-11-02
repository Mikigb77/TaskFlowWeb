## UX web verify — run 2026-10-28-site, round 1, area F (WP70, WP264) — 2026-11-01
**Verdict:** Ship. All three findings are fixed exactly as briefed, and these changes caused no regression.
**Walked:** the FAQ on `/`, `/es/`, `/ca/`, as the Comparer (free vs Pro) and the Newcomer (notes, repeats). Evidence: code (this run's diff), the tester's renders `home-faq-pricing.es.mobile.light.view.png` and `home-faq-repeat.es.mobile.light.view.png` (01:16, newer than the code at 00:28), and `AUDIT.md` §3 (01:19). All are Chromium renders. None of this was checked on a device.
**Numbers:** the FAQ goes from 8 to 9 items. The Pro sentence went from 30/33/34 words (EN/ES/CA) to a longest sentence of 15/17/17 words in paragraph 2 (EN "It gives you unlimited dictation and file space (with a safety limit of 50 dictations a day)." = 15). Of 9 claims, none was lost.

### Findings
- **WEB-1401 · fixed.**
  - `src/content/site/types.ts` gives `answer: string | string[]`, with a comment.
  - `src/components/HomePage.tsx:151-153` renders `[answer].flat()` as one `<p>` per paragraph.
  - `faq.items[1].answer` is two strings, exactly the brief's copy: an exact-string check matched the brief's text in all three languages, at `en.ts:94-97`, `es.ts:94-97` and `ca.ts:100-103`.
  - `global.css:811-813` adds `.faq-item p:not(:last-child) { padding-bottom: 12px; }`, and `.faq-item p` keeps its 24 px.
  - The render `home-faq-pricing.es.mobile.light.view.png` shows the Free paragraph, a visible gap, then "TaskFlow Pro es…", with nothing clipped.
  - Tester: the paragraph, spacing, sentence-length, claims and axe tests pass.
- **WEB-1403 · fixed.**
  - The notes answer is exactly the brief's copy: "like a gift idea" / «como una idea para un regalo» / «com una idea per a un regal» (`en.ts:127`, `es.ts:127`, `ca.ts:133`).
  - No FAQ answer says Wi-Fi/wifi. Those words remain only in the demo's offline errors, which is correct.
  - «contrasenya» remains in the CA account answer (`ca.ts:108`, "el teu correu i una contrasenya"). That is the real sign-in password, not an example of something to dictate. The acceptance check's literal wording would trip on it, but the tester rightly exempted the account item (`tests/ux-web-features.spec.ts`, WEB-1403 test, `WP70_ACCOUNT_INDEX`), and the intent is met.
  - The answer still names the Notes tab, Add a note, writing or dictating, links and a checklist.
  - The new example agrees with the app's `notesEmptyHelp` ("ideas and things to remember", `../TaskFlow/App/lib/l10n/app_en.arb:90`).
- **WEB-1404 · fixed.**
  - The new item comes right after the voice item: `en.ts:110-114`, `es.ts:110-114`, `ca.ts:116-120`. The question and answer are exact in all three languages.
  - It is one string, adds no markup or link, and has no "more and more often".
  - The app's names match: More details/Repeat (`app_en.arb:286, 266`), Más detalles/Repetir (`app_es.arb:169, 149`), Més detalls/Repetició (`app_ca.arb:148, 128`).
  - The engine supports repeating tasks (`../TaskFlow/Backend/core/ai.py:82-85`).
  - "TaskFlow can remind you" stays within `REMINDER_PLANS.md:23`: no escalating plan for repeating tasks.
  - The order is the expected nine, with the home-screen question ninth (`en.ts` question lines 88–130).
  - The render `home-faq-repeat.es.mobile.light.view.png` shows the item fifth, with its answer in four lines and nothing clipped.
  - `AUDIT.md` §3: home EN/ES/CA at w320 and text200 show no overflow.
  - Tester: the order, answer, 320 px, text200 and axe tests pass.

### Regressions
None found in the changed files or the pages they touch (the FAQ on the three homes).
- The `key={paragraph}` key is unique within each item.
- The `:not(:last-child)` rule leaves the one-paragraph answers unchanged.

### Claims checked
| Claim | Source | Status |
|---|---|---|
| Repeats by saying "every Monday" or "every day at 9" (`en.ts:113`) | `../TaskFlow/Backend/core/ai.py:82-85` (recurrence, weekdays) | true |
| More details › Repeat (`en.ts:113`, and the ES/CA lines) | `app_en.arb:286, 266`; `app_es.arb:169, 149`; `app_ca.arb:148, 128` | true, app's names |
| "TaskFlow can remind you" for repeats | `../TaskFlow/Backend/docs/REMINDER_PLANS.md:23` (a plain reminder, no plan) | true |
| Notes are for "a gift idea" (`en.ts:127`) | `app_en.arb:90` `notesEmptyHelp` | true |
| Free/Pro claims (unchanged wording, split) | as in review F | unchanged |

### Notes for the device checks
- A native Spanish and Catalan read of the new sentences is still owed. It is listed in both packages' deviceChecks.
- The owner's in-app check of «todos los lunes a las 9…» is still owed.
