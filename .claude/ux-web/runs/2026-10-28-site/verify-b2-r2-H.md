## UX web verify — run 2026-10-28-site, round 2, area H (WP266) — 2026-11-01

**Verdict:** Ship after one small fix: both findings are fixed; the new layout shrank the circle's tap area (R2H-1).
**Evidence:** code (`src/components/VoiceDemo.tsx`, `src/styles/voice.css`, content files), Chromium renders and ARIA snapshot made 02:28–02:52 on 2026-11-02, after the code changed (02:08), and `AUDIT.md` §13. The testers reported no results; the acceptance tests exist (`tests/ux-web-completion.spec.ts:842-`, `tests/ux-web-voice.spec.ts:3620-`), but I didn't see them pass.

### WEB-1612 — fixed
- `VoiceDemo.tsx:2` imports `useId`; `:317` `const taskId = useId();`.
- `:1192-1234`: `div.voice-task-toggle` keeps both capture handlers and their comment, and holds the checkbox (`id={taskId-index}`, same `aria-label`, `checked`, `onChange`), then `span.voice-task-circle` (aria-hidden), then `<h4><label htmlFor=… className="voice-task-title">{task.title}</label></h4>`. The input is still the circle's previous sibling, so `:checked + `, `:focus-visible + ` and forced-colours rules match (`voice.css:530-552`).
- `voice.css:485-491` h4 margin 0 and min-width 0, size 1.125rem kept; `:494-502` toggle `margin: 0 0 8px`; `:553-558` title `display: block; cursor: pointer`.
- `artifacts/ux-web/aria/voice-result.en.txt:8-20`: `checkbox "Complete Doctor appointment"` then `heading "Doctor appointment" [level=4]`, and likewise for the other two. No heading's name has the “Complete” prefix any more.
- Renders `voice-result.en.mobile.light.panel.png` and `voice-result.en.desktop.dark.panel.png`: the circle, title and date line sit where they did. `AUDIT.md` rows 1041-1044: axe 0, nothing unnamed.

### WEB-1613 — fixed
- `VoiceDemo.tsx:1284-1293`: `details.voice-transcript` renders when `mode === "voice" || allowanceUsed`. The summary is `t.seeWhatISaid` for voice and `t.originalText` otherwise, and the comment is updated.
- `types.ts`: `originalText` comes right after `seeWhatISaid`, with the brief's comment. en/es/ca: `Original text` / `Texto original` / `Text original`, matching `../TaskFlow/App/lib/l10n/app_en.arb:19`, `app_es.arb:10`, `app_ca.arb:10` (`reviewOriginalText`).
- Typed with tries left: ‘Change the text’ shows and the details don't (the condition is false), so WEB-1309 stays fixed.
- Render `voice-last-try.en.mobile.light.panel.png` (typed, 0 tries left): the tries-used line, then ‘Original text’. `AUDIT.md` 1061-1062: axe 0.
- Not seen in a render: the 0-task typed last try in ES/CA, which is covered only by the new test at `tests/ux-web-voice.spec.ts:3636`.

### Regressions

**R2H-1 · Severity 2 · The circle's tap area shrank from the whole row to 24 px**
- Where: `src/components/VoiceDemo.tsx:1192-1234`, `src/styles/voice.css:494-513, :485-491`; the demo result on `/`, `/es/`, `/ca/`, every viewport and theme.
- What happens: before WP266, a `<label>` was the whole row, so a tap anywhere on the 44-px-tall, card-wide row ticked the task. Now the only targets are:
  - the transparent input, 24 × 24 at `top: 10px` (`voice.css:503-513`);
  - the title label, which is only as wide as its text, because the h4 is a flex item without `flex: 1`.
- So these taps now do nothing:
  - the 10 px bands above and below the circle;
  - the 12 px gap between the circle and the title;
  - everything right of a short title. On desktop, “Buy coffee” is about 90 px wide in a card about 530 px wide (`voice-result.en.desktop.dark.panel.png`).
- On desktop, `.voice-task-toggle` still has `cursor: pointer` (`voice.css:501`), so the hand cursor shows over that dead space.
- The moment: a newcomer aims a thumb at the circle, lands just under it, and nothing happens: “Didn't it work?”
- Why it fails:
  - CT-8: taps are least accurate away from the centre, with errors of about 7–12 mm.
  - TaskFlow's 44 px target bar (CT-6). The input meets WCAG 2.5.8's 24 px, but no longer TaskFlow's bar, as it did before this change.
  - `AUDIT.md` can't show it: `tests/support/ux-collect.ts:628-632` counts opacity-0 inputs as hidden targets, so §5 and §13 never measure the checkboxes. Its “Under 44 px: 0” isn't a pass.
- Fix (CSS only; the markup and the circle's look stay):
  - make the input cover the circle's column for the row's full height: `.voice-task-toggle input { top: 0; width: 36px; height: 100%; }` (the 24 px circle plus the 12 px gap; the circle still draws at 10 px);
  - give `.voice-task-card h4` `flex: 1;` so the title label spans the rest of the row;
  - or, if that's preferred, drop `cursor: pointer` from `.voice-task-toggle` and keep it on the input and the title.
- Verify: in `voice-result`, mobile and desktop, clicks at the row's (x+4, y+2), (x+4, y+rowHeight−2), (circle right + 6, centre) and (row right − 4, centre) each toggle the checkbox. The existing WP266 geometry assertions (`tests/ux-web-completion.spec.ts:889-901`) still pass.
- Evidence: verified in code and render geometry. Not measured: the audit skips opacity-0 inputs.

No other regressions in the changed files.
