## UX web verify — WP272 (round 2, area L) — 2026-11-05
**Verdict:** Ship. WP270's checked copy landed without changes, and the Spanish bullet now ends on «sus reuniones.» at 390 px and 320 px, in light and dark. No regressions.

Package copy: `/root/.taskflow-tools/wt/2026-11-05-pages-r2-WP272`.

What I read:
- the package diff (`waves.py diff`);
- the shelved `unmerged-WP270.patch`, compared line by line with that diff;
- the tester's privacy renders in the copy, made at 10:49–10:50 UTC (after `es.ts` was changed at 10:45);
- the app sources for the 7-day and 30-day rules.

I ran no npm or Playwright. I made the crops with Pillow in the scratchpad.

### What the package changed
The package diff matches the patch exactly, with two differences:
- `es.ts:126`: «borra sus reuniones.» (the ` ` escape, as in `Google LLC` at `src/content/site/es.ts`);
- the tester's WEB-2004 block appended to `tests/ux-web-legal-meetings.spec.ts`.

Everything else is the same as the patch: `en.ts:126`, `ca.ts:126`, `docs/LEGAL_RELEASE.md:37-38`, and the patch's test file.

It doesn't touch `company.json`, `src/content/site/` or `legal.css`. The copy's `legal.css` is byte-identical to the main checkout's, which comes from round 1's WP271 (`text-wrap: pretty` only on `.legal-summary p`, `legal.css:154`).

### Findings
**WEB-1901 · fixed**
- `en.ts`, `es.ts` and `ca.ts`, line 126, now carry the verified round-1 copy, so the 7-day sentence names the app's question.
- The app source agrees: `../TaskFlow/App/lib/services/meeting_store.dart:39` (`unanswered = Duration(days: 7)`) and `:695-706` (counted from when the app first asks).
- Renders, §7: `privacy.{en,es,ca}.mobile.light.full.png`.
- The tester's test passes.

**WEB-1902 · fixed**
- The 30-day sentence now covers whatever is left on the server, finished or not: «Lo que quede … terminada o no» and «El que quedi … acabada o no».
- The app source agrees: `../TaskFlow/Backend/core/meetings.py:645` (the `SWEEP_DAYS` cutoff).
- The meeting bullet stays inside the content column at 390 px and 320 px in all three languages (renders above, and `….mobile-w320.light.full.png`).

**WEB-1903 · fixed**
- Discard now reads "from your phone at once, and from our server as soon as your phone is online" (and the same in ES and CA).
- The app source agrees: `../TaskFlow/App/lib/models/meeting.dart:27` (the `discarding` phase).
- `LEGAL_RELEASE.md:37-38` states the same rules.
- None of the GONE sentences is left (the patch's test).

**WEB-2003 · fixed**
- In all three languages, the 7-day sentence says "the app asks you about" / «la app te pregunta» / «l’app et pregunta», and names no Stop. That covers both the cut-off recording and the quiet Stop.

**WEB-2004 · fixed**
- 390 × 664, light and dark (`privacy.es.mobile.{light,dark}.full.png`, y≈11850-12550): the last line is «sus reuniones.», under «conexión. Eliminar tu cuenta borra».
- 320 px (`privacy.es.mobile-w320.light.full.png`, y≈13900-15100): the line ends on «borra / sus reuniones.».
- English ends on "account deletes its meetings." (390 px) and "account deletes its meetings." (320 px). Catalan ends on «n’esborra les reunions.» at both widths. So `en.ts` rightly needed no no-break space (brief step 3).
- The tester's Range-rect test passes in light and dark.

### Regressions
None.
- The no-break space affects only the bullet's last two words. It can't overflow at 320 px or at 200% text, and assistive technology reads it as an ordinary space.
- The desktop wrap of that sentence is unchanged in meaning.
- No other line, page or style changed.

### Device checks still open
- A native Spanish read and a native Catalan read of the bullet.
- On a real phone: Discard in airplane mode, then online.
- On a real phone: an interrupted recording, and a quiet Stop, left unanswered, becoming a note after 7 days.
- On Safari on a real iPhone: the Spanish bullet's last line. The no-break space holds in every engine; this session's only evidence is the Chromium renders.

### Memory notes
- A one-word last line in legal copy is fixed with a ` ` escape inside the string, on the package's own line (WEB-1609, WEB-2004). The site avoids `text-wrap: pretty` on `.legal-body li`, because it would re-wrap every legal list.
- To verify a shelved patch that was landed again, diff the package's `waves.py diff` against the `.patch` file's `+`/`-` lines. Don't diff the copy against HEAD: the copy's staged seed holds the earlier rounds' merged work, which makes HEAD diffs noisy.
