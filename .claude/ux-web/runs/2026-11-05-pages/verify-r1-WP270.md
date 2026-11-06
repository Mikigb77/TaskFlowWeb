# Verify — run 2026-11-05-pages, round 1, WP270 (area L) — 2026-11-05

Package copy: `/root/.taskflow-tools/wt/2026-11-05-pages-r1-WP270`. Read: `waves.py diff` (en/es/ca.ts:126, docs/LEGAL_RELEASE.md:37-38, new tests/ux-web-legal-meetings.spec.ts), the app repo at b9d1589 (and `Backend/core/meetings.py` on origin/main), and the tester's privacy renders (09:47-09:48 UTC, after the content change at 09:29) against the pre-run renders in the main checkout. I ran no npm or Playwright; crops were made with Pillow in the scratchpad.

**Verdict:** Ship. All three findings are fixed with the brief's exact copy. One new S1 gap: the new 7-day sentence leaves out the quiet-Stop case.

## Findings

**WEB-1901 · fixed**
- `src/content/legal/{en,es,ca}.ts:126`: the bullet matches the brief's text exactly. A script compared it with plan.json's copy, and all three files hit line 126.
- The 7-day sentence now names the case where the recording was cut before Stop, and counts the 7 days from the app's question:
  - EN: "stopped before you pressed Stop … 7 days after the app asks you about it"
  - ES: «se cortó antes de que pulsaras Parar»
  - CA: «s’ha tallat abans que premessis Atura»
- These are the app's own words (`meetingStoppedCut`: `app_en.arb:4114`, `app_es.arb:1447`, `app_ca.arb:1151`; `meeting.dart:10-12`, phase `interrupted`).
- The 7 days count from `askedAt` (`meeting_store.dart:37-38, 696-711`).
- The CA bullet now says «Reunions enregistrades» / «Un enregistrament», as `app_ca.arb:1132, 1138` do.
- Renders: the ES 390 px bullet ends on «borra sus reuniones.» (3 words). The CA 390 px bullet ends on «reunions.» alone. Before WP270, the CA bullet also ended on «reunions.» alone (pre-run `privacy.ca.mobile.light.full.png`, y≈11760), so the change didn't cause it. At 320 px, ES ends on «reuniones.» alone, as it did before.
- Text at 200% (CA) reflows cleanly.
- See R1-WP270-1 for the remaining case.

**WEB-1902 · fixed**
- New sentence: "Whatever is left of a meeting on our server, finished or not, is deleted 30 days after its last piece arrived." (ES «terminada o no», CA «acabada o no»).
- Backend source: `sweep()` (origin/main `Backend/core/meetings.py:642-647`) deletes on `last_piece_at < cutoff OR ready_at < cutoff`. `ready_at` is never earlier than the last piece, so 30 days after the last piece is the outer limit, and the sentence is true.
- LEGAL_RELEASE.md:38 now says "finished or not" and covers unacknowledged final notes.

**WEB-1903 · fixed**
- New sentence: "Discarding a meeting deletes it from your phone at once, and from our server as soon as your phone is online." (ES «en cuanto el teléfono tiene conexión», CA «tan bon punt el telèfon té connexió»).
- App source: `meeting_store.dart:713-740` (audio gone, phase `discarding`), retried by `meeting_uploader.dart:164`.
- LEGAL_RELEASE.md:37 updated as the brief asked.
- No legal file keeps "on our server at once" or its ES or CA wording (tester's file-scan test).

Other checks:
- §4 (`en.ts:56`) is consistent with the new §7.
- Version is unchanged (2026-11-05; `company.json` untouched).
- `git status` in the copy lists only this run's files.

## Regressions

**R1-WP270-1 · Severity 1 · 7-day rule omits the quiet-Stop case**
- Where:
  - `src/content/legal/{en,es,ca}.ts:126`, the 7-day sentence, on /privacy/, /es/privacy/ and /ca/privacy/;
  - `docs/LEGAL_RELEASE.md:38`.
- What happens:
  - The app has a second case. After Stop, when a recording of a minute or more was nearly all silence, `stopQuiet()` (`meeting_store.dart:668-681`, called from `meeting_recorder.dart:551`) puts the meeting in phase `interrupted`.
  - The app then asks «Almost nothing was heard. Make notes anyway?» (`app_en.arb:4076`). Left unanswered, `autoFinishStale()` makes it a note 7 days later.
  - The new sentence ("stopped before you pressed Stop") excludes this case. The old, wrong "you stop but don’t finish" loosely covered it.
  - Review L's WEB-1901 named this case, but its fix copy left it out.
  - The case is rare, the outcome is benign (a note the person can delete), and nothing on the server is kept longer.
- Fix (subtract the cause; both cases are "a recording the app asks you about"):
  - EN: "A recording the app asks you about, and that you leave unanswered, becomes a note 7 days after it asks."
  - ES: «Una grabación por la que la app te pregunta, y que dejas sin responder, se convierte en una nota 7 días después de que te pregunte.»
  - CA: «Un enregistrament pel qual l’app et pregunta, i que deixes sense resposta, es converteix en una nota 7 dies després que te’n pregunti.» Needs a native Catalan read.
  - LEGAL_RELEASE.md:38: add "or a Stop on a recording judged nearly all silent (`stopQuiet`)".
  - The test's STOP check in `tests/ux-web-legal-meetings.spec.ts` would then change.
  - Alternatively, the owner may accept the current wording, since the quiet case follows a Stop the person chose.
- Evidence: verified in code (app repo).

## Device checks still open
- A native Spanish read and a native Catalan read of the new bullet («dejas sin responder», «te’n pregunti», «tan bon punt»).
- On a real phone: press Discard in airplane mode, then go online, and check the meeting is gone from the server.
- On a real phone: check an interrupted recording becomes a note 7 days after the question.

## Memory notes
- Legal list items (`.legal-body li`) have no `text-wrap: pretty`. CA §7 «reunions.» and ES 320 px «reuniones.» end on one word, before and after WP270. WP271's fix covers only `.legal-summary p`.
- Verify technique: to find a changed paragraph in a tall full render, compare the before and after PNGs row by row to get the first differing y, then crop. Text-200 renders can differ earlier from noise, so place the crop by its ratio down the page.
- The app has two "stopped, waiting for an answer" cases (phase `interrupted`): cut before Stop (`meetingStoppedCut`) and quiet Stop (`stopQuiet`, `meetingStoppedQuiet`). Any site claim about the 7-day note has to cover both.
