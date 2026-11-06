## UX web verify — WP271 (run 2026-11-05-pages, round 1, area L) — 2026-11-05

**Verdict:** Ship after one small fix. All six findings are fixed with the brief's exact copy. One new polish regression: in Spanish and Catalan §9, the new phrase puts two "y"/"i" in a row, so the list no longer shows where one item ends.

**Read:** the package's diff (`waves.py diff`, 5 files: `src/content/legal/{en,es,ca}.ts`, `src/styles/legal.css`, `tests/ux-web-legal.spec.ts`), the files in the worktree, the tester's renders (written 09:44–09:46 UTC, after the content and CSS changed at 09:29), `AUDIT.md` §1 and §3 there, and the app sources the brief cites. I did not run npm or Playwright.

### Findings

| ID | Result | Evidence |
|---|---|---|
| WEB-2001 | fixed | Terms §5 now has the brief's sentence in each language: `en.ts:235` "…before saving, sharing or relying on them.", `es.ts:235` «…antes de guardarlos, compartirlos o fiarte de ellos.», `ca.ts:235` «…abans de desar-los, compartir-los o refiar-te’n.». Privacy §4's last sentence (`:59`) is the brief's in EN, ES and CA. No file in `src/` still contains 'before saving or sharing', «antes de guardar o compartir» or «abans de desar/compartir» (grep). The §3 part is covered under WEB-1907. Matches the app: `../TaskFlow/App/lib/services/meeting_uploader.dart:380` saves notes with `store.saveNote` and no review step. |
| WEB-1904 | fixed | `ca.ts:10` «…que enregistres…», `:33` «Amb Pro, una reunió que enregistres:», `:56` «Amb Pro pots enregistrar… Mentre enregistres…», `:59` «abans d’enregistrar-la» (the general «no gravis tercers» is kept, as the brief says). §4 ¶2's list: `es.ts:56` «(un resumen, las cosas por hacer, las decisiones y las preguntas abiertas)», `ca.ts:56` «(un resum, les coses per fer, les decisions i les preguntes obertes)»; these match `app_es.arb:1506` and `app_ca.arb:1210`. Grep of `src/` finds no «gravar una reunió», «que graves», «Mentre graves», «abans de gravar-la», «tareas pendientes» or «tasques pendents». Dictation's «gravació» (§4 ¶1) and «micròfon per gravar» (§9) are kept. |
| WEB-1502 | fixed | `src/styles/legal.css:154` adds `text-wrap: pretty;` to `.legal-summary p`. Render `privacy.es.mobile.light.full.png` (y ≈ 560–750): card 02 ends on «grabas, con lo que dice cada persona.»; `privacy.ca.mobile.light.full.png` ends on «diu cadascú.»; the EN card ends on "record, with everyone’s words in it.". No one-word last line in any language. The tester's test at :2027 passes with its logic unchanged. Device-only: Safari on a real iPhone, where older Safari lacks `text-wrap: pretty`. |
| WEB-1906 | fixed | (a) §4 ¶3 (`:57`): "for a meeting, its text and notes" / «si es una reunión, su texto y sus notas» / «si és una reunió, el seu text i les seves notes». (b) §4 ¶4 (`:58`) now ends "…for caching, safety and abuse monitoring." (and ES/CA), while ¶3's "Google can process it outside the EU." and ¶4's "We do not promise zero retention or EU-only processing." are kept in all three. (c) Link labels (`:63`): «Condiciones específicas de Google Cloud, incluida Vertex AI» / «Condicions específiques de Google Cloud, inclosa Vertex AI»; EN "Google Cloud service terms, including Vertex AI" unchanged. |
| WEB-1905 | fixed | Summary 02 (`:10`) has only its last clause changed, to the brief's copy: "…a meeting you record, with everyone’s words in it." / «…una reunión que grabas, con lo que dice cada persona.» / «…una reunió que enregistres, amb el que hi diu cadascú.». The rest of the card is word for word the same (diff). Device-only: a native ES and CA read. |
| WEB-1907 | fixed | §9 (`:151`): "notifications for reminders and meeting recordings" / «notificaciones para recordatorios y grabaciones de reuniones» / «notificacions per recordar i per als enregistraments de reunions». This matches `../TaskFlow/App/lib/l10n/app_en.arb:4482` (`meetingNotifyAsk`). §3 (`:48`): "…for your review, and writes the notes of meetings you record; it does not…" and its ES and CA versions, exactly as the brief gives them. Meeting notes are outside "for your review". |

Scope kept: privacy §7 (`:126`, WP270's) is not in the diff, and neither is `company.json`, `docs/LEGAL_RELEASE.md` or `src/content/site/`. The version stays 5 November 2026 (renders: «En vigor desde el 5 de noviembre de 2026»). The test changes only update the expected text of SUMMARY_02, WP47_PRIVACY.third, WP54_GOOGLE and WP66_TERMS_KEPT, plus the acceptance block at the end.

Measured (`AUDIT.md` in the worktree, Chromium): §1 shows axe 0 on privacy and terms × EN/ES/CA × desktop/mobile × light/dark. §3 shows no sideways scroll and no clipped text for privacy and terms at text200 (desktop and mobile), zoom200 and w320. As AX-11 notes, automated checks find only part of the barriers.

### Regressions

**R1-WP271-1 · Severity 1 · ES/CA §9: two "y"/"i" in a row blur the list**
- Where: `src/content/legal/es.ts:151`, `src/content/legal/ca.ts:151`, privacy §9 (#permissions), /es/privacy/ and /ca/privacy/, every viewport.
- What happens: ES now reads «…micrófono para grabar, notificaciones para recordatorios y grabaciones de reuniones y los permisos pertinentes de archivos…», and CA reads «…notificacions per recordar i per als enregistraments de reunions i els permisos pertinents…». Before the change, the list had one "y"/"i" before its last item. Now there are two in a row, so the reader can't tell where one item ends. A first reading can also take it as «solicita … grabaciones de reuniones» (the app asks for meeting recordings). English avoids this with a comma ("…meeting recordings, and relevant file…").
- Why: plain, scannable legal copy (lens G). The change caused it: the phrase it adds ends in "y …"/"i …" right before the list's own last "y"/"i".
- Fix: add one comma before the list's last item, and change nothing else. ES `…notificaciones para recordatorios y grabaciones de reuniones, y los permisos pertinentes…` / CA `…notificacions per recordar i per als enregistraments de reunions, i els permisos pertinents…`. EN stays as it is.
- Verify: `#permissions` ¶1 contains «reuniones, y los permisos» / «reunions, i els permisos».
- Evidence: verified in code. Needs a native ES and CA read, which is already in the package's device checks.

No other regressions found in the changed files or the privacy and terms pages. Summary card 02 is now one line longer in ES (7 lines) and two lines longer in CA (8 lines) at 390 px, and still crosses the fold, as it did before. This is the brief's chosen copy, not a regression.

### Device-only (not checked here)
- Safari on a real iPhone at 390 px, /es/privacy/ (`text-wrap: pretty`).
- A native Catalan read of the new clauses (summary 02, §2, §3, §4, §9, terms §5) and a native Spanish read (summary 02, §3, §4 ¶2, terms §5, §9).
