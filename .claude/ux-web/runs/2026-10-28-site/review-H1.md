## UX web review — H1, the pitch: hero, "at a glance", appearance, closing call to action, and every call to action — 2026-10-29

**Verdict:** Ship after fixes. The pitch is true to today's app in every claim checked, and it passes the five-second test on desktop. But its layout hides parts of it: on common laptops and at 200% zoom, the button and the "not yet" line fall below the fold. On phones, "an app for Android" comes last in a centred grey paragraph, and the app's picture is off-screen. There are 3 S2 and 4 S1 findings, no S3 or S4, and 3 questions for the owner.

**Walked:**
- **Evidence and its age.**
  - The Chromium renders (2026-10-28, 17:57–17:59) and the measured audit (`AUDIT.md`, `audit.json`, 2026-10-28/29) are newer than every file they show. The last site commit is 44e9921 (2026-10-23), and `ux-web.sh changed` lists no website file since the last web review. So the renders count as evidence.
  - WebKit renders: 2026-10-29, 08:59.
  - App renders: `App/build/ux/calendar/*` (2026-10-28) and `App/build/web-assets/*` (2026-10-22).
  - Positions marked "measured" come from `audit.json` (`pages[].collected.targets`). Positions marked "≈" are read from renders.
  - Nothing in my area called the API.
- **Not walked, because they're gone.** The "at a glance" bar and the appearance section were removed (WEB-11, WEB-17, both verified). Nothing is left of them in `src/`: "At a glance" survives only as the legal summary's label (`src/content/legal/index.ts:37`), and there's no `#appearance`.
- **Newcomer** (`/es/`, phone 390 × 664, light and dark; also 320 px and 200% text). 6 steps:
  1. The WhatsApp preview (`opengraph-image.es.png`). Its `og:title` is the H1 word for word.
  2. The hero's first screen.
  3. Scrolling: the quote card, then screen 2, which is the app's Calendar on its own.
  4. «Pruébalo con tu voz». It lands on the demo with «Probar la demo en directo» in view (`voice-intro.en.mobile.light.view.png`).
  5. Scrolling on to the closing card «Muy pronto en Android.» (button at y = 5132, measured).
  6. Its button, which goes back up to `#voice`. This is the page's only next step.
- **Comparer** (`/`, desktop 1440 × 1000, light and dark; also `desktop-zoom200` and `desktop-text200`). I also computed the page area of 1366 × 768 and 1536 × 864 laptops from the CSS. 5 steps:
  1. The hero.
  2. "What it does", which goes to `#features`.
  3. The FAQ, closed.
  4. The closing card's free and Pro line.
  5. Its button, which goes to `#voice`.
- **Assistive-technology user.**
  - The hero and closing regions in `aria/home.{es,en}.{mobile,desktop}.txt`.
  - The Tab path: AUDIT §10, 29 stops on phones and 35 on desktop, with focus visible and uncovered at every one.
  - The `desktop-zoom200` and `mobile-text200` renders.
- **Leaver.** Outside H1. The home's footer «Eliminar cuenta» is present (y = 5646 on `/es/` phones, measured).

**Numbers:**
- **First viewport, words:**
  - `/es/` phone: ≈ 65 (header 2, H1 7, subheadline 33, buttons 6, status 10, quote 7).
  - `/` desktop: ≈ 78 outside the screenshot (header 13, H1 7, subheadline 33, buttons 8, status 10, quote 7), plus ≈ 35 inside it.
- **First viewport, calls to action:**
  - Both: 1 filled button and 1 text link in the hero.
  - Phone: also the «Menú» pill.
  - Desktop: also 3 nav links (one is "Try it with your voice" again), 3 language links and the theme switch.
- **Scrolls to the first call to action on a phone:** 0. The hero button is at y = 366–416 (measured).
- **The honest "not yet":**
  - 0 scrolls on phones (y ≈ 432–473) and at 1440 × 1000 (y ≈ 710–730).
  - Below the fold on 1366 × 768 and 1536 × 864 laptops (computed, WEB-1201).
- **The first "free":**
  - y ≈ 2090 on `/es/` phones, ≈ 3.1 screens down (the line under the demo).
  - y ≈ 1880 on desktop.
  - The closing card's line is at ≈ 7.9 phone screens.
- **The live demo's start button:** y = 1596 on `/es/` phones (2.4 screens) and y = 1390 on desktop (measured).
- **The closing button:** y = 5132 on `/es/` phones (7.7 screens) and y = 4159 on desktop EN (measured).
- **"Try it with your voice":** 5 links, all to one destination (`#voice`), plus the demo's H2 in the same words.
- **The hero subheadline on phones:** 5 centred lines at 390 px, 6 at 320 px, ≈ 9 at 200% text. The closing plans line is 4 lines at 390 px and ≈ 9 at 200% text.
- **Phone hero button:** 50 px tall (58 on desktop and in the closing card). When it stacks above "What it does" (EN and CA at 390 px, every language at 320 px), the gap is 4 px (measured).
- **Claims:** 15 checked. 0 false, 1 outdated (the hero image's dates, already tracked as WEB-114 and WEB-5), 0 unverifiable. 1 ambiguous wording goes to the owner (Q-H1-3).

**Attention** (predicted from the renders with GUIDELINES §21.4; not measured eye-tracking):
- **`home.es.mobile.light.fold.png`:**
  1. The H1 «Dilo y ya está en tu calendario.»: 39 px, y ≈ 103–187, top half, the highest contrast.
  2. The filled «Pruébalo con tu voz»: 222 × 50 at y = 366, isolated in the middle band.
  3. The quote card «Mañana, llamar al dentista y comprar pan.»: bold, in a white card with a shadow, at y ≈ 498–578. That's the bottom third, which gets about 14% of gaze (Lagun 2014).

  - **What competes:**
    - the subheadline's five centred grey lines, between fixations 1 and 2;
    - the outlined «Menú» pill;
    - the H1's green, underlined accent, which reads as a link (WEB-1204).
  - **Missing from the first three:**
    - «Una app para móviles Android™», the last words of the subheadline's 5th line (WEB-1202);
    - what's free (y ≈ 2090).
  - The product picture is off-screen: only the phone's top edge shows, at y ≈ 590.
- **`home.es.mobile.dark.fold.png`:** the same order. The mint button (#9ed5b3) is the brightest thing on the screen, which strengthens fixation 2. The same gaps.
- **`home.en.desktop.light.fold.png`:**
  1. The H1 (77 px, left half). It starts at y ≈ 290, though: the top-left cell holds only the logo and ≈ 200 px of empty column (WEB-1201).
  2. The app screenshot in the right half, with its quote card. The card (y ≈ 135–215) is the highest content on the page. The right half gets its first look after about 2–3 s (Buscher 2009).
  3. The filled "Try it with your voice": 252 × 58 at y = 630 (measured).

  - **What competes:**
    - the header's "Try it with your voice", with the same words and target;
    - the outlined "English" pill;
    - the theme switch.
  - "Android", the "not yet" line and the phone all show. "Free" doesn't.
- **`home.en.desktop.dark.fold.png`:** the same; the mint button stands out more.
- **Variants:**
  - `mobile-w320`: the same order. The button is at y ≈ 387 of 568, and the quote card falls below the fold.
  - `mobile-text200`: only the H1 and 5 lines of the subheadline fit, and the button is ≈ 1.4 screens down. That's expected at that size.
  - `desktop-zoom200`: the quote card and the phone fill the top. The H1 starts at y ≈ 265 of 500, and the button is below the fold (WEB-1201).
  - WebKit: the same order, with thin weights (WD15, not a finding).
- **Five-second simulation:**
  - **Desktop:** passes Q1–Q6. The phone picture answers "an app, for a phone".
  - **`/es/` phone:** passes Q1, Q2, Q4, Q5 and Q6 (no unknown word; "Android™" is the oddest). It's weak on Q3, who it's for and which phone: the answer is the subheadline's 5th line, or «Google Play» in the status line. That's WEB-1202.

### Findings (most severe first)

**WEB-1201 · Severity 2 · Centred hero pushes the button below the fold on laptops**
- **Where:**
  - `src/styles/global.css:375` (`.hero { align-items: center }`), `:379-383` (`.hero-copy`), `:1004-1008` (85 px hero padding from 1500 px up);
  - `/`, `/es/`, `/ca/`, on desktop at laptop heights and at 200% zoom, light and dark;
  - renders: `home.en.desktop.light.fold.png`, `home.es.desktop-zoom200.light.full.png` (screen 1), `home.en.desktop-zoom200.light.fold.png`.
- **The moment:**
  - The Comparer, on a work laptop: "Nice headline. So how do I get it?" The button's top edge peeks over the bottom of the screen, and "Coming soon to Google Play. You can't download it yet." is out of sight.
  - Someone at 200% zoom: "Where's the button?"
- **What happens:**
  - **What causes it:**
    - The copy column is centred against the art column, which is ≈ 755 px tall (the quote card plus a 312-px phone).
    - At 1440 × 1000 that puts the H1 at y ≈ 290, with ≈ 200 px of empty column above it.
    - The button is at y = 630–688 (measured) and the status line at y ≈ 710–730.
  - **On common laptops (computed from the same CSS):**
    - At 1366 px wide the layout is nearly the same: button ≈ 622–680, status ≈ 700–724. A maximised browser on a 1366 × 768 screen shows ≈ 600–650 px of page, so the button is cut and the status is hidden.
    - On a 1920 × 1080 laptop at 125% (1536 × 864, ≈ 730 px of page), the 85-px padding pushes the button to ≈ 663–721 and the status to ≈ 741–765, below the fold.
  - **At 200% zoom (720 × 500):** the H1 starts at y ≈ 265, and the button sits at y ≈ 556–614, below a 500-px screen. Seen in the render.
- **Why it fails:**
  - AT-1: the H1, a one-line explanation and the primary action are fully visible in the first viewport (Fessenden 2018, desktop data).
  - EY-1 and EY-2: the H1 belongs top-left, where first looks land (Fessenden 2017h; Buscher 2009).
  - CT-2: the primary action belongs in the first viewport.
  - AX-3: nothing is lost at 200% zoom, so this isn't a 1.4.10 failure, but the next step leaves the first screen.
- **Fix (subtract the centring):**
  1. Top-align the hero's columns: `.hero { align-items: start }` (`global.css:375`).
  2. Above 800 px, give `.hero-copy` a top padding of about 64 px (`:379-383`), so the H1 lines up with the quote card rather than the header. At 800 px and below, give it none (the 800-px block starts at `:1126`).
  3. Phones (≤ 580 px) are one column and don't change.
  - Expected result: at 1440 × 1000 the H1 starts at y ≈ 200 and the button ends at y ≈ 600. At 200% zoom the button ends at y ≈ 470.
- **Verify:**
  - Playwright on `/`, `/es/` and `/ca/`, at 1366 × 640 and 1536 × 730: the bottoms of `.hero-buttons .button` and `.hero-status` are within the viewport.
  - At 1440 × 1000: the H1's top ≤ 210, and `.hero-phone` is still whole in the first viewport.
  - In the `desktop-zoom200` renders, the hero button ends above y = 500 in EN, ES and CA.
  - The phone renders are unchanged.
- **Evidence:**
  - measured: the button's position at 1440 (`audit.json`);
  - seen in current renders: 1440 and zoom 200%;
  - inferred for 1366 × 768 and 1536 × 864, from the CSS. Render those sizes to confirm.

**WEB-1202 · Severity 2 · On phones, "an app for Android" comes last**
- **Where:**
  - `src/content/site/es.ts:49`, `en.ts:49`, `ca.ts:49`, rendered at `src/components/HomePage.tsx:16`;
  - `/es/`, `/`, `/ca/` on phones (390 and 320 px), light and dark;
  - renders: `home.es.mobile.light.fold.png`, `home.es.mobile.dark.fold.png`, `home.ca.mobile-w320.light.fold.png`.
- **The moment:** «"Toca un botón y di lo que tienes que hacer"… ¿este botón verde? ¿Esto es una página o una app?»
- **What happens:**
  - On a phone, the first screen has no picture of the app. The screenshot starts at y ≈ 590, and only the phone's top edge shows.
  - What the thing *is*, «Una app para móviles Android™», is the last five words of a 5–6-line grey paragraph.
  - The paragraph opens with an instruction, «Toca un botón y di lo que tienes que hacer». Directly under it, the only button on screen says «Pruébalo con tu voz». A newcomer can take the website's button for the app's, and the website for the tool.
  - The demo then says "the tasks TaskFlow would add" and "Nothing here is saved to the app", which corrects this, but 2–3 screens later.
  - The English sentence also ends with an unclear "can remind you before it".
- **Why it fails:**
  - SC-4: front-load every line. The first two words carry the meaning (Nielsen 2009w; Pernice 2017).
  - HE-6: the subheadline says how, and for whom.
  - §21.4, step 7: "what TaskFlow is" and "for Android" fall outside the first three fixations.
  - HE-5 and AT-2: the visual proof isn't in the first phone screen, so the words must do the work (Lagun 2014).
  - This follows WEB-1's fix (the hero now says it). The problem is the order, not whether it's there. The organizer may fold it into WEB-1.
- **Fix:** move the last sentence to the front as a lead-in. No new claim, and the same word count. The ™ stays on the first visible "Android". The Catalan also settles WEB-1's open wording.
  - EN: "An app for Android™ phones: tap one button and say what you need to do, even several things at once. TaskFlow puts each one on its day and can remind you beforehand."
  - ES: «Una app para móviles Android™: toca un botón y di lo que tienes que hacer, aunque sean varias cosas a la vez. TaskFlow pone cada una en su día y puede avisarte antes.»
  - CA: «Una aplicació per a mòbils Android™: toca un botó i digues el que has de fer, encara que siguin diverses coses alhora. TaskFlow posa cadascuna al seu dia i et pot avisar abans.»
- **Verify:**
  - `tests/ux-web-home.spec.ts` (the WEB-1 block): `.hero-description` starts with "An app for Android™ phones:" / «Una app para móviles Android™:» / «Una aplicació per a mòbils Android™:».
  - On the 390 × 664 renders, "app" and "Android" sit on the subheadline's first line.
  - A native Catalan read of «posa cadascuna al seu dia».
- **Evidence:** seen in current renders, both themes; verified in code; reading order confirmed in `aria/home.es.mobile.txt:11-20`.

**WEB-1203 · Severity 2 · Hero and closing paragraphs are centred on phones**
- **Where:**
  - `src/styles/global.css:1240-1243` (`.hero-copy { text-align: center }`, ≤ 580 px), `:1249-1253`, `:1254-1261`;
  - `:818-827` (`.closing-card { text-align: center }`, every width), `:841-848`;
  - phones in every language, light and dark;
  - renders: `home.es.mobile.light.fold.png`, `home.es.mobile-text200.light.full.png` (screens 1–3 and 16–18), `home.ca.mobile-w320.light.full.png` (screens 9–11).
- **The moment:** reading at a large text size, the newcomer loses the start of each line: «cada línea empieza en un sitio distinto».
- **What happens:**
  - The hero's explanation is 5 centred lines at 390 px, 6 at 320 px and ≈ 9 at 200% text.
  - The closing card's two paragraphs are 3–4 centred lines each at 390 px; at 200% text, its plans line is 9.
  - Every line starts at a different x. The free and Pro facts, the ones a wary visitor reads closely, are the longest centred text on the page.
  - The feature cards and the FAQ on the same phone page are left-aligned.
- **Why it fails:**
  - RD-4: body text is left-aligned (Dyson 2004; Baymard 2022).
  - SC-3: scanning anchors on the left edge and first words (Pernice 2017).
  - OL-1: older readers are slower and more error-prone, and centring costs most at large text (Nielsen 2013).
- **Fix (subtract the centring on phones only; desktop keeps its short, centred lines):**
  - In the ≤ 580 px block:
    - delete `text-align: center` from `.hero-copy` (`:1241`);
    - make `.hero-description`'s margin `18px 0 0` (`:1251`);
    - set `.hero-buttons` to `justify-content: flex-start` (`:1257`).
  - In the same block, for the closing card:
    - add `.closing-card { text-align: left }`;
    - add `.closing-spark { justify-content: flex-start }`;
    - add `.closing-card > p { margin-inline: 0 }`.
- **Verify:**
  - At 390, 320 and `mobile-text200`, in EN, ES and CA, each line box of `.hero-description`, `.closing-card > p` and `.closing-plans` starts within 1 px of the same x (`Range.getClientRects()`).
  - The H1, the button and the status line start at the column's left edge.
  - The desktop renders are unchanged.
- **Evidence:** seen in current renders (100%, 320 px, 200% text); verified in code.

**WEB-1204 · Severity 1 · H1 accent is underlined like a link; splits on phones**
- **Where:**
  - `src/styles/global.css:390-396` (`.hero-accent`: link green plus an underline), `:384-389` (`h1`), `src/components/HomePage.tsx:12-15`;
  - every home, every viewport, both themes;
  - renders: `home.es.mobile.light.fold.png`, `home.es.mobile-w320.light.fold.png`, `home.en.desktop.light.fold.png`.
- **The moment:** the newcomer taps the green, underlined «tu calendario.», expecting to see a calendar. Nothing happens. «¿No va?»
- **What happens:**
  - The biggest words on the page use #176e59, the colour of the site's links in text (the legal pages' email links, `AUDIT.md` §7), and they're underlined: the web's strongest link signal.
  - On `/es/` at 390 and 320 px, the accent also breaks after «tu», so the underline comes in two pieces and «tu» dangles at the end of line 1.
- **Why it fails:**
  - CT-5, links look like links, and the converse. Loranger 2015c: "Don't use blue text (or underline text) for nonclickable items. … Static items should not have the same color as hyperlinks."
  - HE-3: clear beats clever.
- **Fix:**
  - Delete `text-decoration`, `text-decoration-color`, `text-decoration-thickness`, `text-underline-offset` and `text-decoration-skip-ink` from `.hero-accent` (`:392-396`). Keep the colour.
  - Add `text-wrap: balance;` to `h1` (`:384-389`), so `/es/` breaks as «Dilo y ya está en / tu calendario.». Where `balance` isn't supported, normal wrapping applies.
- **Verify:**
  - `getComputedStyle('.hero-accent').textDecorationLine === 'none'`, in light and dark.
  - On `/es/` at 390 and 320 px, the accent span has one line box (`getClientRects().length === 1`).
  - The fold renders show no underline.
- **Evidence:** seen in current renders; colour measured (`AUDIT.md` §7); verified in code.

**WEB-1205 · Severity 1 · Phone hero buttons: 50 px tall, 4 px apart stacked**
- **Where:**
  - `src/styles/global.css:1259` (`gap: 4px 21px`), `:1266` (`padding: 12px 17px`);
  - `/` and `/ca/` at 390 px, and every home at 320 px, light and dark;
  - `audit.json`: EN mobile `a.button` is 230 × 50, with a gap of 4 to `a.text-link`; CA is 264 × 50, gap 4. ES at 390 px sits side by side (gap 21);
  - renders: `home.en.mobile.light.fold.png`, `home.ca.mobile-w320.light.fold.png`.
- **The moment:** the newcomer aims a thumb at "Try it with your voice" and lands on "What it does", 4 px below. The page jumps to the features instead of the demo.
- **What happens:**
  - The primary button is 8 px shorter on phones than on desktop and in the closing card (58 px, measured).
  - When the pair wraps, the rows are 4 px apart. The AUDIT §5 summary doesn't flag it, because it only lists sizes, but the `gap` column has it.
- **Why it fails:**
  - CT-6: at least 8 px between neighbours (Android's 8 dp; M3 Structure).
  - CT-7: about 56 px for the primary action, for older hands (Hoober 2017c; Kane 2019).
  - OL-1.
- **Fix:**
  - In the ≤ 580 px block, change `gap: 4px 21px` → `gap: 12px 21px` (`:1259`).
  - Change `padding: 12px 17px` → `padding: 16px 17px` (`:1266`), which makes the button 58 px, like the desktop hero and the closing card.
- **Verify:**
  - In `audit.json` for the home, mobile and w320: the hero `a.button` is ≥ 56 px tall, and its gap to `a.text-link` is ≥ 8 (EN and CA at 390, every language at 320).
  - On `/es/` at 390 × 664, `.hero-status` still ends inside the first viewport.
- **Evidence:** measured (`audit.json` targets); seen in current renders.

**WEB-1206 · Severity 1 · Spanish and Catalan promise «very soon»; English says "coming soon"**
- **Where:**
  - this area: `src/content/site/es.ts:52` (hero status), `:129` (closing title); `ca.ts:52`, `:135`;
  - the same words elsewhere: `es.ts:7` (meta), `:23` (phone menu), `:190` (demo hand-over); `ca.ts:7`, `:23`, `:198`;
  - `/es/` and `/ca/`, every viewport and theme;
  - renders: `home.es.mobile.light.fold.png` (status), `home.es.mobile.light.full.png` (screen 8, the closing card).
- **The moment:** «"Muy pronto"… ¿cuándo?» A month later the newcomer comes back, and it still says «muy pronto».
- **What happens:**
  - English says "Coming soon".
  - Spanish and Catalan add an intensifier: «Muy pronto» and «Molt aviat», "very soon", a time promise with no date behind it, five times per language.
  - Meanwhile the app's package name is still the placeholder `com.example.agenda` (`App/android/app/build.gradle:52`), so not even pre-registration has started.
  - The FAQ already uses the neutral form: «llegará pronto», «arribarà aviat».
- **Why it fails:**
  - FN-1: true today, no unprovable promises.
  - ML-6: each language says the same thing, written for its readers.
  - TR-3: a promise that ages turns into a trust bug.
- **Fix:** use the standard neutral form. English stays as it is.
  - ES: «Próximamente en Google Play. Todavía no se puede descargar.», «Próximamente en Android.», the menu's «Próximamente en Android», meta «… Para móviles Android, próximamente en Google Play.», hand-over «… Próximamente en Google Play.»
  - CA: «Properament a Google Play. Encara no es pot descarregar.», «Properament a Android.», the menu's «Properament a Android», meta «… Per a mòbils Android, properament a Google Play.», hand-over «… Properament a Google Play.»
  - A native Catalan read is welcome.
- **Verify:**
  - `grep -rn "Muy pronto\|Molt aviat" src/` finds nothing.
  - The hero status and the closing H2 read «Próximamente…» / «Properament…» in the `/es/` and `/ca/` renders.
- **Evidence:** verified in code; seen in current renders.

**WEB-1207 · Severity 1 · Spanish and Catalan quote ends with an English-style period**
- **Where:**
  - `src/content/site/es.ts:53` and `ca.ts:53` (the hero's quote card);
  - the same string in the demo's example (`es.ts:145`, `ca.ts:151`, area H2);
  - `/es/` and `/ca/`;
  - renders: `home.es.mobile.light.fold.png`, `home.ca.desktop.light.fold.png`.
- **The moment:** a reader schooled in Spanish punctuation sees «…comprar pan.» with the full stop inside the guillemets. The app writes the same example without it.
- **What happens:**
  - The site writes «Mañana, llamar al dentista y comprar pan.» and «Demà, trucar al dentista i comprar pa.».
  - The app's own first-run hint quotes it as «Mañana, llamar al dentista y comprar pan» (`App/lib/l10n/app_es.arb:223`) and «Demà, trucar al dentista i comprar pa» (`app_ca.arb:202`).
  - Spanish and Catalan put a sentence's full stop after the closing guillemet, never inside it.
- **Why it fails:**
  - FN-2: the app's words.
  - ML-6: written for each language.
  - TR-3: small errors cost trust.
- **Fix:**
  - ES «Mañana, llamar al dentista y comprar pan» and CA «Demà, trucar al dentista i comprar pa»: no full stop in the stand-alone card. Use the same in the demo's example (H2).
  - English keeps "“Tomorrow, call the dentist and buy bread.”", as `app_en.arb:390` writes it.
- **Verify:** `grep -n '\.»' src/content/site/` finds nothing; the `/es/` and `/ca/` fold renders show the quote without a full stop.
- **Evidence:** verified in code and in the app's ARB files.

### Ledger items in this area, re-checked (existing IDs, not new)
- **WEB-1 (device-check).** The hero says what TaskFlow is, in all three languages and both viewports (current renders).
  - Still to do: a screen reader on the hero, and the Catalan «posa cada una el seu dia», which is missing its preposition. WEB-1202's fix replaces it with «posa cadascuna al seu dia».
  - WEB-1202 is about order, and may be folded into WEB-1.
- **WEB-5 (device-check).**
  - The six hero images are byte-identical to `App/build/web-assets/calendar-hero.done.<lang>.<theme>.1x-390.png`, by MD5 (2026-10-22).
  - They match the app's current Calendar (`App/build/ux/calendar/agenda.normal.*.png`, 2026-10-28): the same header, week strip, task cards, «Añadir tarea» button and tab bar.
  - Their dates are 19–25 October, with "Friday, October 23". They need the planned re-render right before publishing (WEB-114, WD13).
  - Task titles show at ≈ 11 CSS px on phones and ≈ 12 on desktop: still a real-phone check.
- **WEB-19 (device-check).** The quote card is announced on its own, between the status line and the image (`aria/home.es.mobile.txt:19`), with no "you say" context. The image's alt text then gives the result.
  - If the TalkBack check finds it confusing, hide `.floating-note` from assistive technology (`HomePage.tsx:37`). The demo's example says the same thing under its label «Por ejemplo, di:».
- **WEB-3, WEB-4, WEB-308, WEB-11, WEB-17 (verified).** Each still holds:
  - the status line sits under the button;
  - one label goes to one destination for all 5 "Try it with your voice" links (`HomePage.tsx:18, 111, 167`; `Header.tsx:15`; `Footer.tsx:32`);
  - the closing card's lime focus ring (AUDIT §10: no ring under 3:1);
  - the bar and the appearance section are gone.

### Claims checked
| Claim (page, `path:line`) | Source of truth (`path:line`) | Status |
|---|---|---|
| Home H1: "Say it, and it's on your calendar." (`src/content/site/en.ts:46-47`; `es.ts`, `ca.ts` same lines) | The app's pitch "Note down what you need to do, and TaskFlow puts it on your calendar." (`App/lib/l10n/app_en.arb:841`). "Your calendar" is TaskFlow's Calendar tab: the app only reads phone calendars (`App/android/app/src/main/kotlin/com/example/agenda/DeviceCalendarBridge.kt:18`; `app_en.arb:164`) | true (see Q-H1-3) |
| "Tap one button and say what you need to do" (`en.ts:49`) | `addTask` (`app_en.arb:242`); `calendarTrySaying` (`:390`). After that the app asks for «Listo» and «Añadir N tareas» (`App/build/ux/capture/result.several.es.light.1x.png`); the voice card says so | true (simplified) |
| "even several things at once" (`en.ts:49`) | `.claude/ux-review/DECISIONS.md` 2026-10-15; `result.several.*` | true |
| "TaskFlow puts each one on its day" (`en.ts:49`) | Each card's day in `result.several.*`. A task said without a day stays «Sin fecha» (`result.no-date.es.light.1x.png`) | true when a day is said |
| "and can remind you before it" (`en.ts:49`) | `Backend/docs/REMINDER_PLANS.md:11, 50-56`; the reminder question (`App/build/ux/first-run/reminder-question.*`) | true |
| "An app for Android™ phones" (`en.ts:49`) | WD7; `App/android/app/build.gradle:52` | true |
| "Coming soon to Google Play. You can't download it yet." (`en.ts:52`) | Not published; `applicationId = "com.example.agenda"` (`App/android/app/build.gradle:52`) | true |
| Quote "Tomorrow, call the dentist and buy bread." (`en.ts:53`; ES/CA `:53`) | The app's first-run example: `app_en.arb:390`, `app_es.arb:223`, `app_ca.arb:202` | true (ES/CA punctuation: WEB-1207) |
| Hero image: the Calendar with the example done (`public/images/hero-calendar-<lang>-<theme>.png`, `src/components/Phone.tsx:22`) | Byte-identical to `App/build/web-assets/calendar-hero.done.*`; the same layout as `App/build/ux/calendar/agenda.normal.*` (2026-10-28) | true; its dates are outdated (WEB-114, WEB-5) |
| Image alt: "…and the Add a task button" (`en.ts:54-55`; «Añadir tarea», «Afegeix una tasca») | `app_en.arb:242`, `app_es.arb:141`, `app_ca.arb:120` | true |
| Closing: "Coming soon to Android." (`en.ts:129`) | As above (`build.gradle:52`) | true |
| "TaskFlow isn't on Google Play yet. Until then, you can try it with your voice on this page." (`en.ts:130`) | Not published; the live demo `#voice` (`src/components/VoiceDemo.tsx:738-741`) | true |
| "Free with an account: 10 dictations a month" (`en.ts:133`) | `FREE_VOICE_CAPTURES_PER_MONTH = 10` (`Backend/config/settings.py:144`); an account is required (WEB-101) | true |
| "and tasks by hand with no limit" (`en.ts:133`) | `freeVoiceNoticeBody`: "creating tasks by hand, with no limit" (`app_en.arb:2332`) | true |
| "TaskFlow Pro, a monthly subscription: unlimited dictation and file space" (`en.ts:133`) | `billingIntro` (`app_en.arb:1981`); no total file cap with Pro (`settings.py:104-106`). The 50-a-day safety limit (`settings.py:141`) is stated in the FAQ only (WD14); WD21's extras are FAQ-only | true (short, by decision) |

### Missing from the site (app features worth telling)
- Nothing new belongs in the pitch (subtract first).
- The hero's quote and image are already the app's own first-run example (`calendarTrySaying`).
- The reminder rhythm is told in the calendar card (WD20), and bulk voice changes in the voice card (WD18).
- Two placement questions follow: "free" near the hero button (Q-H1-2), and where the tasks live (Q-H1-3).

### Keep
- The H1 and subheadline name the outcome, several things at once, reminders and Android in plain words. The H1 is the link preview's title, so the WhatsApp preview and the page match word for word.
- There's one filled primary per view. All 5 "Try it with your voice" links go to one place, which keeps the promise. The honest "not yet" sits right under the button, 0 scrolls down on phones.
- The hero image is today's app, in the page's language and theme, with the app's own example and button name in its alt text.
- The closing card states free and Pro in the app's own words: "tasks by hand, with no limit" is `freeVoiceNoticeBody`.
- Nothing moves. The LCP is text, at 1.66–1.94 s median on phones (lab), with CLS 0. Nothing overflows at 320 px, 200% text or 200% zoom (AUDIT §2, §3).

### Questions for the owner (product decisions only)
Numbered here as Q-H1-n; the plan gives them WD numbers from WD22 on.

- **Q-H1-1 · Revisit WD9 ("tell me when it launches")?**
  - **The evidence:**
    - The closing card's only action sends the visitor back up ≈ 3,200–3,800 px to the demo (`HomePage.tsx:167`).
    - A convinced visitor who has already tried the demo leaves with no way to hear about the launch.
    - Play pre-registration, WD9's chosen route, needs the final package name. It's still the placeholder `com.example.agenda` (`App/android/app/build.gradle:52`), and package names are permanent (AP-6).
  - **Recommendation:**
    - Keep WD9 ("not yet") on the site.
    - Choose the final package name now. It's needed for the first Play upload anyway, and it unblocks pre-registration.
    - Once pre-registration opens, the closing button and the hero status become Google's "Pre-register" badge in Spanish, and a text link in Catalan, which has no badge (WD9, AP-5).
- **Q-H1-2 · Put WD2's "free" line next to the hero button?**
  - **The evidence:**
    - WD2 placed the plans line under the demo, in the FAQ and in the closing card. So on a phone, "free" first appears at y ≈ 2090 (≈ 3.1 screens down), and never in the first screen.
    - The newcomer is "wary of being tricked into paying".
    - The guide asks for the basics within two phone screens (AT-6), the cost within a line of the primary action (CT-10), and a qualified "free" (PR-2, PR-3).
  - **Recommendation:** yes. Add only WD2's free half, as a third line under the hero status, so no new claim:
    - EN "Free with an account: 10 dictations a month, and tasks by hand with no limit."
    - ES «Gratis con una cuenta: 10 dictados al mes y tareas a mano sin límite.»
    - CA «Gratuït amb un compte: 10 dictats al mes i tasques a mà sense límit.»
  - **What it costs:** about 2 lines of the phone's first screen; the quote card slips below the fold. Pro stays where WD2 put it.
- **Q-H1-3 · "On your calendar" means TaskFlow's calendar, never Google Calendar. Say so?**
  - **The evidence:**
    - The H1, the description and the app's own pitch (`authPitch`, `app_en.arb:841`) all say "on your calendar".
    - The app only reads the phone's calendars and never writes tasks to them (`DeviceCalendarBridge.kt:18`; "They're only read here, never uploaded", `app_en.arb:164`).
    - A Comparer who lives in Google Calendar may expect the tasks to show up there, and on a work laptop.
  - **Recommendation:** leave the H1 as it is; it's the app's own words.
    - In the 5-person test (FN-7), ask "Where do you expect these tasks to appear?".
    - If anyone says Google Calendar, add one clause to the calendar card (`en.ts:61`, area F): EN "Your tasks stay in TaskFlow; your phone's events show beside them." The ES and CA wording would then be written to match.

### Cross-slice notes
- **G (evidence).** The WebKit renders named `home.en.*` show the Spanish home: the bare `/` followed WebKit's Spanish browser language (WD5). So WebKit has no English home and no explicit `/es/` or `/ca/` render (`artifacts/ux-web/webkit/INDEX.md`; `.claude/ux-web/webkit_renders.py`). Name the files by the final URL, or set the locale.
- **G (performance).**
  - The home's TBT is 926 ms in EN and 1120 ms in ES, against 388 ms in CA and ≤ 442 ms on every other page. One ES load had an LCP of 9.31 s (AUDIT §2, lab data). Worth re-running, and looking at the home's client JavaScript.
  - There's no desktop lab run. At 1440 px the hero image is probably the LCP element, and it loads lazily: deliberately, for the light and dark pair (`Phone.tsx:19-28`, WEB-311).
- **G (navigation).** On desktop, the header's "Try it with your voice" repeats the hero button's words and target in the same viewport (CT-2). It follows WEB-305's one-name rule, so I propose no change.
- **G and H2 (copy).** WEB-1206's «Muy pronto» / «Molt aviat» also sits in the meta (`es.ts:7`, `ca.ts:7`), the phone menu (`:23`) and the demo's hand-over (`es.ts:190`, `ca.ts:198`). WEB-1207's quote also sits in the demo's example (`es.ts:145`, `ca.ts:151`).
- **H2 (layout).** The demo's plans line is centred too (`src/styles/voice.css:571`, 4 lines on phones). The same fix as WEB-1203 applies.
- **F.** Q-H1-3's clause, if the owner wants it, belongs in the calendar card (`en.ts:61`).

### Memory notes
- **Site map (the pitch).**
  - `HomePage.tsx` order: hero (no id; region named by the H1) → `#voice` (VoiceDemo) → `#features` → `#questions` → `#get-taskflow` (closing card) → footer.
  - Hero: H1 `:12-15`, description `:16`, buttons `:17-27` (`#voice`, `#features`), status `:28`, quote card `:37-47`, `<Phone>` `:48`. Closing: `:156-173`.
  - Images: `public/images/hero-calendar-<lang>-<theme>.png`, 780 × 1688, byte-identical to `App/build/web-assets/calendar-hero.done.*`.
- **Measured positions** (from `audit.json` `pages[].collected.targets`, which holds x, y, width, height and gap):
  - `/es/` phone: hero button y 366 (222 × 50), demo start y 1596, closing button y 5132;
  - EN desktop: hero button y 630 (252 × 58), demo start y 1390, closing y 4159.
- **Claims map (the pitch).**
  - `en.ts:46-56` (ES and CA on the same lines): the outcome, one button, several at once, its day, reminders, Android, the status, the quote (`calendarTrySaying`), the alt text (`addTask`).
  - Closing card: `en.ts:128-134`, `es.ts:128-134`, `ca.ts:134-140`. WD2's line rests on `settings.py:144`, `app_en.arb:2332` and `:1981`.
- **Patterns.**
  - One filled primary per view, and every "Try it with your voice" goes to `#voice`.
  - The "not yet" line sits under the hero button.
  - ™ goes on the first visible "Android".
  - The closing card is WD2's free and Pro line, under a "coming soon" heading.
- **Techniques that worked.**
  - The `gap` in `audit.json` targets catches crowding that the AUDIT.md summary doesn't list.
  - Fold positions on other desktops can be computed from the 1440 positions plus `.hero { align-items: center }`.
  - Compare the hero images with the app's web assets by MD5.
- **Recurring problem types.**
  - Layouts tuned to the render's exact 1440 × 1000.
  - Centred multi-line text on phones.
  - Spanish and Catalan copy drifting from English in intensity or punctuation.
  - The app's quoted examples punctuated differently on the site.
