# Verify — run 2026-11-06-pages, round 1, WP273 (area F), check 2 — 2026-11-06

**Verdict:** all six findings are still fixed, and both regressions from check 1 are fixed. I found no new regressions.

**Evidence:** I read the code and the diff in `/root/.taskflow-tools/wt/2026-11-06-pages-r1-WP273` (from `waves.py diff`). I also read the tester's Chromium renders in that copy's `artifacts/ux-web/`, made 15:12–15:14 UTC. They are newer than the code, which was edited at 14:47 UTC. I cropped them with PIL into the scratchpad and read `AUDIT.md` §1 and §3. I ran no npm or Playwright. There is no WebKit here and no real device.

## What this fix changed
- `src/styles/global.css:580`: `.feature-card h3` now has `text-wrap: balance;`. This is the fix for R1-WP273-1.
- `src/content/site/ca.ts:87`: the CA meetings body has U+2060 WORD JOINER after each enclitic hyphen: «rep-⁠ne», «revisa-⁠la», «afegeix-⁠la». There are 3 in the string. This is the fix for R1-WP273-2.
- The same CA string, with the same 3 joiners, is in `tests/support/ux-web-copy.ts:92` and in `WP273_BODY` at `tests/ux-web-features.spec.ts:1985`. That test matches it with `toHaveText` (`:2037`). This is a copy-only test change, for web-ux-tester to look at.

## Findings

| ID | Result | Evidence |
|---|---|---|
| WEB-2103 | fixed | The h3 is «Your meetings become notes» / «Tus reuniones se convierten en notas» / «Les teves reunions es converteixen en notes» (`en.ts:80`, `es.ts:80`, `ca.ts:86`). At 320 px the ES and CA headings take 2 lines (`home.es.mobile-w320.light.full.png`, `home.ca.mobile-w320.light.full.png`). With balance, the EN heading now splits «Your meetings / become notes». |
| WEB-2101 | fixed | The body no longer says "one tap". It now reads «Create task … check it, then add it» / «Crear tarea … revísala y añádela» / «El botó Crea una tasca … revisa-⁠la i afegeix-⁠la». That matches `createTaskFromNote` (`../TaskFlow/App/lib/widgets/note_task.dart:139-190`), which opens the review. The joiners don't change what the words say. |
| WEB-2102 | fixed | The payoff comes first. At 390 px, the notes appear on lines 1–2 in ES and CA (`home.es.mobile.light.full.png`, `home.ca.mobile.light.full.png`). The WD36 facts are all kept. |
| WEB-2105 | fixed | ES «También toma notas de las reuniones que grabas…» is at `es.ts:110`, and CA «També pren notes de les reunions que enregistres…» is at `ca.ts:116`. Neither file changed in this fix. A native read is still needed. |
| WEB-2002 | fixed | The EN FAQ sentence is unchanged and still exact. |
| WEB-2104 | fixed | `HomePage.tsx` didn't change in this fix. The renders still show, from the top: title, «Passos · 0/2», the two to-dos, a thin line, «Reunió del dimarts · 42 min», the summary, Decisions and a pill with no icon. The CA, ES and EN crops at 320 px show this. At 320 px the CA summary ends «algú que / la prepara.», and the ES one ends «alguien que la prepara.». |

## Regressions from check 1

**R1-WP273-1 · S1 · The new ES heading leaves «notas» alone at 390 px. No longer holds (fixed).**
- `global.css:580` sets `text-wrap: balance`. `home.es.mobile.light.full.png` now shows «Tus reuniones se / convierten en notas».
- The same rule also balances the other card headings: ES «Notas, listas de / pasos y archivos», and CA «Les tasques, també / sense connexió», where line 2 used to be the single word «connexió». CA at 390 px is still «Les teves reunions es / converteixen en notes», and it's still 2 lines at 320 px.
- On desktop at 1440 px, the CA headings are unchanged on one line (`home.ca.desktop.light.full.png`). The tester reports that the grid test passed.

**R1-WP273-2 · S1 · CA body breaks «afegeix-la» at its hyphen at 390 px. No longer holds (fixed).**
- At 390 px (`home.ca.mobile.light.full.png`), the text reads «…revisa-la i / afegeix-la. Fins a 20 hores de reunions / al mes.».
- At 320 px (`home.ca.mobile-w320.light.full.png`), it reads «…revisa-la i / afegeix-la. Fins a 20 hores de / reunions al mes.».
- At text 200% (`home.ca.mobile-text200.light.full.png`), it reads «revisa-la i / afegeix-la. Fins a 20».
- In none of these does a line end with «-» before «la» or «ne». The joiners draw nothing: no blank box shows in any render.

## New regressions
None. AUDIT.md §1 shows axe 0 on all 12 home rows (3 languages × desktop and mobile × light and dark). §3 shows no sideways scroll at 320 px or at 200% zoom in any language.

## Not regressions (noted)
- At text 200% on a phone, the note's header wraps as «Reunió del dimarts · / 42 min» (`home.ca.mobile-text200.light.full.png`). This is a decorative, `aria-hidden` drawing, and it happens only at 200%. The header got longer in the first fix, and check 1 didn't report it. It's cosmetic and below the bar.
- The details card's CA body splits «fins a 6 / MB» on desktop and at 390 px. That text predates this package, and the package didn't touch it.
- The joiners stay in the text if someone copies the CA paragraph, and find-in-page for «revisa-la» may not match it. A visitor is unlikely to do either. The site already uses the same kind of invisible-character fix for widows (site-patterns).

## Device checks still pending
- A native ES read and a native CA read of the heading, the body and the FAQ sentence.
- On a real phone: Create task opens the review with the to-dos ticked, and Add task saves one task with a checklist.
- Safari on a real iPhone at 390 and 320 px. Older Safari doesn't support `text-wrap: balance` or `pretty`, but it ignores them safely and doesn't break the layout. Check that WebKit honours U+2060 after a hyphen.

## Memory notes
- `.feature-card h3` now has `text-wrap: balance` (global.css:580). Every feature card heading balances on phones.
- In CA copy, enclitic hyphens on the home («rep-⁠ne», «revisa-⁠la», «afegeix-⁠la») carry U+2060 so they don't break at the hyphen. Test copy that uses `toHaveText` must carry the same joiners: `tests/support/ux-web-copy.ts` and `WP273_BODY` in `tests/ux-web-features.spec.ts`.
- A quick way to find the meetings card in a full render: scan for the card background #efedf5 in light. The third such run is the meetings card. The note continues below it on white.
