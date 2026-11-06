## UX web verify, check 2 — WP271 (run 2026-11-05-pages, round 1, area L) — 2026-11-05

**Verdict:** Ship. All six findings are still fixed. R1-WP271-1 is fixed by the added comma, and the fix caused no new regression.

**What I read:** the package's full diff (`waves.py diff`: `src/content/legal/{en,es,ca}.ts`, `src/styles/legal.css` and `tests/ux-web-legal.spec.ts`), and line 151 of each legal file in the worktree. I also read the tester's re-run renders, `AUDIT.md` and the ARIA snapshots. All of them were written between 09:56 and 09:57 UTC, after `es.ts` and `ca.ts` last changed at 09:49, so they count as evidence. I did not run npm or Playwright. In this copy, `git status --porcelain` lists only this run's files.

### Findings

| ID | Result | Evidence |
|---|---|---|
| WEB-2001 | fixed | Unchanged since check 1. Terms §5 (`:235`) now says "…before saving, sharing or relying on them." / «…antes de guardarlos, compartirlos o fiarte de ellos.» / «…abans de desar-los, compartir-los o refiar-te’n.». Privacy §4's last sentence (`:59`) matches the brief in all three languages. The app saves meeting notes without a review step (`../TaskFlow/App/lib/services/meeting_uploader.dart:380`). The §3 part is covered under WEB-1907. |
| WEB-1904 | fixed | Unchanged. In `ca.ts`, `:10`, `:33`, `:56` and `:59` now use «enregistrar» / «enregistres». In §4 ¶2, ES says «las cosas por hacer» and CA says «les coses per fer». No forbidden phrase remains. Dictation keeps «gravació» and «micròfon per gravar» (`ca.ts:151`). |
| WEB-1502 | fixed | `src/styles/legal.css` sets `text-wrap: pretty` on `.legal-summary p`. The new comma is in §9, not in the summary card, so the card's wrapping can't have changed. The tester's widow test passed again on the re-run. Device-only: Safari on a real iPhone. |
| WEB-1906 | fixed | Unchanged. §4 ¶3 says "its text and notes" (and the ES and CA equivalents). §4 ¶4 drops "and process it outside the EU" but keeps both EU sentences. The ES and CA link labels now say «incluida Vertex AI» / «inclosa Vertex AI». |
| WEB-1905 | fixed | Unchanged. Only the last clause of summary 02 (`:10`) changed, to the brief's copy in all three languages. |
| WEB-1907 | fixed | §9 (`:151`) now reads "notifications for reminders and meeting recordings," / «notificaciones para recordatorios y grabaciones de reuniones, y los permisos…» / «notificacions per recordar i per als enregistraments de reunions, i els permisos…». §3 (`:48`) matches the brief. |

Measured in the worktree's `AUDIT.md` (Chromium): §1 shows axe 0 rules and 0 nodes on privacy and terms, in EN, ES and CA, desktop and mobile, light and dark. §3 shows no sideways scroll and no clipped text on privacy at text200, zoom200 and w320, in every language. Automated checks find only some barriers (AX-11).

### Regressions from check 1

**R1-WP271-1 · Severity 1 · ES/CA §9: two y/i in a row blur the list: fixed, no longer holds.**
- `src/content/legal/es.ts:151` now reads «…notificaciones para recordatorios y grabaciones de reuniones, y los permisos pertinentes…».
- `src/content/legal/ca.ts:151` now reads «…notificacions per recordar i per als enregistraments de reunions, i els permisos pertinents…».
- Both match check 1's fix exactly. The page renders them: the ARIA snapshots `aria/privacy.es.mobile.txt:181` and `aria/privacy.ca.mobile.txt:181` show the comma.
- English is unchanged (`en.ts:151`, "…meeting recordings, and relevant…").
- The WEB-1907 acceptance substrings («…recordatorios y grabaciones de reuniones», «…i per als enregistraments de reunions») are still in the text.

### New regressions
None. The fix added one comma on one line in each of two files. The grep for lost spaces (`[a-zà-ú]\.[A-ZÀ-Ú][a-zà-ú]`) finds nothing in the three legal files. Nothing outside §9 changed.

### Device-only (not checked here)
- Safari on a real iPhone at 390 px, on /es/privacy/, to check `text-wrap: pretty`.
- A native Catalan read of summary 02, §2, §3, §4, §9 and terms §5, and a native Spanish read of summary 02, §3, §4 ¶2, §9 and terms §5. This includes §9's new comma.
