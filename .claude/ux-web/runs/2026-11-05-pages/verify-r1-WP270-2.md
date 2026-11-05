# Verify — run 2026-11-05-pages, round 1, WP270 (area L), check 2 — 2026-11-05

Package copy: `/root/.taskflow-tools/wt/2026-11-05-pages-r1-WP270`. Read: `waves.py diff` (en/es/ca.ts:126, docs/LEGAL_RELEASE.md:37-38, tests/ux-web-legal-meetings.spec.ts), the app repo at b9d1589 (`meeting_store.dart`, `meeting.dart`, `meeting_controller.dart`, the ARBs), and the tester's privacy renders in the copy (09:58-09:59 UTC, after the content change at 09:52) against the pre-run renders in the main checkout. I ran no npm or Playwright. I made the crops with Pillow in the scratchpad.

**Verdict:** Ship. All three findings are still fixed, and R1-WP270-1 is fixed. One new S1 polish point: on a 390 px phone, the Spanish bullet now ends on a single word, «reuniones.».

## Findings

**WEB-1901 · fixed**
- `src/content/legal/{en,es,ca}.ts:126`, the 7-day sentence:
  - EN: "A recording the app asks you about, and that you leave unanswered, becomes a note 7 days after it asks."
  - ES: «Una grabación por la que la app te pregunta, y que dejas sin responder, se convierte en una nota 7 días después de que te pregunte.»
  - CA: «Un enregistrament pel qual l’app et pregunta, i que deixes sense resposta, es converteix en una nota 7 dies després que te’n pregunti.»
- This is check 1's R1-WP270-1 copy, word for word.
- The old wrong case, "stop but don’t finish", is gone.
- The 7 days count from the app's question. In the code, `autoFinishStale()` runs only on phase `interrupted`, from `askedAt` (`meeting_store.dart:699-711`), and `markAsked()` sets `askedAt` once, when the app first shows the recording (`:686-693`, `meeting_controller.dart:211`).
- The phase `interrupted` holds both cases the app asks about:
  - a recording cut before Stop (`meeting.dart:10-12`, `meetingStoppedCut`);
  - a quiet Stop (`stopQuiet()`, `meeting_store.dart:671-681`, `meetingQuietQuestion`).
- The other held states (`meetingProRequired`, `meetingAllowanceUsed`, `meetingNotesExpired`, `app_en.arb:4235-4406`) are statements, not questions, so the wording doesn't overreach.
- Plan acceptance 3 asked for ‘pressed Stop’ / «pulsaras Parar» / «premessis Atura». R1-WP270-1 replaced that check on purpose. The test now checks the opposite: the sentence names the app's question (`ASKS`) and not Stop (`tests/ux-web-legal-meetings.spec.ts:40-42, 75-76`). The organizer should read acceptance 3 as superseded.
- Renders (copy, `privacy.{es,ca}.mobile.light.full.png`, `…mobile-w320…`, `privacy.es.mobile-text200.light.full.png`):
  - The bullet stays inside the column.
  - At 200% text it reflows without clipping.
  - At 320 px, both ES and CA end on two or more words («sus reuniones.», «n’esborra les reunions.»). Before, ES ended on «reuniones.» alone.
  - CA at 390 px now ends on «n’esborra les reunions.». Before, it ended on «reunions.» alone.

**WEB-1902 · fixed**
- The bullet's text is unchanged since check 1: "Whatever is left of a meeting on our server, finished or not, is deleted 30 days after its last piece arrived." (ES «terminada o no», CA «acabada o no»).
- The text is true of `sweep()` (origin/main `Backend/core/meetings.py:642-647`).
- `LEGAL_RELEASE.md:38` keeps "finished or not" and the final notes the app never acknowledged.

**WEB-1903 · fixed**
- The Discard sentence is unchanged since check 1: "…from your phone at once, and from our server as soon as your phone is online." It is true of `meeting_store.dart:713-740` (phase `discarding`) and of the retry.
- `LEGAL_RELEASE.md:37` is as briefed.
- The tester's scan test finds no old wording.

Other checks:
- The diff touches only line 126 of each legal file, and lines 37-38 of `LEGAL_RELEASE.md`.
- `company.json` is untouched. The version is still 2026-11-05, and `LEGAL_RELEASE.md:3` reads "5 November 2026".
- WP271 is already merged into the main checkout (`merges.jsonl`), and on other lines, so line 126 merges cleanly.
- `git status` in the copy lists only this run's files.
- The implementer's run reports that every ux-web-legal-meetings test passed. The one failure there is WEB-1502, from before this package; WP271's merged `text-wrap: pretty` on `.legal-summary p` covers it.

## Regressions

**R1-WP270-1 · Severity 1 · 7-day rule omits the quiet-Stop case — fixed, no longer holds**
- In all three languages, the sentence now names the recordings the app asks about, which covers both the cut and the quiet cases (see WEB-1901).
- `LEGAL_RELEASE.md:38` names both cases, with `stopQuiet()`, phase `interrupted` and UX-2717. UX-2717 exists in `../TaskFlow/.claude/ux-review/ISSUES.md:51`, and the quoted question matches `app_en.arb:4076`.

**R1-WP270-2 · Severity 1 · Spanish meeting bullet ends on one word at 390 px**
- Where: `src/content/legal/es.ts:126`, on /es/privacy/ §7, on the mobile 390 × 664 render (copy, `artifacts/ux-web/privacy.es.mobile.light.full.png`, y≈12060-12380). The dark theme has the same wrap.
- What happens: the bullet's last line is «reuniones.» alone, under «conexión. Eliminar tu cuenta borra sus».
- The change caused it: check 1's copy ended on «borra sus reuniones.». At 320 px and at 200% text, the line ends on «sus reuniones.».
- Legal list items (`.legal-body li`, `src/styles/legal.css:223-224`) have no `text-wrap`. WP271 added it only to `.legal-summary p`.
- This is the same kind of issue as WEB-1105 and WEB-1609, which were S1.
- Fix: in `es.ts:126`, put a no-break space between «sus» and «reuniones.» («Eliminar tu cuenta borra sus reuniones.»). WEB-1609 did the same with `Google LLC.`.
  - The change stays on this package's line.
  - The test's `toHaveText` normalises the no-break space, so `BULLET.es` still matches.
  - Alternative: add `text-wrap: pretty` to `.legal-body li` (`legal.css:224`), as `.legal-summary p` has it. That changes every legal list, outside this package's files, so it's the organizer's call.
- Verify: on the ES mobile render (light and dark), the bullet's last line has two words or more.
- Evidence: seen in a current render (Chromium).

## Device checks still open
- A native Spanish read and a native Catalan read of the new 7-day sentence («por la que la app te pregunta… de que te pregunte», «pel qual l’app et pregunta… que te’n pregunti»), and of the rest of the bullet.
- On a real phone: press Discard in airplane mode, then go online, and check the meeting is gone from the server.
- On a real phone: check that an interrupted recording becomes a note 7 days after the app first asks. Do the same for a quiet Stop that is left unanswered.

## Memory notes
- Privacy §7's meeting bullet now covers every `interrupted` meeting as "a recording the app asks you about". A future claim about the 7-day note should keep this framing, not name Stop.
- A copy fix on a legal list item can create or remove a one-word last line, because `.legal-body li` has no `text-wrap`. Check the 390 px and 320 px renders of each changed language after every legal copy change.
