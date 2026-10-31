## UX web review — G: the global frame (navigation, header and footer, languages, performance, accessibility, search and sharing, light and dark), whole site — 2026-10-29

**Verdict:** Ship after fixes. The frame measures clean: axe, contrast and focus show 0 problems across 72 page rows, and every page has its own title, hreflang and preview in each language. Two things still need fixing:
- the phone menu doesn't close the way keyboard and Android users expect (WEB-1601, WEB-1602);
- the deletion address Play will show greets every Leaver in English (owner question Q-G1).

**Walked:**
- **Newcomer** (Spanish phone, from a WhatsApp link). The bare address redirects to `/es/` (307, WD5); then the header and «Menú», the language switch, the footer, and back. 6 steps.
- **Wrong URLs:** `/x/`, `/es/x/`, `/ca/x/`, `/en/` and `/en/privacy/` all reach the 404, then home or delete account. 2 steps.
- **Language switch and the way back** (3 journeys):
  - `/` → «Español» → Back;
  - `/es/` → «English», before hydration and without JavaScript;
  - `/privacy/` ↔ `/es/privacy/` → Back.
- **Phone menu:**
  - opened, then closed by a tap outside, Escape, a link and Android Back;
  - walked through by keyboard.
- **Desktop:** the header, the skip link, the anchors, the footer and «Back to top».
- **Leaver:**
  - from Google Play (`/delete-account/`, English) as a Spanish speaker;
  - from the home to the footer's delete link;
  - from the 404 and privacy (1 tap).
- **Assistive technology:**
  - 72 keyboard walks, landmarks and headings (AUDIT §9–§14);
  - 200% text and zoom, 320 px;
  - forced colours (from the code);
  - screen-reader names.
- **Search and sharing:** title, description, canonical, hreflang, og and twitter tags and `lang` for 18 page × language rows, and the three preview images.
- **Coverage:**
  - viewports: desktop 1440, phone 390 and 320, desktop and phone at 200% text, 200% zoom;
  - light and dark; EN, ES and CA;
  - WebKit renders compared with Chromium;
  - people: Newcomer, Comparer, assistive-technology user and Leaver.

**Numbers:**
- **The frame in the first viewport:**
  - phone: 2 controls (logo, «Menú»);
  - desktop: 8 controls (logo, 3 section links, 3 languages, theme) and about 12 words;
  - 0 filled buttons in the header, so the hero keeps the only primary.
- **Tab stops before the content:** 9 on desktop, 3 on a phone. The skip link is stop 1 in all 72 walks (AUDIT §14).
- **Taps to change language:**
  - desktop: 1 (header);
  - phone: 2 («Menú» → language);
  - legal pages: 1 (the page's own pill, in the first screen; on delete-account it sits under the request box);
  - the footer switch is about 8.3–8.5 phone screens down the home.
- **Steps from any page to account deletion:**
  - 404 and privacy: 1 tap, in the first screen;
  - home: 1 tap after about 8.3 phone screens (EN page 5814 px; ES 8.5) or 4.6 desktop screens;
  - the phone menu doesn't offer it;
  - from Play: 0 taps, but in English for everyone (Q-G1).
- **Wrong URLs:**
  - `/x/`, `/es/x/` and `/ca/x/` give a 404 in the address's language, 1 tap from home or deletion;
  - `/en/…` gives the English 404 (the English pages live at `/…`), 1 tap from home.
- **Metadata:**
  - all 15 public page × language rows have their own title and description, a canonical, hreflang en/es/ca/x-default, og:locale with alternates, and og and twitter tags;
  - the three 404s share one three-language title by design (WEB-1607).
- **Audit** (AUDIT, Chromium, measured 2026-10-28 and 29 on the production build with `SITE_URL`):
  - axe: 0 violations on 72 page rows;
  - 2.5.8: 0 failures;
  - text contrast: 0 failures (lowest 4.87:1 light, 6.21:1 dark); control contrast: 0;
  - focus not visible, hidden or clipped: 0 in 72 walks;
  - sideways scroll or clipped text: 0 in 72 text200, zoom200 and 320 px rows;
  - duplicate landmark name: 18 of 18 desktop rows (WEB-1606).
- **Lab performance** (lab, not field (PF-2): Lighthouse mobile throttling, local server, no CDN):
  - LCP: medians 1.42–1.94 s on all 18 rows. One `/es/` run reached 9.31 s after a 7.76 s first byte (the first request; cause likely server-side);
  - CLS: 0.000 everywhere;
  - TBT: medians 341–1120 ms on the homes (single runs 157–1687 ms, too noisy to report), 127–442 ms elsewhere;
  - JavaScript: 151–164 KB transferred (8–9 files); one 24 KB font, arriving before first paint.
- **Frame claims:** 13 checked; 0 false, 0 outdated; 1 named differently from the app (WEB-1605).

**Attention:** predicted from the renders, not measured (EY-7; GUIDELINES §21 step 4).
- **`home.{en,es,ca}.desktop.{light,dark}.fold.png`:**
  - fixations: 1) the H1, top left, largest and darkest; 2) the phone and the quote card in the right half (the right side gets its first look after about 2–3 s); 3) the filled «Try it with your voice» button, left;
  - from the frame, only the ringed current language and the moon circle compete: ringed, but small and in the top-right corner. The muted 16 px section links lose to the H1;
  - the primary action is third by position and fill.
- **`home.{en,es,ca}.mobile.{light,dark}.fold.png`:**
  - fixations: 1) the H1, top half; 2) the filled primary button, middle band (y ≈ 366–416); 3) the description, or the quote card in the bottom third (discounted);
  - the outlined «Menú» pill at the top right is bold and high-contrast, so it likely gets an early glance, but it's an outline and not a call to action;
  - «Muy pronto en Google Play…» sits in the bottom third (y ≈ 430–470).
- **`home-menu.en.mobile.{light,dark}.fold.png`, `privacy-menu.es.mobile.light.fold.png`:**
  - fixations: 1) the ringed current language; 2) the first row, «Try it with your voice →»; 3) the ringed «✓ Light»;
  - the panel covers the hero's button (WEB-1601);
  - nothing on it says how to close it (WEB-1602).
- **`not-found.{en,es,ca}.{desktop,mobile}.{light,dark}.fold.png`:**
  - fixations: 1) the h1 in the address's language; 2) «Go to the TaskFlow home page →», in bold; 3) «Delete account →», or the next language's h2;
  - the way back is among the first three in every language.
- **Legal pages:**
  - on a phone, the frame's logo and «Menú» never outrank the h1;
  - on desktop, two language switches share the first view (cross-slice note for L).
- **Five-second test, frame only:**
  - Q4 (what would I tap?): always the hero's button, never a header control;
  - Q6 (an unknown word): none in the frame («Menú», language names, «Muy pronto en Android»).

### Findings (most severe first)

**WEB-1601 · Severity 2 · Tabbing out of the open phone menu hides focus behind it**
- **Where:**
  - `src/components/Header.tsx:20-37`: the menu closes only on Escape, a tap outside or a link inside. Nothing closes it when focus leaves;
  - `Header.tsx:22-25`: Escape always sends focus back to «Menu»;
  - the panel: `src/styles/global.css:1068-1081`;
  - every page and language wherever the phone menu shows (≤ 64em: phones, and desktops at 200% zoom or 200% text), light and dark;
  - render `home-menu.en.mobile.light.fold.png`: the open panel ends at about 412 CSS px and covers the hero's «Try it with your voice». Only its bottom edge shows.
- **The moment:** a keyboard user opens «Menu», tabs through the languages, the four links and Light/Dark, then presses Tab once more: "Where did the focus go?" They might be on a desktop zoomed to 300–400%, or on a phone with a keyboard or switch access.
- **What happens:**
  - the menu stays open, and focus moves to the hero's button underneath it;
  - Escape closes the menu but jumps focus back to «Menu», so the reader also loses their place.
- **Why it fails:**
  - WCAG 2.4.11 Focus Not Obscured (Minimum), AA. W3C's Understanding document says "An open dropdown that does not close when no longer focused is not following this convention". It excuses content the user opened only when the user can reveal the focused item "without advancing the keyboard focus" (AX-4, NV-3);
  - the audit can't catch it: AUDIT §10 and §14 tab with the menu closed (AX-11).
- **Fix:**
  - in `Header.tsx`'s effect, close the menu on `focusout` from the `<details>` when `event.relatedTarget` is an element outside it;
  - ignore `null`: Safari sends it when a tap doesn't move focus, and closing then would swallow the tap on «Dark»;
  - in the Escape handler, move focus to the summary only if focus was inside the menu;
  - no copy change.
- **Verify:**
  - Playwright, mobile project (390 × 664) and a 320 × 256 viewport (WCAG's 400% reference): open the menu by keyboard and Tab past «Dark» / «Oscuro» / «Fosc»;
    - `details.header-menu` is closed;
    - the hero's primary link is focused;
    - `elementFromPoint` at its centre returns it;
  - with the menu open and focus on a page link, Escape closes the menu and focus stays;
  - the existing Escape test (`tests/ux-web-global.spec.ts:423-426`) still passes: focus inside the menu goes back to «Menu»;
  - then a real keyboard in Chrome at 400% zoom.
- **Evidence:** verified in code; the covered button is seen in a current render; the focus path itself is inferred and needs a browser check.

**WEB-1602 · Severity 2 · Android Back with the phone menu open leaves the site**
- **Where:**
  - `src/components/Header.tsx:62-84`: a `<details>` menu that doesn't respond to the platform's close request (Esc, Android Back);
  - `Header.tsx:63-66`: the summary keeps its ≡ icon when open; only its fill changes (`src/styles/global.css:1065-1067`);
  - every page, on phones, light and dark;
  - renders: `home-menu.en.mobile.light.fold.png`, `home-menu.en.mobile.dark.fold.png`, `privacy-menu.es.mobile.light.fold.png`.
- **The moment:** the Newcomer opened «Menú» by accident: "How do I close this?" They swipe back, as every Android app has taught them, and they're in WhatsApp again.
- **What happens:**
  - nothing on the open panel looks like "close": the pill keeps ≡ and the word «Menú»;
  - Android's Back doesn't close a `<details>`, so it goes back in history and leaves the page. Someone who came from a link leaves the site.
- **Why it fails:**
  - NV-8: familiar patterns in familiar places;
  - OL-1: every step can be undone;
  - OL-4 / COGA: familiar design;
  - MDN: built-in `<dialog>` and popover elements close on the platform's close action (Esc, Android's back button), and `CloseWatcher` lets a custom component do the same.
- **Fix:**
  - **(1)** when the menu opens (`toggle` event) and `"CloseWatcher" in window`:
    - create a `CloseWatcher` whose `close` closes the menu;
    - destroy it when the menu closes any other way;
    - return focus to the summary only if focus was inside the menu.
  - **(2)** while the menu is open, the pill shows ✕ instead of ≡:
    - add `close: ["M6 6l12 12", "M18 6 6 18"]` to `src/components/Icon.tsx`;
    - swap the two icons with `.header-menu[open]` in CSS, which works without JavaScript;
    - keep the word «Menu» / «Menú» so the control's name doesn't change (2.5.3).
  - No new strings.
- **Verify:**
  - a browser test with a stubbed `CloseWatcher`:
    - opening the menu creates a watcher;
    - its `close` closes the menu;
    - closing by a tap, Escape or a link destroys it;
  - renders of the open menu (EN light and dark, ES) show ✕;
  - device check: in Chrome on Android, open «Menú» and swipe back. The menu closes and the page stays. Playwright can't send Android's Back.
- **Evidence:** verified in code; the behaviour is inferred from the platform (MDN, CloseWatcher) and needs a real Android phone.

**WEB-1603 · Severity 1 · Choosing English on the home can bounce back to Spanish**
- **Where:**
  - `src/components/LanguageSwitch.tsx:15-18, 43`: the choice is saved only by the link's `onClick`, that is, once JavaScript has hydrated;
  - `src/proxy.ts:6-9, 49-51`: the bare `/` redirects by cookie, then by Accept-Language, and every answer carries `Cache-Control: private, no-store`;
  - the English home `/`, and the «English» link of every language switch.
- **The moments:**
  - **(a)** a visitor whose phone is in Spanish taps «English» while the page is still loading, or with JavaScript off: "I picked English and it's still Spanish";
  - **(b)** a visitor on the English home taps «Español», then presses Back: still Spanish. A second Back leaves the site.
- **What happens:**
  - **(a)** there's no cookie yet, so `/` redirects to `/es/` by Accept-Language;
  - **(b)** the cookie now says `es`. `no-store` keeps `/` out of the back/forward cache in most browsers, so Back asks the server again and is redirected to `/es/`.
- **Why it fails:**
  - ML-1 (the visitor can always switch) and ML-4 (the choice is remembered);
  - WD5 says a choice made in the switch "always wins", but here it's lost before it's saved;
  - lens H: the way back.
- **Fix:**
  - **(1)** the switch's link to the bare home carries the choice: `/?lang=en` (the links to `/es/` and `/ca/` never redirect, so they stay).
    - `proxy.ts` treats `lang=en|es|ca` as the visitor's choice;
    - it sets `taskflow-lang` as the switch does (1 year, `SameSite=Lax`, `Secure` on https);
    - it redirects 307 to the clean address.
  - **(2)** the English answer (`NextResponse.next()`) gets `Cache-Control: private, no-cache` instead of `no-store`, so Back can restore it from the back/forward cache:
    - the 307 redirects keep `no-store`, as `tests/ux-web-global.spec.ts:155-156` checks;
    - `Vary` and `private` still keep shared caches from mixing languages.
  - No copy change. Privacy §8's cookie sentence stays true.
- **Verify:**
  - Playwright with JavaScript off and `Accept-Language: es`: on `/es/`, «English» leads to `/` with the English h1, and the cookie `taskflow-lang=en` is set;
  - Playwright with JavaScript on, the same before hydration;
  - Back: in a real Chrome on Android, `/` (English) → «Español» → Back shows the English home. Playwright's Chromium runs without the back/forward cache by default, so it can't prove this part.
- **Evidence:** verified in code; the behaviour is inferred (back/forward cache rules differ by browser) and needs a browser check.

**WEB-1604 · Severity 1 · The sticky header eats a quarter of short screens**
- **Where:**
  - `src/styles/global.css:259-265`: `.site-header { position: sticky }` at every height;
  - `global.css:34` and `:1225`: `scroll-padding-top` of 105 px and 90 px;
  - every page and language, on a phone held sideways (about 360–390 CSS px tall) and on a desktop at 400% zoom (WCAG's 320 × 256 reference).
- **The moment:** someone zoomed to 400%, or reading the FAQ with the phone sideways: "I only see a few lines at a time."
- **What happens:**
  - the 73–87 px header stays on screen: about 21–22% of a phone held sideways and 28% of a 320 × 256 viewport, on top of the browser's own bars;
  - at 390 × 664 it's 11%, and at 320 × 568 13%, which is fine.
- **Why it fails:**
  - NV-3: a small sticky header;
  - W3C's Understanding 1.4.10 Reflow: "It is strongly suggested that at smaller viewport sizes that such components are modified to have static positioning" (advisory technique C34, un-fixing sticky headers);
  - this is advisory, not a failure: polish for the assistive-technology person.
- **Fix:** after the width rules, add `@media (max-height: 480px) { .site-header { position: relative; } :root { scroll-padding-top: 16px; } }`.
  - It's `relative`, not `static`, so the open menu keeps the header as its anchor: `.header-menu-panel` is `position: absolute` (`global.css:1068`);
  - at 480 px, the desktop at 200% zoom (720 × 500) stays sticky.
- **Verify:**
  - renders at 844 × 390 and 320 × 256:
    - after scrolling, the header is gone;
    - a jump to «Preguntas» puts its heading at the top;
    - «Menú» still opens under the header at the top of the page;
  - 390 × 664 and 720 × 500 are unchanged (sticky).
- **Evidence:** verified in the CSS; inferred for these sizes, which have no render. Needs a 400% zoom and a landscape-phone check.

**WEB-1605 · Severity 1 · The footer calls the Privacy Policy "Privacy", in small print**
- **Where:**
  - `src/content/site/en.ts:35` ("Privacy"), `es.ts:35` («Privacidad»), `ca.ts:35` («Privacitat»);
  - `src/styles/legal.css:319-325`: `.site-footer .footer-legal { font-size: 0.875rem }`;
  - every page's footer, light and dark;
  - render: `home.es.mobile.light.full.png`, last screen.
- **The moment:** a Leaver over 60 is looking for what happens to their data. The app's setting said «Política de privacidad»; the footer's 14 px row says «Privacidad».
- **What happens:**
  - the footer's other legal links use the documents' full names («Términos y condiciones», «Aviso legal»);
  - the legal pages' sidebar and h1 say «Política de privacidad»;
  - the app names its link "as the site titles the page" (`App/lib/l10n/app_en.arb:376-378`, `app_es.arb:215`, `app_ca.arb:194`);
  - only the footer says «Privacidad», and the legal links are 14 px small print, although they're what the Leaver came for.
- **Why it fails:**
  - PV-2: "named the same everywhere … not shrunk";
  - FN-2: the app's names for things;
  - lens G: one concept, one name;
  - RD-5: small print is for the © line, not the links people need.
- **Fix:**
  - footer labels: EN "Privacy Policy", ES «Política de privacidad», CA «Política de privacitat» (the app's `privacyPolicy`);
  - `.site-footer .footer-legal { font-size: 1rem }`; the operator, © and trademark lines stay 0.875rem;
  - update `tests/website.spec.ts:50`, which clicks "Privacy" exactly.
- **Verify:**
  - in each language, the footer link reads the same as the legal sidebar's first related link;
  - the computed size is 16 px;
  - 320 px renders: the legal row wraps with gaps of at least 8 px and nothing scrolls sideways;
  - AUDIT §5: no new target under 44 px.
- **Evidence:** verified in code and in the app's ARB files; seen in current renders.

**WEB-1606 · Severity 1 · Two navigation landmarks named "Language" on desktop**
- **Where:**
  - `src/components/LanguageSwitch.tsx:32-34`: it is always a `<nav aria-label={label}>`, used in `Header.tsx:60` and `Footer.tsx:54`;
  - AUDIT §9 (`AUDIT.md:534-568`): «navigation "Language" appears 2 times» on all 18 desktop page rows;
  - legal pages add a third switch, "Document language".
- **The moment:** a screen-reader user lists the landmarks and hears "Language navigation… Language navigation": which one is the header's?
- **What happens:**
  - every desktop page has two navigation landmarks with the same name;
  - on phones, the header's switch is hidden in the closed menu, so only the footer's remains.
- **Why it fails:** repeated landmarks need unique labels (WAI-ARIA landmark practice; AX-5, lens K). It isn't a WCAG failure by itself: 1.3.1 holds.
- **Fix:**
  - `LanguageSwitch` gets an `as="group"` option that renders `<div role="group" aria-label={label}>` instead of `<nav>`;
  - `Footer.tsx:54` uses it, and the header and the menu keep `<nav>`;
  - no visible change and no new strings;
  - update `tests/ux-web-frame.spec.ts:261-262`, which finds the footer's switch by the `navigation` role.
- **Verify:**
  - AUDIT §9: no "appears 2 times" on desktop rows;
  - Playwright: one navigation named "Language" / «Idioma» / «Idioma» on desktop, and a group with that name in the footer.
- **Evidence:** measured (AUDIT §9).

**WEB-1607 · Severity 1 · The 404's title reads three languages, English first**
- **Where:**
  - `src/app/not-found.tsx:5-6`, `src/components/NotFoundPage.tsx:16-18`;
  - AUDIT §11 (`AUDIT.md:685-687`);
  - missing pages under `/es/…` and `/ca/…`;
  - the title says «No hem trobat la pàgina», while the Catalan h1 says «No hem trobat aquesta pàgina» (`src/content/site/ca.ts:12`).
- **The moment:** a Catalan screen-reader user follows a broken link. The first thing they hear, in a Catalan voice, is "Page not found · Página no encontrada · No hem trobat la pàgina — TaskFlow".
- **What happens:** the 404 is prerendered once, so its `<title>` holds all three languages, English first, while the page itself puts the address's language first.
- **Why it fails:**
  - AX-5: a unique, translated `<title>` (WCAG 2.4.2);
  - ML-8 and ML-5.
- **Fix:**
  - in `NotFoundPage`'s effect, also set `document.title = \`${copy[current].notFound.title} — TaskFlow\``:
    - EN "Page not found — TaskFlow";
    - ES «Página no encontrada — TaskFlow»;
    - CA «No hem trobat aquesta pàgina — TaskFlow»;
  - keep the static three-language title for visits without JavaScript, with «No hem trobat aquesta pàgina» to match the h1;
  - no new strings.
- **Verify:**
  - Playwright: `/ca/no-such-page/` has the title «No hem trobat aquesta pàgina — TaskFlow»;
  - the same for ES and EN;
  - with JavaScript off, the static title.
- **Evidence:** measured (AUDIT §11) and verified in code.

**WEB-1608 · Severity 1 · High-contrast mode hides which language is current**
- **Where:**
  - `src/styles/global.css:342-346`: the current language's ring is a `box-shadow`;
  - `global.css:1394-1403`: the forced-colours block only borders `.button`, `.brand-mark`, `.hero-stage` and `.orbit`;
  - every language switch: header, menu, footer, and the legal pages' pill (the same component).
- **The moment:** a low-vision visitor with Windows' contrast themes on: "Which language am I in?"
- **What happens:**
  - forced colours remove box shadows and the pill's fill, so the current language differs from the others only by weight (800 against 650);
  - the menu's pressed «✓ Light» keeps its check icon, so it stays clear.
- **Why it fails:**
  - AX-2: a control's state shown at 3:1 (1.4.11); lens K;
  - polish for the assistive-technology person, not a 1.4.1 failure, since the weight differs.
- **Fix:** in the `@media (forced-colors: active)` block, add `.language-switch a[aria-current="page"] { outline: 2px solid CanvasText; outline-offset: -2px; }`.
- **Verify:** Playwright `emulateMedia({ forcedColors: "active" })`, screenshots of the desktop header and the open menu in light and dark:
  - the current language is outlined;
  - the focus ring still shows when it's focused.
- **Evidence:** verified in code; inferred, since no forced-colours render exists.

**WEB-1609 · Severity 1 · One-word last lines in the footer and the 404**
- **Where:**
  - `src/content/site/{en,es,ca}.ts:41` (`footer.trademark`);
  - `src/components/Footer.tsx:47-52` (`.footer-fine`, inside `.footer-bottom` at `src/styles/global.css:922-932`, which has no wrapping rule);
  - `global.css:982-986` (`.not-found p`);
  - renders:
    - `home.es.mobile-w320.light.full.png` and `home.ca.mobile-w320.light.full.png`, last screen: «…de Google» / «LLC.»;
    - `not-found.en.mobile.light.fold.png`: "…on the TaskFlow" / "website.".
- **The moment:** a lone «LLC.» splits the company's name, and a lone "website." hangs at the end of the 404's sentence.
- **Why it fails:** since WEB-1105, the site's pattern gives `text-wrap: pretty` to any paragraph that can end on one word. Polish (lenses F and G).
- **Fix:**
  - a no-break space inside "Google LLC" in all three `footer.trademark` strings:
    - EN "Android is a trademark of Google LLC.";
    - ES «Android es una marca comercial de Google LLC.»;
    - CA «Android és una marca comercial de Google LLC.»;
  - `text-wrap: pretty` on `.footer-fine p` and `.not-found p`.
- **Verify:**
  - 320 px renders, ES and CA: "Google LLC." stays on one line;
  - EN 404 at 390 px: the last line has 2 words or more;
  - older Safari ignores `pretty`; that's a harmless device check.
- **Evidence:** seen in current renders.

### Claims checked

| Claim (page, `path:line`) | Source of truth (`path:line`) | Status |
|---|---|---|
| Every home's description and preview text: "Note down what you need to do, and TaskFlow puts it on your calendar. Say several things at once. For Android phones, coming soon to Google Play." (`src/content/site/en.ts:6-7`, `es.ts:6-7`, `ca.ts:6-7`) | `.claude/ux-review/DECISIONS.md:195` (several tasks in one dictation); `.claude/ux-web/DECISIONS.md:100` (Play not published), `:65` (WD7) | true |
| Phone menu «Coming soon to Android» → the closing card (`en.ts:23`, `Header.tsx:78-80`) | `.claude/ux-web/DECISIONS.md:100`, `:65` | true |
| Preview picture: the app's Calendar with «Llamar al dentista» and «Comprar pan» (`src/og/preview.tsx:13-14`, `opengraph-image*.png`) | WD4 (`.claude/ux-web/DECISIONS.md:60`); the app's renders | true; a dated sample ("Friday, October 23"), to re-render before publishing (WEB-5, WEB-114) |
| Preview alt "…with “Call the dentist” and “Buy bread” on tomorrow" (`en.ts:8-9`, ES and CA likewise) | the picture | true |
| Footer "A product by GARBAR, IN-TEC, S.L." (`en.ts:40`, `Footer.tsx:27-29`) | `src/content/legal/company.json:2` | true |
| Footer «Email support» → `taskflow.support@garbar.tech` (`Footer.tsx:44`, `en.ts:39`) | CLAUDE.md, Email (support, privacy and deletion requests); `company.json:7` | true |
| Footer «Delete account» / «Eliminar cuenta» / «Suprimeix el compte» (`en.ts:38`, `es.ts:38`, `ca.ts:38`) | `App/lib/l10n/app_en.arb:2423`, `app_es.arb:1231`, `app_ca.arb:935` | true, the app's words |
| Footer «Terms and Conditions» / «Términos y condiciones» / «Termes i condicions» (`en.ts:36` and likewise) | `app_en.arb:380`, `app_es.arb:216`, `app_ca.arb:195` | true, the app's words |
| Footer «Privacy» / «Privacidad» / «Privacitat» (`en.ts:35` and likewise) | `app_en.arb:376-378`, `app_es.arb:215`, `app_ca.arb:194` ("Privacy Policy", "named as the site titles the page") | named differently (WEB-1605) |
| Phone menu «Appearance: Light / Dark» (`en.ts:26-28` and likewise) | `app_en.arb:281-283`, `app_es.arb:177-179`, `app_ca.arb:156-158` | true, the app's words |
| "Android is a trademark of Google LLC." (`en.ts:41`) | `.claude/ux-web/DECISIONS.md:90` | as decided |
| 404: "This address doesn't exist on the TaskFlow website." (`en.ts:13`) | the routes | true |
| The app's links into the site: `/privacy/` and `/terms/` in EN, ES and CA, with the trailing slash (`App/lib/services/site_links.dart:23-30`) | `src/app/privacy/page.tsx`, `src/app/terms/page.tsx`, `src/app/[language]/[document]/page.tsx` | exist |

### Missing from the site (app features worth telling)
None in the frame. Feature claims belong to review F.

### Keep
- **The header:**
  - one sticky header that stays on one row at every width, text size and zoom;
  - the phone menu named in words («Menú»), with the primary action always outside it (NV-1).
- **Language and metadata:**
  - each language is named in itself with its own `lang`, the switch keeps the same page, and the current language is marked by weight and a ring;
  - `<html lang>`, canonical, hreflang with x-default, og:locale and alternates are right on all 15 public page rows.
- **Link previews:** one per language, with the real app screen; the legal pages carry their own titles and descriptions in their language.
- **Light and dark:**
  - both themes are designed, and the theme never flashes;
  - a dark first visit without JavaScript stays dark;
  - contrast never falls below 4.87:1.
- **The 404:**
  - the address's language comes first;
  - the way home and to account deletion are offered in all three languages;
  - no layout shift (CLS 0).

### Questions for the owner

**Q-G1 · The Leaver from Google Play lands on the English deletion page (WD13, WD5)**
- **The problem:**
  - WD13 gives Play `/delete-account/`, and WD5 lets only the bare `/` follow the browser's language (`src/proxy.ts:55`, matcher `/`). So every Spanish and Catalan Leaver who arrives from Play reads English;
  - on a phone, the first screen's only language control is inside «Menu», and the page's own language pill sits under the request box (`delete-account.en.mobile.light.fold.png`);
  - by the guide this is Severity 3 ("an entry page that isn't in the visitor's language"), on the page Play requires (PV-7).
- **Options:**
  - **(a)** extend WD5 to `/delete-account/` only: cookie, then Accept-Language, with English as the fallback and x-default; canonicals and hreflang unchanged;
  - **(b)** give Play `/es/delete-account/`;
  - **(c)** keep the address and move the page's language pill above the request box. That's review L's layout; the pill went under the box so the email button fits the first screen at 320 × 568 (WEB-204).
- **Recommendation:** (a). The address Play shows then opens in each Leaver's language with no extra tap, by the same mechanism as the home's.

**Q-G2 · Before launch, robots.txt hides the `noindex` (a launch checklist item, not a request to index)**
- **The problem:**
  - until `SITE_INDEXABLE`, `src/app/robots.ts:7-9` serves `Disallow: /`, and every page also says `noindex`;
  - Google Search Central ("Block Search indexing with noindex"): when robots.txt blocks the crawler, "the crawler will never see the noindex rule, and the page can still appear in search results";
  - link-preview bots that obey robots.txt can't draw a preview either.
- **Recommendation:** whenever the site is reachable before launch, serve `Allow: /` and keep the `noindex` meta. At launch, set `SITE_INDEXABLE=true` as planned.

### Still open in the ledger (area G, not new)
- **WEB-801** (open, S2):
  - `src/styles/voice.css:18-27` is unchanged (`flex-shrink: 0`, no wrapping), so the ES and CA "tries left" badge still can't shrink at doubled text;
  - it can't be re-measured in this run: the demo states are rendered only in English at 100% text.
- **WEB-701** (decision needed): WebKit draws thin weights again in `webkit/` (WD15).
- **Device checks:**
  - **WEB-302:** add a WhatsApp preview of the bare `taskflow.garbar.tech` sent from a Spanish phone. `/` answers with English tags unless the preview fetcher sends a Spanish Accept-Language (`src/proxy.ts:6-9`), so a Spanish chat may see an English preview of a link that opens in Spanish;
  - no regression in the current renders and AUDIT for WEB-304, WEB-307, WEB-309, WEB-313, WEB-702, WEB-707, WEB-712, WEB-713, WEB-715 and WEB-902:
    - 404 CLS 0.000;
    - the header stays on one row at 200% text, desktop and phone;
    - no font size in px but the logotype's cap;
    - `lang` es and ca on the Spanish and Catalan pages.

### Cross-slice notes
- **L:** on desktop legal pages, two language switches share the first view: the header's and the page's pill (`focus/privacy.ca.desktop.dark.01.png`). At ≥ 64em the pill could go; on phones it's the only visible one, so keep it there.
- **L:** the legal sidebar's links are 36.4–39 px tall on desktop (AUDIT §5, 84 rows). 2.5.8 passes, but they're under TaskFlow's 44 px bar.
- **L:** the legal pages, `/delete-account/` included, share with the home's marketing picture ("Say it, and it's on your calendar"). Their English `og:image` URL also lacks the home's cache-busting hash (`src/content/legal/index.ts:200-211`), so chat apps may keep an old picture after a re-render.
- **H2:** `p.voice-example-label` is 14 px (AUDIT §6, CA «Per exemple, digues:»).
- **All reviewers:**
  - `webkit/home.en.*` show the Spanish home: Windows WebKit sends `Accept-Language: es`, so WD5's redirect applied;
  - there's no WebKit render of `/es/`, `/ca/` or the localized 404s;
  - INDEX.md's "No WebKit renders" line is stale.

### Evidence notes
- **Freshness:** the renders and AUDIT are dated 2026-10-28 17:57 (CET), from the production build with `SITE_URL`. That's after the last change to every file in scope (the newest is `global.css`, 2026-10-22). The WebKit renders are dated 2026-10-29 08:59. All current.
- **Measured in Chromium:** AUDIT §2–§14.
- **Inferred from code, not measured:**
  - the open menu by keyboard, and Android Back;
  - forced colours, 400% zoom and landscape phones;
  - Back after a language switch;
  - the bare address's link preview.
- No device or screen reader was used. Performance is lab data (PF-2).

### Memory notes
- **Phone menu:** a `<details>` (`Header.tsx:62-84`) that closes on Escape (focus back to the summary), a tap outside or a link click. It has no focusout handler and no close watcher. AUDIT §10 tabs with the menu closed, so the menu's focus paths are untested (WEB-1601, WEB-1602).
- **Language routing:**
  - only `/` negotiates (proxy matcher `/`);
  - the choice is saved only by the switch's `onClick`;
  - every answer for `/` is `private, no-store`;
  - `/en/…` addresses are 404s.
  - Playwright's Chromium runs without the back/forward cache, so Back-button behaviour needs a real browser.
- **WebKit evidence:** Windows WebKit sends a Spanish Accept-Language, so `webkit/home.en.*` show `/es/`. Check the h1's language before trusting a WebKit "en" render.
- **Lab TBT:** noisy on the homes (157–1687 ms across 3 runs; medians 341–1120 ms), and one `/es/` run had a 7.8 s first byte. Don't report TBT without repeated runs.
- **Footer:**
  - it's 14 px small print (`legal.css:319-325`);
  - the trademark line leaves «LLC.» alone at 320 px in ES and CA;
  - the duplicate "Language" landmark shows on every desktop row of AUDIT §9.
- **The app's names:** "Privacy Policy" / «Política de privacidad» / «Política de privacitat» (`privacyPolicy`, "named as the site titles the page"). Delete account, Terms and Conditions, and Appearance / Light / Dark match the footer and the menu.
- **Ledger:** WEB-801 stays open and can only be re-measured if the demo states are rendered in ES and CA at doubled text.
