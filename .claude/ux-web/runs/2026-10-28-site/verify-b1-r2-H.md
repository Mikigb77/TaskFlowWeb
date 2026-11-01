## UX web verify — run 2026-10-28-site, round 2, area H (WP265) — 2026-11-01

**Verdict:** Ship. WEB-1611 is fixed; no regressions in `src/styles/voice.css` or the demo states it touches.

### WEB-1611 · fixed
- Code: `src/styles/voice.css:307-322`. `.voice-level` now has `color: var(--green)`, `background: transparent` and `border: 2px solid var(--green)`. The 80 × 80 box, the 50% radius, the single-layer `box-shadow` halo (9 px to 30 px) and the `transition: box-shadow 90ms linear` are unchanged. The comment matches the brief word for word. The reduced-motion `.voice-level { transition: none; }` is unchanged at `:648-650`.
- Untouched, as the brief asked: `src/components/VoiceDemo.tsx:965-973` (the span is still `aria-hidden="true"`, with its ref and `<Icon name="mic" size={32} />`, no tabindex), and `.voice-record-button` and `.is-recording`. Done is still the filled worded button.
- Renders (made 19:45, after the CSS change at 19:21):
  - `voice-recording.en.mobile.light.panel.png`, `voice-recording.en.mobile.dark.panel.png` and `voice-recording-50s.en.desktop.dark.panel.png` show an outlined green ring with a line microphone on the panel, inside the mint halo, above a filled "Done".
  - `voice-capture.en.mobile.light.panel.png` shows a filled green disc with a white microphone and "Tap to talk".
  - The two states no longer look alike, and the listening circle matches the app's outline mic in a ring.
- Measured: `AUDIT.md` §13 rows 998-1005 (voice-recording and voice-recording-50s, desktop and mobile, light and dark) are 0 everywhere: axe, 2.5.8, under 44 px, contrast, control fails, unnamed. Focus is on `button#voice-record` "Done".
- Tests (tester): the WP265 block (`tests/ux-web-voice.spec.ts:3098`) passes on /, /es/ and /ca/, desktop and mobile, light and dark. The WEB-1305, WEB-1304 and WEB-1302 tests pass unchanged.
- Left for a device:
  - A first-time tester on /es/ stops with «Listo» on the first try.
  - Forced colours. Inferred from the code: the transparent fill and the 2 px border should survive forced colours better than the old filled disc did, since forced colours would have dropped the fill. Not yet seen on a device.

### Regressions
None. The other hunks in `voice.css` that the run diff shows (the `.voice-trial-badge` wrap, `aria-disabled` focus, `.voice-plans` alignment) belong to other packages in this run. They are outside WP265 and I didn't judge them here.

### Note (not a regression)
The ring is still an 80 px circle with a microphone, in the same place as "Tap to talk". A visitor might still read it as an outline (ghost) button. It is now clearly a different element from the filled record button, and it is drawn the way the app draws it. Whether visitors try to tap it is the device check above.
