## UX web verify — run 2026-10-28-site, batch b2, round 1, area H — 2026-11-01

**Verdict:** Ship after fixes. All ten findings are fixed; one regression (S2) makes each task card's heading read its title twice, with “Complete” in front, to a screen reader.

**Evidence used:** code (run diff via `ux-web.sh diff`), the renders re-made 2026-11-02 01:15 UTC (newer than every changed source file), `AUDIT.md` §3 and §13, and the ARIA snapshots in `artifacts/ux-web/aria/`. Chromium only; no device.

### Findings

| ID | Result | Evidence |
|---|---|---|
| WEB-1202 | fixed | `src/content/site/{en,es,ca}.ts:48-49` are the brief's exact text, ™ on the first Android. `home.es.mobile.light.fold.png` and `home.ca.mobile.dark.fold.png`: “Una app para móviles Android™:” / “Una aplicació per a mòbils Android™:” open line 1 of the paragraph. Catalan now has «posa cadascuna al seu dia». |
| WEB-1206 | fixed | `grep` of `src/` finds no «Muy pronto»/«Molt aviat». es.ts:7, :23, :52, :137, :203 and ca.ts:7, :23, :52, :143, :210 read the brief's strings. `home.es.mobile-w320.light.full.png` (cropped): the closing title wraps «Próximamente en / Android.» between words; `AUDIT.md` §3: w320 rows, no overflow, in all three languages. |
| WEB-1207 | fixed | No `.»` in `src/content/site/`; es.ts:54, :153 and ca.ts:54, :159 read «Mañana, llamar al dentista y comprar pan» / «Demà, trucar al dentista i comprar pa»; `home.es.desktop.light.fold.png` shows the quote card without a full stop. English unchanged (en.ts:54, :153). |
| WEB-1308 | fixed | `VoiceDemo.tsx:1053-1150`: typing mode is label, box, counter, `<Verification>` (one position, shared by both modes), tap line / failure, ‘One moment…’, Done, privacy, Pro note, Talk instead, fine print; voice mode keeps privacy before the check. `voice-typing.en.mobile.light.panel.png`: Done about 40 px under the counter. `showDone` scrolls Done into view on focus and on `visualViewport` resize. AUDIT §13 voice-typing rows: 0 axe. Real phone keyboard: device check. |
| WEB-1309 | fixed | en/es/ca `errors.offline` and `errors.sayAgain` are the brief's exact copy (en.ts:227, :245; es.ts:229, :248; ca.ts:236, :255); AUDIT §13 voice-offline and voice-error-previous-failure alerts read them. `VoiceDemo.tsx:1278-1284` renders `details.voice-transcript` only when `mode === "voice"`; `voice-no-tasks` (typed) panel has none, `voice-result` (spoken) has it. |
| WEB-1303 | fixed | `noTasks` in all three files equals the app's `captureNoTasks` (`../TaskFlow/App/lib/l10n/app_en.arb:1763`, `app_es.arb:891`, `app_ca.arb:706`) plus the demo clause; types.ts:174 comment updated; `voice-no-tasks.en.mobile.light.panel.png` shows it as the stage heading; no old sentence left in `src/`. |
| WEB-1306 | fixed | `VoiceDemo.tsx:1206-1226`: native checkbox with `aria-label` from `completeTask` (= app's `completeNamedTask`, `app_en.arb:2028`), `aria-hidden` circle after it; `voice.css:491-553`: 24 px circle, 2 px `--field-edge`, green fill and check only when checked, focus ring on the circle, forced-colours rule. `voice-result.en.mobile.dark.panel.png` shows round circles. AUDIT §13 voice-result rows: 0 axe, 0 small targets. See R1H-1 for the heading name. |
| WEB-1307 | fixed | `VoiceDemo.tsx:35-59`: Today/Tomorrow by the visitor's clock, then ` · ` and the time; `today`/`tomorrow` keys match the app (`app_*.arb` today/tomorrow). `voice.css:584-603`: date line and question at 1rem, date ink, icon green (render shows it). |
| WEB-1315 | fixed | `store.ts` `admit` writes `attemptAt` only outside a developer window; `finish` reads the visitor with the job and month and, with no result, removes that one entry through `withoutTry` (`policy.ts:59-67`); a `tasks: []` result keeps the try. `errors.invalidDraft` no longer mentions a try (en.ts:239-240, es.ts:242-243, ca.ts:249-250); `noTasks` still ends ‘That used a try.’; README:185 says the brief's sentence. AUDIT §13 voice-error-invalid-draft alert reads the new copy. Real-service failure: owner check. |
| WEB-1209 | fixed | `HomePage.tsx:29` `<p className="hero-free">` right after the status; `global.css:414-419` same size, line height and colour as `.hero-status`, 4 px under; copy equals `closing.plans`' first sentence in each language; types.ts:58 comment. `home.es.mobile.light.fold.png`, `home.ca.mobile.dark.fold.png`, `home.es.desktop.light.fold.png`: the free line is inside the first viewport; no ‘Pro’ in the hero. At 320 × 568 it falls below the fold (`home.ca.mobile-w320.light.fold.png`), which the brief allows. |

### Regressions

**R1H-1 · Severity 2 · Each task heading reads “Complete X X”**
- Where: `src/components/VoiceDemo.tsx:1205-1226` (the `<h4>` wraps the `<label>` with the checkbox and its new `aria-label`), demo result, all languages; `artifacts/ux-web/aria/voice-result.en.txt:9,15,21`.
- What happens: the ARIA snapshot gives `heading "Complete Doctor appointment Doctor appointment" [level=4]`. A screen-reader user moving by headings (NVDA H, TalkBack headings) hears every task as a command with its title twice; in Spanish «Completar Llamar al dentista Llamar al dentista». The new `aria-label` is what adds “Complete” to the heading's name.
- Why it fails: headings must describe their section (WCAG 2.4.6, AX-5); the name should be the title alone.
- Fix: take the control out of the heading: in the card, put the `<input type="checkbox" id="task-{index}" aria-label="Complete {title}">` and the circle span before the heading, and make the heading `<h4><label htmlFor="task-{index}" className="voice-task-title">{title}</label></h4>`, so tapping the title still ticks, the checkbox keeps “Complete {title}”, and the heading is only the title. Keep the 24 px circle, the 44 px row and the layout.
- Verify: ARIA snapshot shows `heading "Doctor appointment" [level=4]` and `checkbox "Complete Doctor appointment"`; clicking the title still ticks; `tests/ux-web-completion.spec.ts` passes; axe 0.
- Evidence: measured (Playwright ARIA snapshot, Chromium); TalkBack in Spanish is a device check.

**R1H-2 · Severity 1 · A typed last try hides what was typed**
- Where: `src/components/VoiceDemo.tsx:1260-1284`.
- What happens: the transcript now shows only for spoken results, on the grounds that ‘Change the text’ shows a typed one; but when the allowance is used, ‘Change the text’ isn’t rendered (the tries-used line replaces it). After a typed third try, notably with no tasks found (“Say what and when…”), the visitor has no way to see the sentence that failed.
- Fix: render the transcript when `mode === "voice" || allowanceUsed`.
- Verify: typed result with `remaining: 0` and 0 tasks shows `details.voice-transcript`; a typed result with tries left still has none.
- Evidence: verified in code; no render covers a typed last try.

### Checked and fine
- Voice-mode order unchanged; `<Verification>` stays at one position, so switching modes doesn't remount it (code).
- No overflow at 320 px or 200% text on the three homes (`AUDIT.md` §3).
- No other string in `src/` says a failed request used a try; `recording` and `timeout` still promise no try, now consistent with the server.
- The phone menu's last row uses `frame.comingSoon` («Próximamente en Android» / «Properament a Android»).
