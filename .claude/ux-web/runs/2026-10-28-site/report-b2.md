## UX web loop: run 2026-10-28-site, batch b2: close (2026-11-01)

**Verdict:** Ship, with one regression still open. All 26 findings were read as fixed in the last round that checked them, and none of their tests failed. That covers the 23 from round 1 (WP68–WP73, WP261–WP264) and the 3 round-1 regressions fixed in round 2 (WP266, WP267). Nothing was escalated. 14 findings are `verified`. 12 are `device-check`: fixed in code and locked by tests, but they still need a real phone or browser, a screen reader, a native read or the owner. Round 2's WP266 caused one new regression, R2H-1 (S2). It is filed as **WEB-1615** and is `open`. This batch has no round to fix it, so it needs a new package.

### Verified (14)
| ID | Title | Package | Test |
|---|---|---|---|
| WEB-1202 | On phones, "an app for Android" comes last | WP68 | `tests/ux-web-home.spec.ts:673`, `:711` |
| WEB-1206 | ES and CA promise «very soon»; English says "coming soon" | WP68 | `tests/ux-web-home.spec.ts:711`, `:722`, `:732`, `:766` |
| WEB-1207 | ES and CA quote ends with an English-style period | WP68 | `tests/ux-web-home.spec.ts:711`, `:798` |
| WEB-1209 | Nothing about cost in the first screen | WP262 (WD23) | `tests/ux-web-home.spec.ts:830`, `:853`, `:900`, `:920` |
| WEB-1303 | No-tasks message is the app's old sentence | WP69 | `tests/ux-web-voice.spec.ts:3406` |
| WEB-1306 | Result tick boxes read as "pick what to add" | WP69 (heading fixed by WP266, see WEB-1612; tap area: WEB-1615) | `tests/ux-web-completion.spec.ts:754`, `:820` |
| WEB-1307 | The date to check is small print, never "Tomorrow" | WP69 | `tests/ux-web-voice.spec.ts:3459` |
| WEB-1309 | Typed text is called "what you said" | WP69 (re-checked in r2 after WP266) | `tests/ux-web-voice.spec.ts:3356`, `:3383` |
| WEB-1604 | The sticky header eats a quarter of short screens | WP71 | `tests/ux-web-global.spec.ts:1663`, `:1687`, `:1709`, `:1725` |
| WEB-1605 | The footer calls the Privacy Policy "Privacy", in small print | WP73 (its size side effect: WEB-1614) | `tests/ux-web-frame.spec.ts:487`, `:527` |
| WEB-1607 | The 404's title reads three languages, English first | WP73 | `tests/ux-web-frame.spec.ts:560`, `:573` |
| WEB-1609 | One-word last lines in the footer and the 404 | WP73 | `tests/ux-web-frame.spec.ts:593`, `:619`, `:644` |
| WEB-1613 | A typed last try hides what was typed (regression R1H-2) | WP266 | `tests/ux-web-voice.spec.ts:3636`, `:3683` |
| WEB-1614 | Footer legal row now outranks the site's own links (regression R1G-1) | WP267 | `tests/ux-web-frame.spec.ts:686`, `:736` |

A test now covers every verified finding.

Two caveats:
- **WEB-1613 and WEB-1614.** Their round-2 verifiers wrote that the testers reported no results to them. The verdicts rest on code, fresh renders and AUDIT. The round summary says round 2's tests passed, including those for WEB-1612–1614. So the "no test failed" rule holds, but no verifier saw those tests pass.
- **WEB-1613.** The 0-task typed last try in Spanish and Catalan is covered only by its test (`:3636`). No render shows it.

### Fixed, still waiting on a device or a person (12): `device-check`
| ID | Title | Package | Test | What's left |
|---|---|---|---|---|
| WEB-1308 | Typing on a phone: Done sits 286 px below | WP69 | `tests/ux-web-voice.spec.ts:3223`, `:3280`, `:3298`, `:3326` | A real phone keyboard open over the box (Android Chrome, iPhone Safari) |
| WEB-1315 | A demo try that fails on our side is spent | WP263 (WD30) | `tests/ux-web-voice.spec.ts:3543`, `:3591`, `:3611`; `tests/voice-store.integration.ts:204` | After a deploy, the owner checks that a real AI failure gives the try back |
| WEB-1401 | Free and Pro answer is one 110-word block | WP70 | `tests/ux-web-features.spec.ts:1392`, `:1420`, `:1484`, `:1496` | A native Spanish and Catalan read of the split sentences |
| WEB-1403 | The notes answer suggests dictating a password | WP70 | `tests/ux-web-features.spec.ts:1452` | A native Spanish and Catalan read |
| WEB-1404 | The site never says tasks can repeat | WP264 (WD22) | `tests/ux-web-features.spec.ts:550`, `:849`, `:1594`, `:1610` | A native Spanish and Catalan read; the owner dictates «todos los lunes a las 9…» in the app |
| WEB-1508 | Play's one deletion address always opens in English | WP261 (WD27) | `tests/ux-web-global.spec.ts:1907`, the `:2048`–`:2338` block | After a deploy: an Android phone in Spanish, then Catalan, opens `/delete-account/`, chooses English and reopens; Play Console accepts the URL; a native read of privacy §8's new sentence, as part of the WD3 sign-off |
| WEB-1601 | Tabbing out of the open phone menu hides focus | WP71 | `tests/ux-web-global.spec.ts:1388`, `:1429`, `:1725` | Safari on a real iPhone, tapping outside the open menu |
| WEB-1602 | Android Back with the phone menu open leaves the site | WP71 | `tests/ux-web-global.spec.ts:1509`, `:1570`, `:1600`, `:1629` | Android Back on a real phone; an older Safari without `CloseWatcher` |
| WEB-1603 | Choosing English on the home can bounce back to Spanish | WP72 | `tests/ux-web-global.spec.ts:1781`, `:1806`, `:1907` | Back from the bfcache on a real phone |
| WEB-1606 | Two navigation landmarks named "Language" on desktop | WP72 | `tests/ux-web-global.spec.ts:1932` | NVDA's landmark list on desktop |
| WEB-1608 | High-contrast mode hides which language is current | WP72 | `tests/ux-web-global.spec.ts:1968` | A real Windows contrast theme |
| WEB-1612 | Each task heading reads "Complete X X" to screen readers (regression R1H-1) | WP266 | `tests/ux-web-completion.spec.ts:850`, `:956` | TalkBack in Spanish, moving by headings |

### Still open
- **WEB-1615** · S2 · H: the circle's tap area shrank to 24 px. This is regression R2H-1 of WP266 (WEB-1612), found in `verify-b2-r2-H.md`.
  - Before WP266, the whole 44 px row was a `<label>`. Now only two things tick the task: the 24 × 24 transparent input (`top: 10px`, `src/styles/voice.css:503-513`) and the title's own text.
  - Taps on the bands above and below the circle, in the 12 px gap, or to the right of a short title do nothing. The hand cursor still shows over that space (`voice.css:501`).
  - The reviewer's fix is CSS only:
    - give `.voice-task-toggle input` `top: 0`, `width: 36px` and `height: 100%`;
    - give `.voice-task-card h4` `flex: 1`;
    - or drop `cursor: pointer` from the toggle instead.
  - To verify: on `voice-result`, mobile and desktop, clicks at the row's corners, in the gap and at the row's right end each toggle the checkbox. The WP266 geometry tests (`tests/ux-web-completion.spec.ts:889-901`) must still pass.
  - AUDIT can't measure it: `tests/support/ux-collect.ts:628-632` skips opacity-0 inputs, so its "Under 44 px: 0" doesn't count as a pass here.
- These stay `open` from earlier, with no package in this run:
  - WEB-1406: WD26, at the pre-launch re-render of the app's images.
  - WEB-1610: WD31, a launch-checklist item.

### Escalations
None.

### Device and person checks for the owner
- **WD3 sign-off** of legal version 2026-11-01 (tracked on WEB-1502). It now also covers WP261's new sentence in privacy §8 (WEB-1508). The version date was correctly kept at 2026-11-01.
- **Native reads, in Spanish and Catalan:**
  - the Free/Pro split (WEB-1401);
  - "a gift idea" (WEB-1403);
  - the repeat answer (WEB-1404);
  - privacy §8's new sentence (WEB-1508).
- **The owner in the app:** dictate «todos los lunes a las 9…» (WEB-1404).
- **After a deploy:**
  - an Android phone in Spanish, then Catalan, opens `https://taskflow.garbar.tech/delete-account/`, then English and reopen (WEB-1508);
  - Play Console's Data safety form accepts `/delete-account/` (WEB-1508);
  - a real AI failure gives the demo try back (WEB-1315).
- **Real phones and browsers:**
  - a phone keyboard over the typing box (WEB-1308);
  - Safari on an iPhone tapping outside the menu (WEB-1601);
  - Android Back on the open menu, and older Safari without `CloseWatcher` (WEB-1602);
  - bfcache Back after choosing English (WEB-1603).
- **Screen readers:**
  - TalkBack in Spanish moving by headings in the demo result (WEB-1612);
  - NVDA's landmark list (WEB-1606).
- **Forced colours:** a real Windows contrast theme (WEB-1608).

### Files changed
**Website.** The fix-run base `refs/ux-web/base` (afc359e, 2026-11-01 20:15) has the same tree as HEAD (3cce980, batch b1's commit). The only exception is `test-results-renders/.last-run.json`, which is render output. `git status --porcelain` shows no untracked website files. So none of the changed files held another session's uncommitted work when the run started, and the main session can commit the whole of each one.
- Source:
  - `src/components/VoiceDemo.tsx`, `HomePage.tsx`, `Header.tsx`, `Footer.tsx`, `Icon.tsx`, `LanguageSwitch.tsx`, `NotFoundPage.tsx`
  - `src/app/not-found.tsx`, `src/proxy.ts`
  - `src/content/site/{types,en,es,ca,index}.ts`
  - `src/content/legal/{en,es,ca}.ts`
  - `src/lib/voice/policy.ts`, `src/lib/voice/store.ts`
  - `src/styles/global.css`, `src/styles/legal.css`, `src/styles/voice.css`
  - `README.md`
- Tests:
  - `tests/ux-web-global.spec.ts`, `ux-web-voice.spec.ts`, `ux-web-completion.spec.ts`, `ux-web-features.spec.ts`, `ux-web-home.spec.ts`, `ux-web-frame.spec.ts`, `ux-renders.spec.ts`
  - `tests/voice.spec.ts`, `website.spec.ts`, `voice-store.integration.ts`, `voice.unit.ts`
  - `tests/support/ux-voice.ts`, `tests/support/ux-web-copy.ts`
- **The delegation's file list misses 6 files** that `git diff refs/ux-web/base` shows changed. They belong in the batch commit:
  - `src/content/legal/{en,es,ca}.ts` and `src/content/site/index.ts`: WP261 (privacy §8 and `followsVisitor`), cited in verify-b2-r1-L.md;
  - `tests/voice-store.integration.ts` and `tests/voice.unit.ts`: WP263's store tests (WEB-1315's test is at `voice-store.integration.ts:204`).
  The main session should check these hunks are the run's own before staging them.
- Don't commit `test-results-renders/`: it is render output.

**Loop records:**
- `.claude/ux-web/ISSUES.md`: 26 lines moved, and WEB-1615 added.
- `.claude/ux-web/runs/2026-10-28-site/`:
  - `plan.md` (Round 2 appended)
  - `plan-b2-r2.json`
  - `verify-b2-r1-H.md`, `verify-b2-r1-F.md`, `verify-b2-r1-G.md`, `verify-b2-r1-L.md`, `verify-b2-r2-H.md`, `verify-b2-r2-G.md`
  - `report-b2.md` (saved by the main session)

### Rounds
- **Round 1** (`plan.json`): 10 packages, all done, in 2 waves.
  - Packages: WP68, WP69, WP70, WP71, WP72, WP73, WP261, WP262, WP263, WP264.
  - Tests passed.
  - The verifiers (H, F, G, L) read all 23 findings as fixed.
  - Regressions:
    - R1H-1 (S2, the task heading's name): became WEB-1612.
    - R1H-2 (S1, a typed last try hides its text): became WEB-1613.
    - R1G-1 (S1, the footer legal row outranks the site links): became WEB-1614.
- **Round 2** (`plan-b2-r2.json`): 2 packages, both done, in 1 wave.
  - WP266 fixed WEB-1612 and WEB-1613. WP267 fixed WEB-1614.
  - Tests passed.
  - The verifiers (H, G) read all 3 as fixed. WEB-1309 stays fixed.
  - Regression R2H-1 (S2, the circle's tap area): became WEB-1615. It is open, with no round 3 in this batch.
