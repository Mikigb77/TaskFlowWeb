## UX web loop: run 2026-10-28-site, batch b1: close (2026-11-01)

**Verdict:** Ship. All 23 findings in WP63–WP67 and WP265 were read as fixed in the last round that checked them, and none of their tests failed. Round 1 caused one regression (R1H-1, filed as WEB-1611), and round 2 fixed it. Nothing was escalated. 15 findings are `verified`. 8 are `device-check`: fixed in code and locked by tests, but they still need a real phone or browser, a native read or the owner's legal sign-off (WD3).

### Verified (15)
| ID | Title | Package | Test |
|---|---|---|---|
| WEB-1201 | Centred hero pushes the button below the fold on laptops | WP67 | `tests/ux-web-home.spec.ts:411`, `:431`, `:474` |
| WEB-1203 | Hero and closing paragraphs are centred on phones | WP67 | `tests/ux-web-home.spec.ts:447`, `:502` |
| WEB-1204 | H1 accent is underlined like a link; splits on phones | WP67 | `tests/ux-web-home.spec.ts:568`, `:609` |
| WEB-1205 | Phone hero buttons: 50 px tall, 4 px apart stacked | WP67 | `tests/ux-web-home.spec.ts:535` |
| WEB-1304 | Starting a recording drops keyboard focus to the page | WP63 | `tests/ux-web-voice.spec.ts:2459` |
| WEB-1305 | While listening, nothing shows the demo hears you | WP63 (its look fixed in WP265, see WEB-1611) | `tests/ux-web-voice.spec.ts:2519`, `:2572` |
| WEB-1310 | "10 seconds left" stays until the minute ends | WP63 | `tests/ux-web-voice.spec.ts:2600` |
| WEB-1312 | Spanish and Catalan: a literal hint, two words for recording | WP63 | `tests/ux-web-voice.spec.ts:2644` |
| WEB-801 | Localized tries badge overflows at doubled phone text | WP63 | `tests/ux-web-voice.spec.ts:2684`, `:2714` (tests only: no render of the open demo at text200) |
| WEB-1301 | One failed AI call says "the live demo is off" | WP64 | `tests/ux-web-voice.spec.ts:2775`, `:2814`, `:2846`, `:2870` |
| WEB-1311 | The 10-second line promises half a minute; page waits 40 | WP64 | `tests/ux-web-voice.spec.ts:3007` |
| WEB-1504 | Desktop legal pages show two language switches | WP65 | `tests/ux-web-legal.spec.ts:1794`, `:1821`, `:1836`; `tests/legal.spec.ts` |
| WEB-1505 | Legal headings hyphenate: "com-pany", «condi-ciones» | WP65 | `tests/ux-web-legal.spec.ts:1870` |
| WEB-1503 | English terms: "dictation into tasks" and "AI capture" | WP66 | `tests/ux-web-legal.spec.ts:2115` |
| WEB-1506 | English privacy §8 has an extra, mislabelled link | WP66 | `tests/ux-web-legal.spec.ts:2135` |

Every verified finding is now locked by at least one test. WEB-1503 and WEB-1506 are part of legal version 2026-11-01. That version's WD3 sign-off is tracked on WEB-1502.

### Fixed, still waiting on a device or a person (8): `device-check`
| ID | Title | Package | Test | What's left |
|---|---|---|---|---|
| WEB-1302 | A recording can't be stopped without sending it | WP63 + WP66 | `tests/ux-web-voice.spec.ts:2410`, `tests/ux-web-legal.spec.ts:2101` | The owner's WD3 sign-off of version 2026-11-01; a native Spanish and Catalan read of the new §8 clause |
| WEB-1313 | Dismissing the microphone prompt sends people to browser settings | WP64 | `tests/ux-web-voice.spec.ts:3067` | Dismissing the real prompt in Chrome on Android and Safari on an iPhone (there's no render of this state) |
| WEB-1314 | On older Safari the wait never ends | WP64 | `tests/ux-web-voice.spec.ts:2930`, `:2947`, `:2969`, `:2991` | Safari on iOS 15 |
| WEB-1501 | Play's deletion link opens English; «Español» is off-screen | WP65 | `tests/ux-web-legal.spec.ts:1233`, `:1727`, `:1766` | «Español» in the first screen on a real phone, opened from the Play deletion link; a screen reader announcing the language navigation before the request |
| WEB-1502 | Privacy says words reach Google's AI only for tasks | WP66 | `tests/ux-web-legal.spec.ts:1985` block; `tests/legal.spec.ts` | The owner's WD3 sign-off of version 2026-11-01. This replaces the pending 2026-10-22 sign-off (WEB-1101) and covers WEB-1302, WEB-1503, WEB-1506, WEB-1507 and WEB-1509. A native Catalan read of the new clauses in summary 02, §2 and §4 |
| WEB-1507 | Privacy: files upload "when you use cloud backup" | WP66 | `tests/ux-web-legal.spec.ts:2074` | The WD3 sign-off; a native Catalan read of §2 |
| WEB-1509 | Privacy never says reminders aren't shared | WP66 (WD28) | `tests/ux-web-legal.spec.ts:2002` | The WD3 sign-off, which includes the new §5 sentence |
| WEB-1611 | The listening circle looks like the record button (regression R1H-1) | WP265 | `tests/ux-web-voice.spec.ts:3103` block | A first-time tester on /es/ with a phone stops with «Listo» on the first try (the 80 px outlined circle may still read as a ghost button); forced colours on a device |

WEB-204 was already `device-check`, and it stays there. WP65 moved the delete page's language switch to the top, in place of the back link, and hides the version line at 360 px and narrower. WEB-204's tests (`tests/ux-web-legal.spec.ts:938`, `:999`, `:1164`, `:1206`, `:1233`) still pass. Its ledger line now records this. It still needs a real 320 px phone and a screen reader.

### Still open
Nothing from this batch. The run's other packages belong to later batches, so their 25 findings stay `open` in the ledger: WP68–WP73, WP261 (WD27, WEB-1508), WP262 (WD23), WP263 (WD30, WEB-1315) and WP264 (WD22). WEB-1610 stays open as a launch-checklist item (WD31); no package builds it.

### Escalations
None.

### Device and person checks for the owner
- **WD3:** sign off legal version 2026-11-01 ("In force since 1 November 2026"). This covers WEB-1502, WEB-1302 (§8), WEB-1503, WEB-1506, WEB-1507 and WEB-1509 (§5).
- **Native reads:**
  - Catalan: the new clauses in summary 02, §2, §4 and §8.
  - Spanish: the new §8 clause.
- **Real phones:**
  - WEB-1501: «Español» in the first screen from the Play deletion link.
  - WEB-1313: dismissing the microphone prompt in Chrome on Android and Safari on an iPhone.
  - WEB-1314: Safari on iOS 15.
  - WEB-204: a 320 px phone on /es/delete-account/.
- **Screen readers:**
  - WEB-1501: the language navigation is announced before the request.
  - WEB-204: the hidden heading is announced.
- **People:** WEB-1611: a first-time tester on /es/ stops a recording with «Listo» on the first try.
- **Forced colours:** WEB-1611: the listening ring, on a real device.

### Files changed
**Website: 21 files, all this run's batch b1.** The fix-run base `refs/ux-web/base` (5fcae74) has the same tree as HEAD (1435082), and the round-2 note in `plan.md` says all modified files are b1's. None of them holds another session's uncommitted work, so the main session can commit the whole of each one.
- Source:
  - `src/components/VoiceDemo.tsx`, `src/components/LegalPage.tsx`
  - `src/content/site/{types,en,es,ca}.ts`
  - `src/content/legal/{en,es,ca}.ts`, `src/content/legal/company.json`
  - `src/lib/voice/recorder.ts`
  - `src/styles/global.css`, `src/styles/legal.css`, `src/styles/voice.css`
  - `docs/LEGAL_RELEASE.md`
- Tests: `tests/ux-web-voice.spec.ts`, `tests/ux-web-home.spec.ts`, `tests/ux-web-legal.spec.ts`, `tests/legal.spec.ts`, `tests/support/ux-voice.ts`
- The delegation's file list misses 7 of these files, which `git diff refs/ux-web/base` shows the run changed (WP63, WP66 and WP67): `src/content/legal/{en,es,ca}.ts`, `src/content/legal/company.json`, `docs/LEGAL_RELEASE.md`, `src/lib/voice/recorder.ts` and `src/styles/global.css`. They belong in the batch commit.
- The untracked folder `test-results-renders/` is render output. It shouldn't be committed.

**Loop records:**
- `.claude/ux-web/ISSUES.md`
- `.claude/ux-web/runs/2026-10-28-site/`:
  - `plan.md` (Round 2 appended)
  - `plan-b1-r2.json`
  - `verify-b1-r1-H.md`, `verify-b1-r1-L.md`, `verify-b1-r2-H.md`
  - `report-b1.md` (this report, once saved)

### Rounds
- **Round 1** (`plan.json`):
  - Packages, in two waves: WP63, WP65, WP66 and WP67 together, then WP64.
  - Tests passed.
  - Verify notes `verify-b1-r1-H.md` and `verify-b1-r1-L.md` read all 23 findings as fixed. The legal version line also has its own passing test (WP66-version).
  - One regression: R1H-1. The listening circle copied the idle record button pixel for pixel. It's filed as WEB-1611.
- **Round 2** (`plan-b1-r2.json`):
  - Package: WP265 (CSS only). It turns the circle into a transparent green ring with a line microphone, as the app draws it.
  - Tests passed. The tests for WEB-1305, WEB-1304 and WEB-1302 pass unchanged.
  - Verify note `verify-b1-r2-H.md` reads WEB-1611 as fixed, with no regressions.

### Notes for the main session (from the round-2 plan, not the site's fault)
- **Renders in the suite command:** the workflow's combined suite-and-renders line runs the renders in the source checkout, not the mirror. Its `rm -rf` then deletes the checkout's `artifacts/ux-web`.
- **Next.js build:** the first build stops with a `SecurityFatalError` advisory, and a retry builds. Upgrading Next.js is the owner's call; nothing was upgraded.
- **Cleanup:** `waves.py`'s drop calls `wsl`, which doesn't exist in this container. Before the batch commit, check for leftover WP65–WP67 worktrees and mirrors, and remove them with `webrun.py --remove <name>`.
