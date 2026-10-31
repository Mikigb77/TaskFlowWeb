## UX web review — L: legal, privacy, terms, delete-account and trust (run 2026-10-28-site, whole site) — 2026-10-29

**Verdict:** Ship after fixes. Seen as the Leaver, the delete page is true to the app and to `Backend/docs/ACCOUNT_DELETION.md` in all three languages, and every measured check on the 12 legal pages is clean. But Google Play's deletion link, `/delete-account/`, would open an English page whose language choice sits below the first phone screen. The privacy summary also still says words reach Google's AI only "to add, find or change tasks", though Pro reminders asked for in your own words go there too and stay on the server.

**Walked** (people: Leaver first, then Newcomer, Comparer and assistive-technology user; EN, ES, CA; light and dark):
- **Leaver from Google Play** (from launch; WD13 gives Play `/delete-account/`, which always serves English, `src/proxy.ts:55`):
  - English: 1 tap on «Write a deletion request», then Send. The in-app route is in the first screen too.
  - Spanish or Catalan: the first screen is all English. «Español» is about 190 px below it at 390 × 664 (`delete-account.en.mobile.light.full.png`, screen 2), or inside Menu.
  - That's 3 actions (scroll, «Español», the button), versus 2 in the first review (2026-10-19), when the switch was in the first screen.
- **Leaver from the app:**
  - In the app: Ajustes → Cuenta → Eliminar cuenta. That's 3 taps plus the password or Google; the site's path matches the app's labels in all three languages.
  - Through the site: the app's Privacy link opens `/es/privacy/` (`App/lib/services/site_links.dart:23-30`), where «Eliminar cuenta» is in the first screen. 1 tap.
- **Leaver from a legal page or the 404:** 1 tap. Every legal page has «Delete account» in its first screen; the 404 has a delete link in each language's block (`src/components/NotFoundPage.tsx:32-37`).
- **Leaver from the home:** the footer's «Eliminar cuenta» is at the end of 8.9 phone screens (ES). 1 tap after scrolling.
- **Leaver from a search:** after launch, the hreflang set sends Spanish searches to `/es/delete-account/`. Indexing is off on purpose until then.
- **Comparer and Newcomer:**
  - Privacy: the H1 and summary 01 are in the first phone screen, summary 02 just below it.
  - Who runs TaskFlow: «Un producto de GARBAR, IN-TEC, S.L.» in every footer; the legal notice's company card is on screen 2.
- **Assistive technology:** AUDIT §9 (landmarks, names), §10 and §14 (tab order: 32–57 stops, focus visible on all of them, none hidden), §12 (headings, no problems).
- **Viewports and states:**
  - Chromium 390 × 664 and 1440 × 1000, light and dark;
  - 320 × 568, desktop at 200% zoom, text at 200% (desktop and phone);
  - the phone menu open on `/es/privacy/`;
  - WebKit, iPhone and desktop: same layout as Chromium; the thin weights are WD15's Windows-WebKit artifact, not reported.

**Evidence:**
- **Renders:** made 2026-10-28 17:57 and WebKit 2026-10-29 08:59. AUDIT measured 2026-10-28 16:57 – 2026-10-29 07:56 UTC.
- **Code:** the legal sources last changed 2026-10-22 13:20 (44e9921), so every render is current. `ux-web.sh since` shows no change since the last web review in `src/content/legal/`, `LegalPage.tsx` or `legal.css`.
- **App side:** `Backend/docs/REMINDER_PLANS.md` changed since then (every reminder personal); `ACCOUNT_DELETION.md` didn't.
- **Crops:**
  - `artifacts/ux-web/crops/delete-account.en.mobile.light.full.s2-3.png`;
  - `privacy.es.mobile.light.full.s2-4.png`;
  - `privacy.ca.mobile-w320.light.full.s4-5.png`;
  - `home.es.mobile.light.full.s8-9.png`.
- **Limits:** lab performance only (PF-2). A clean automated row isn't a pass for a person (AX-11). TalkBack, VoiceOver and Safari on a real iPhone remain device checks.

**Numbers:**
- **Delete page, first phone screen (390 × 664, EN):**
  - ≈ 75 words, 1 filled button (the email request, y ≈ 434–492), 1 text link (Back to TaskFlow), Menu.
  - Language switch in it: no (y ≈ 852–910; lower still in ES/CA).
  - Scrolls to the email button: 0 at 390 × 664, and 0 at 320 × 568 in EN/ES/CA (EN ends ≈ 499, `delete-account.en.mobile-w320.light.fold.png`).
- **From Play's link to a deletion request:** EN 1 action; ES/CA 3 now. That becomes 2 after WEB-1501, and 1 if the owner answers Q-L1 yes.
- **From any legal page to the delete page:** 1 tap, in the first screen, in every language.
- **Legal pages at 390 px:**

  | Page | Phone screens (EN / ES / CA) | Words (EN / ES / CA) |
  |---|---|---|
  | Privacy | 25.1 / 25.2 / 23.9 | 2,659 / 2,680 / 2,546 (was 2,396 / 2,367 / 2,207 on 2026-10-19) |
  | Terms | 16.7 / 15.7 / 14.5 | 1,562 / 1,350 / 1,173 |
  | Delete account | 9.9 / 10.3 / 10.2 | 778 / 807 / 820 |
  | Legal notice | 5.9 / 5.8 / 5.7 | 270 / 249 / 229 |

  Words are counted from `src/content/legal/*.ts`.
- **AUDIT on the 12 legal pages, light and dark:** 0 axe violations; 0 text or control contrast failures; 0 focus problems; no sideways scroll or clipped text at 320 px, 200% zoom or 200% text. The 84 targets under 44 px are desktop sidebar links (36–39 px, mouse only); there are none on phones.
- **Claims:** 28 checked · 0 false · 4 outdated or incomplete · 2 unverifiable (one depends on the other session's uncommitted backend work).

**Attention** (predicted from the renders with GUIDELINES §21's heuristic, not measured; the layout is the same in EN/ES/CA and light/dark, so one prediction per page and viewport):
- **delete-account, phone (390 × 664):**
  1. The H1 "Delete your TaskFlow account." (largest, upper half, y ≈ 173–238).
  2. The filled «Write a deletion request» (y ≈ 434–492, the only filled element, straddling the bottom third).
  3. The bold «No app, or can't sign in? Email us:» or the in-app line above it.
  - Competing: «Back to TaskFlow», the first bold text after the header, and the outlined Menu pill.
  - Not in the viewport: the language switch. An ES/CA visitor on `/delete-account/` meets nothing in their language among the first three.
- **delete-account, desktop:**
  1. The H1, top left.
  2. The box's left column, «In the app or by email» and the Settings path.
  3. The filled button in the right half, which gets its first look later (Buscher 2009) but is the most salient control.
  - Competing: two language switches, the header's and the pill under the box at y ≈ 910–966.
- **privacy, phone:**
  1. The H1.
  2. The language pill (large, a filled chip with a green ring, y ≈ 162–219).
  3. The green underlined «Delete account → / Email support» (y ≈ 358–375).
  - Summary 01 sits in the bottom third (y ≈ 428–511) and summary 02 below the fold, so the privacy facts come fourth.
- **privacy, desktop:**
  1. The H1.
  2. The row of three summary cards (y ≈ 565–725), card 01 first.
  3. The two links, or the top-right pill.
  - Competing: the header's language switch plus the pill.
- **terms and legal notice, phone:**
  - Same order: H1 → pill → links. The summary cards sit in the bottom third.
  - In English, the legal notice's H1 splits "com- / pany" (WEB-1505).
- **terms and legal notice, desktop:** the H1, then the summary row, then the links. The two language switches compete in the upper right.

### Findings (most severe first)

**WEB-1501 · Severity 3 · Play's deletion link opens English; «Español» is off-screen**
- **Where:**
  - `src/components/LegalPage.tsx:124-131` (top row: back link only on the delete page) and `:168-172` (the switch moved under the request box);
  - `src/styles/legal.css:340-342`;
  - `src/proxy.ts:55` (only `/` follows the browser's language).
  - Page: `/delete-account/`, the URL WD13 gives Google Play; phone 390 × 664 and 320 × 568, light and dark.
  - Renders: `delete-account.en.mobile.light.fold.png`, and `delete-account.en.mobile.light.full.png` screen 2 (crop `crops/delete-account.en.mobile.light.full.s2-3.png`).
- **The moment:** a 68-year-old in Valencia taps the deletion link on TaskFlow's Spanish Play listing. The page reads "Delete your TaskFlow account. With the app: Settings → Account → Delete account", while her app says «Ajustes → Cuenta → Eliminar cuenta». «¿Esto está en inglés? ¿Dónde lo pongo en español?»
- **What happens:**
  - The first screen is entirely English.
  - The page's language switch sits under the request box, ≈ 190 px below the first screen in English and lower in ES/CA (taller box).
  - The header's switch is inside Menu, which the Newcomer doesn't open.
  - In the first review (2026-10-19) the switch was at y ≈ 155–203. WP44 moved it under the box to fit the email button above the 320 × 568 fold (WEB-204), noting "If you'd rather keep the language switch at the top, say so" (`runs/2026-10-18-site/plan.md:411`). That was a layout choice for WD3's sign-off, not an owner decision.
- **Why it fails:**
  - PV-7 (Play's page must make the request path prominent for the people Play sends there). A Spanish speaker gets the path in another language, with app labels that don't match her phone.
  - ML-5 (CSA 2020: 76% prefer their own language).
  - NV-1 (Pernice 2016a: on phones, hidden navigation was used 57% of the time vs 86% for visible-plus-menu).
  - AT-2 (Lagun 2014: the top half gets ≈ 70% of gaze).
  - The agent's severity scale names "an entry page that isn't in the newcomer's language" as a 3. It applies from launch; fix it before the Play listing goes live.
- **Fix** (site only, no decision needed; subtract and move):
  1. On the delete page only, render the language switch in the top `.legal-utility` row, in place of «Back to TaskFlow». The logo and the footer still lead home.
  2. Delete the second row (`LegalPage.tsx:168-172`) and `.legal-utility--languages` (`legal.css:340-342`).
  - Arithmetic: the pill is 58 px tall (48 px links, with 4 px of padding and a 1 px border on each side, `legal.css:16-25`, `global.css:326-335`) against the back link's 44 px (`global.css:218-225`). Everything above the button moves down 14 px.
  - Estimated at 320 × 568, from the current w320 renders: the button ends ≈ 513 (EN), 537 (ES), 561 (CA), all above 568.
  - If Catalan passes 568, hide `.legal-page--deletion .legal-version` under 360 px rather than move the switch again.
  - Other legal pages are unchanged. With WEB-1504, the row is empty on desktop, where the header's switch shows; leave no empty gap.
  - Q-L1 asks whether `/delete-account/` should also follow the browser's language, which would remove the extra tap entirely.
- **Verify:**
  - At 390 × 664 and 320 × 568, the "Document language" nav's bottom is inside the first screen on `/delete-account/`, `/es/delete-account/` and `/ca/delete-account/`.
  - At 320 × 568, the deletion button's bottom stays ≤ 568 in all three languages; update WEB-204's test in `tests/ux-web-legal.spec.ts`.
  - Renders: «Español» and «Català» visible in `delete-account.en.mobile.*.fold.png`.
  - AUDIT §9: the nav comes before the request region.
- **Evidence:** seen in a current render (crop above); verified in code; AUDIT §9 (landmark order on the delete pages: "Document language" after region "In the app or by email"). The Play side of the journey is inferred (a device check after launch).

**WEB-1502 · Severity 2 · Privacy says words reach Google's AI only for tasks**
- **Where:** privacy, all three languages and viewports.
  - Summary 02: `src/content/legal/en.ts:10`, `es.ts:10`, `ca.ts:10`.
  - §2 «Organización», whose list has no reminders: `en.ts:30`, `es.ts:30`, `ca.ts:30`.
  - §4: "With Pro, words you type for the AI are sent the same way." (`en.ts:55`, `es.ts:55`, `ca.ts:55`).
  - Render: `privacy.es.mobile.light.fold.png` (summary 02 at the fold).
- **The moment:** a Pro user writes «cada 3 días y la última semana a diario» under «A tu manera» in the reminder sheet. The site told her «Tus palabras solo van a la IA de Google cuando pides a TaskFlow que las entienda: para añadir, buscar o cambiar tareas». «Un recordatorio no es nada de eso, así que esto se queda en mi teléfono.» It doesn't.
- **What happens:**
  - Her words go to `POST /api/ai/reminder-plan/` (`Backend/docs/REMINDER_PLANS.md:13, 100-115`). That's Google's Gemini API, with Vertex AI as the fallback, the same route as dictation (`Backend/core/ai.py:435-439, 690-694`).
  - The words are kept on the server in her reminder plan's `said` field, up to 200 characters (`REMINDER_PLANS.md:57`; `Backend/core/models.py:242-258`, `TaskReminder`).
  - By the app's own contract, a reminder change "isn't a change to the task" (`REMINDER_PLANS.md:38`), so "change tasks" doesn't cover it.
  - The app's reminder sheet never says the words go to Google: «A tu manera» and «Por ejemplo: «una semana antes y el día antes a las 8».» (`App/lib/l10n/app_es.arb:1365-1366`). So the privacy page is the only disclosure, and its summary rules this case out.
  - The home FAQ sells the feature since WD21 (`src/content/site/es.ts:94`).
- **Why it fails:**
  - FN-1 (every claim true today; Pro features say so).
  - PV-1 (WP260 2018: the plain summary carries "anything surprising: the AI provider").
  - The recurring pattern: "an app feature grows and the site's verbs lag".
  - Not a 4: Pro can't be bought yet (test purchases only), §4's "words you type for the AI" covers typed words in principle, and some readers count a task's reminders as part of the task. Still, the summary is the one layer most people read.
- **Fix** (sharpen the existing sentences; no new feature claim, since the FAQ already makes it under WD21; the FAQ's own phrase is reused, so it's one name for one concept):
  - **Summary 02:**
    - EN "Your words go to Google’s AI only when you ask TaskFlow to understand them: to add, find or change tasks, or to ask for reminders in your own words."
    - ES «Tus palabras solo van a la IA de Google cuando pides a TaskFlow que las entienda: para añadir, buscar o cambiar tareas, o para pedir recordatorios con tus palabras.»
    - CA «Les teves paraules només van a la IA de Google quan demanes a TaskFlow que les entengui: per afegir, cercar o canviar tasques, o per demanar recordatoris amb les teves paraules.» (needs a native Catalan read)
  - **§4, first paragraph:**
    - EN "With Pro, words you type for the AI, and reminders you ask for in your own words, are sent the same way."
    - ES «Con Pro, lo que escribes para la IA y los recordatorios que pides con tus palabras se envían igual.»
    - CA «Amb Pro, el que escrius per a la IA i els recordatoris que demanes amb les teves paraules s’envien igual.»
  - **§2 «Organización»:** add reminders after dates: EN "tasks, notes, dates, reminders, priorities, …" / ES «tareas, notas, fechas, recordatorios, prioridades, …» / CA «tasques, notes, dates, recordatoris, prioritats, …».
  - **Version:** this is a legal edit. Move `company.json:10`, `docs/LEGAL_RELEASE.md:3` and the pinned dates in `tests/legal.spec.ts` and `tests/ux-web-legal.spec.ts` once, together with WEB-1503, WEB-1506 and WEB-1507, for the owner's WD3 sign-off.
- **Verify:**
  - Tests pin the three sentences in EN/ES/CA, and "or to ask for reminders in your own words" in summary 02.
  - The es/ca mobile fold renders: summary 02 has no one-word last line at 390 px.
  - No "only … tasks" summary is left in any language.
- **Evidence:** verified in code in both repos; seen in a current render.

**WEB-1503 · Severity 1 · English terms: "dictation into tasks" and "AI capture"**
- **Where:** `src/content/legal/en.ts:221` (terms §3: "optional dictation that turns what you say into tasks") and `en.ts:239` (§5: "AI capture is optional."). English only: ES and CA already say «IA opcional» / «La IA es opcional» (`es.ts:215, 233`; `ca.ts:215, 233`). Page `/terms/`, all viewports.
- **The moment:** an English-reading Comparer asks "The terms only cover turning speech into tasks. What about moving all of yesterday's tasks by voice? And what's 'capture'?"
- **What happens:**
  - Voice also finds, changes, moves and completes tasks, in bulk too (`Backend/docs/VOICE_COMMANDS.md`; FAQ `src/content/site/en.ts:104`), and Pro reads reminders in your own words.
  - The EN service description is narrower than ES/CA, while terms §10 says the three versions "convey the same terms" (`en.ts:298`).
  - WEB-1002's note deferred this to "the next legal edit". WEB-1502 is that edit.
- **Why it fails:** FN-1 and FN-2; RD-3 (no unexplained jargon); TR-3 (inconsistent translations are trust bugs).
- **Fix:**
  - EN §3: "…calendars, reminders, optional AI, synchronisation and shared projects where enabled." (as ES/CA).
  - EN §5: "The AI is optional. It sends submitted input…"
  - No ES/CA change. Ship it in WEB-1502's version move.
- **Verify:** no "turns what you say into tasks" or "AI capture" in `src/content/legal/en.ts`; a test pins both sentences.
- **Evidence:** verified in code.

**WEB-1504 · Severity 1 · Desktop legal pages show two language switches**
- **Where:**
  - `src/components/LegalPage.tsx:128-130` (the legal pill) and `src/styles/legal.css:16-36`.
  - Every legal page at 1024 px and wider, all languages, both themes.
  - Renders: `privacy.es.desktop.light.fold.png` (header switch at y ≈ 19–67, pill at y ≈ 133–191); `delete-account.ca.desktop.light.fold.png` (header switch and pill at y ≈ 910–966).
  - AUDIT §9: desktop legal pages expose three language navigations ("Idioma" twice and «Idioma del documento»).
- **The moment:** «¿Por qué hay dos selectores de idioma? ¿Uno es para el documento?»
- **Why it fails:** subtract first; NV-8 (one familiar place, the header); OL-4 (COGA: clear purpose, few repeats); AX-5 (a third language landmark adds nothing). The first review noted this and suggested the fix (`runs/2026-10-18-site/plan.md:369`), but it was never planned.
- **Fix:**
  - `legal.css`: `@media (min-width: 64.0625em) { .legal-languages { display: none; } }`, the header's phone-menu breakpoint mirrored (`global.css:1044`, `max-width: 64em`, WEB-712). Phones and desktop text at 200% keep the pill, because their header shows Menu.
  - With WEB-1501, the delete page's top row is empty on desktop: render nothing there, with no gap.
- **Verify:**
  - Desktop renders show one switch.
  - AUDIT §9 desktop rows lose «Document language» / «Idioma del document(o)».
  - Mobile and desktop-text200 renders keep the pill.
- **Evidence:** seen in current renders; measured (AUDIT §9).

**WEB-1505 · Severity 1 · Legal headings hyphenate: "com-pany", «condi-ciones»**
- **Where:**
  - `src/styles/legal.css:41-49` (`.legal-hero h1 { hyphens: auto; }`).
  - Renders: `legal.en.mobile.light.fold.png` ("Legal notice: the com- / pany behind TaskFlow" at 390 px), and `terms.es.mobile-w320.light.fold.png` («Términos y condi- / ciones de TaskFlow» at 320 px).
- **The moment:** an older reader stalls on the page's name split mid-word.
- **Why it fails:** SC-4 (the key word must be readable at a glance); RD-3 and OL-1 (older readers are slower and more error-prone). `text-wrap: balance` already gives the lines room.
- **Fix:**
  - `hyphens: manual` on `.legal-hero h1`, keeping `overflow-wrap: break-word` as the guard against overflow.
  - The delete page's H1s don't hyphenate today, so WEB-204's fold arithmetic doesn't change.
- **Verify:**
  - Renders at 390 and 320 px in EN/ES/CA have no line-end hyphen in any legal H1.
  - AUDIT §3 still shows no overflow.
- **Evidence:** seen in current renders; verified in code.

**WEB-1506 · Severity 1 · English privacy §8 has an extra, mislabelled link**
- **Where:** `src/content/legal/en.ts:144-149` ("Cloudflare Turnstile privacy information" → `https://www.cloudflare.com/privacypolicy/`). ES and CA §8 have no links (`es.ts:135-144`, `ca.ts:135-144`). §5 already links the same page as "Cloudflare privacy notice" (`en.ts:93-95`, all three languages).
- **The moment:** "This says Turnstile, but it opens Cloudflare's whole privacy policy, the same one as above."
- **Why it fails:** ML-5 (the three versions differ); RD-7 (the label promises Turnstile-specific information).
- **Fix:** remove EN §8's `links` (subtract). Ship it in WEB-1502's version move.
- **Verify:** EN/ES/CA §8 have the same number of links (0).
- **Evidence:** verified in code.

**WEB-1507 · Severity 1 · Privacy: files upload "when you use cloud backup"**
- **Where:** `src/content/legal/en.ts:31` ("Files are uploaded when you use cloud backup/sharing."), `es.ts:31` («Se suben cuando utilizas la copia en la nube o el uso compartido.»), `ca.ts:31`.
- **The moment:** «No uso ninguna “copia en la nube”, así que el documento que adjunto se queda en el móvil.» It doesn't.
- **What happens:**
  - Every new file uploads to the account when the task is saved: "New files upload to your account after saving" (`App/lib/l10n/app_en.arb:1233`; `app_es.arb:568`; `app_ca.arb:547`; `App/lib/services/attachment_store.dart:82, 98`). The status then reads "Backed up to your account" (`app_en.arb:787`).
  - There is no cloud-backup setting to turn on.
- **Why it fails:** FN-1 and FN-2 (the app's words); PV-1 (where data goes, without a hedge that suggests a choice). Severity 1, because the app says it at the point of use.
- **Fix** (the app's own words):
  - EN "Files you attach upload to your account when you save the task."
  - ES «Los archivos que adjuntas se suben a tu cuenta al guardar la tarea.»
  - CA «Els fitxers que adjuntes es pugen al compte en desar la tasca.» (needs a native Catalan read)
  - Ship it in WEB-1502's version move.
- **Verify:** no "cloud backup/sharing" / «copia en la nube o el uso compartido» / «còpia al núvol o la compartició» left in `src/content/legal/`; a test pins the sentence.
- **Evidence:** verified in code.

### Claims checked

| Claim (page, `path:line`) | Source of truth (`path:line`) | Verdict |
|---|---|---|
| Privacy summary 01: we don't sell data or show ads (`src/content/legal/en.ts:9`) | `en.ts:48`; no ad SDK in `App/pubspec.yaml` | true |
| Privacy summary 02: words go to Google's AI only "to add, find or change tasks" (`en.ts:10`) | `Backend/docs/REMINDER_PLANS.md:13, 38, 100-115`; `Backend/core/ai.py:435-439, 690-694`; same words in the app's capture line `App/lib/l10n/app_en.arb:527` | outdated, incomplete → WEB-1502 |
| Privacy summary 03: a copy of your data, or delete it, whenever you want (`en.ts:11`) | `App/lib/l10n/app_en.arb:1336` (Export & import), `:2423` | true |
| Privacy §1: automatic emails from the no-reply sender, replies directed to support (`en.ts:21`) | CLAUDE.md, Email; Reply-To is set only in the other session's uncommitted `Backend/core/email_delivery.py` (HEAD has none) | unverifiable at HEAD; true once that work ships (WD13) |
| Privacy §2: Google sign-in keeps the first name, no photo (`en.ts:29`) | `Backend/core/google_auth.py:39-45` | true |
| Privacy §2: 6-digit code, 30 minutes (`en.ts:29`) | `Backend/core/email_verification.py:1, 20` | true |
| Privacy §2 «Organización» lists no reminders (`en.ts:30`) | `Backend/core/models.py:242-258` (`TaskReminder`, per person, with `said` words) | incomplete → WEB-1502 |
| Privacy §2: files uploaded "when you use cloud backup/sharing" (`en.ts:31`) | `App/lib/l10n/app_en.arb:1233, 787` | outdated, misleading → WEB-1507 |
| Privacy §4: speech recognised on the phone, only words sent (`en.ts:55`) | `App/lib/services/native_speech.dart:27`; the reminder sheet's mic only with on-device recognition, `App/lib/widgets/reminder_plan_sheet.dart:382-384` | true |
| Privacy §4: Pro's typed words go the same way; without Pro the task form sends nothing to the AI (`en.ts:55`) | `REMINDER_PLANS.md:13` (free: Pro badge, no call) | true; silent on reminders → WEB-1502 |
| Privacy §4: Gemini API, Vertex AI fallback; demo on Vertex (`en.ts:56`) | `Backend/core/ai.py:435-439` (reminder plans use the same route) | true |
| Privacy §5: members see "Created by" and assignees (`en.ts:75`) | `.claude/ux-review/DECISIONS.md:161`; reminders aren't shared (`REMINDER_PLANS.md:5, 36`; `app_en.arb:1132`) | true; reminders unmentioned → Q-L2 |
| Privacy §5: Neon database and private file storage, Frankfurt (`en.ts:80`) | `Backend/docs/STAGING.md:84-86` | true |
| Privacy §7: we never delete tasks on our own (`en.ts:122`) | `.claude/ux-review/DECISIONS.md:134` | true |
| Privacy §7: invitations 7 days; confirmation and recovery codes 30 min (`en.ts:126`) | `Backend/core/group_views.py:148`, `list_views.py:167`, `email_verification.py:20`; `Backend/config/settings.py:64` | true |
| Privacy §7: server logs kept 30 days (`en.ts:127`) | `docs/LEGAL_RELEASE.md` (Cloud Run setting checked 16 Oct) | unverifiable from code |
| Privacy §7/§8: demo results 24 h, quotas 48 h, session cookie 30 days (`en.ts:129, 139-141`) | `src/lib/voice/store.ts:115, 122`; `src/lib/voice/security.ts:66` | true |
| Privacy §8: language from the browser on `/` only; cookie up to a year; never location (`en.ts:142`) | `src/proxy.ts:6-10, 55`; `src/components/LanguageSwitch.tsx:17` | true |
| Terms §3 (EN): "optional dictation that turns what you say into tasks" (`en.ts:221`) | `Backend/docs/VOICE_COMMANDS.md`; ES/CA «IA opcional» `es.ts:215`, `ca.ts:215` | outdated (EN only) → WEB-1503 |
| Delete page and terms §8: Settings → Account → Delete account, in each language (`en.ts:269, 355`; `index.ts:50, 95, 139`) | `App/lib/screens/settings_screen.dart:118-126`; `account_screen.dart:331-341`; `app_en.arb:215, 1877, 2423`; `app_es.arb:127, 991, 1231`; `app_ca.arb:106, 771, 935` | true |
| Delete §1: counts, shared content, heirs, copy without files, password or Google, needs a connection, plan changed (`en.ts:355-356`) | `Backend/docs/ACCOUNT_DELETION.md:35-50`; `app_en.arb:2439-2629` | true |
| Delete §3: what's deleted, incl. Google link, sessions, memberships, notification settings, free-dictation count; RevenueCat asked (`en.ts:373`) | `ACCOUNT_DELETION.md:20, 32`; `Backend/core/account_deletion.py:301-303`; `models.py:248-249` (your reminders cascade) | true |
| Delete §3: shared tasks and files stay without your name; your projects and groups pass on (`en.ts:374`) | `ACCOUNT_DELETION.md:23-28` | true |
| Delete §3: Play records, support mail, security logs and backups aren't deleted by the app (`en.ts:375`) | `ACCOUNT_DELETION.md:33`; `docs/LEGAL_RELEASE.md` | true |
| Delete §4: deleted on confirm; no email sent (`en.ts:382`) | `ACCOUNT_DELETION.md:12, 63` (the confirmation email is a later step) | true today; changes when that email ships |
| Delete summary 03 and §5: Pro on Google Play isn't cancelled; your Google account isn't deleted (`en.ts:348, 397-398`) | `app_en.arb:2521, 2541` | true |
| Delete §2: request without the app, by email (`en.ts:363`; `index.ts:51`) | PV-7; Play help 13327111 (fetched 2026-10-29: the page must name the app or developer and work without the app) | true |
| The app's Privacy and Terms links land on existing pages in its language | `App/lib/services/site_links.dart:13-30`; `src/app/[language]/[document]/page.tsx:24-27` | true |

### Missing from the site (app features worth telling)
- **Reminders aren't shared.** Each person has their own (`Backend/docs/REMINDER_PLANS.md:5, 36`). The app already says it in its sharing help: "Reminders aren’t shared: each person has their own." / «Los recordatorios no se comparten: cada persona tiene los suyos.» / «Els recordatoris no es comparteixen: cada persona té els seus.» (`App/lib/l10n/app_en.arb:1132`, `app_es.arb:539`, `app_ca.arb:518`).
  - Where it belongs: privacy §5, after "They can also show just one person's tasks." It's a privacy plus for families. A new claim, so Q-L2.
  - The home's family FAQ is review F's.
  - D9 is open, so nowhere may say that everyone can choose their own reminders: a reader can't today.

### Keep
- The delete page's in-app route in each app's own words (Ajustes → Cuenta → Eliminar cuenta; Configuració → Compte → Suprimeix el compte), with the email request in the first screen even at 320 × 568 in all three languages.
- A delete link in the first screen of every legal page, in every footer, and in each language's block of the 404.
- What's deleted and what stays, in the app's terms («Creada por», handovers, RevenueCat, "your Google account isn't deleted"), true to `ACCOUNT_DELETION.md`. No guilt or friction before deleting.
- A clean measured audit on all 12 legal pages, light and dark (AUDIT §1, §3, §7, §10).
- The mail draft in the visitor's language, with the address and subject shown for copying.

### Questions for the owner (product decisions only)
- **Q-L1 (for WD22+) · Should `/delete-account/`, the one address Google Play shows everyone, open in the visitor's language like `/` does?**
  - How: cookie first, then the browser's language, never the IP.
  - Today WD5 limits this to `/`, and ML-1 says only the bare root may choose. That's why a Spanish Play visitor lands in English (WEB-1501).
  - **Recommendation: yes.**
    - A 307 to `/es/delete-account/` or `/ca/delete-account/` only when no cookie says otherwise and the browser prefers Spanish or Catalan, with `Vary: Accept-Language, Cookie`, as `src/proxy.ts` does for `/`.
    - English stays at `/delete-account/` as the x-default; crawlers and English browsers are unchanged.
    - With it, the Play journey is 1 tap in every language.
  - Rejected: giving Play `/es/delete-account/`, because English and Catalan speakers would then land on Spanish.
- **Q-L2 (for WD22+) · Should privacy §5 say that reminders aren't shared?**
  - **Recommendation: yes, in the app's words:**
    - EN "Reminders aren’t shared: each person has their own."
    - ES «Los recordatorios no se comparten: cada persona tiene los suyos.»
    - CA «Els recordatoris no es comparteixen: cada persona té els seus.»
  - It's true for every role, readers included (they keep their own defaults, D9). It's one sentence, and it answers a family's "will my reminders ring on everyone's phone?".
  - It's a legal edit, so it rides WEB-1502's version move.
- **Q-L3 (legal check) · Family sharing vs the 18+ rule:**
  - The home's family answer invites "someone" to a shared project (`src/content/site/en.ts:112-114`), while terms §2 and privacy §11 say TaskFlow is only for people 18 and over (`src/content/legal/en.ts:214, 183`).
  - A parent may invite a 15-year-old.
  - **Recommendation:** ask the lawyer during the WD3 sign-off. If 18+ stays, the family answer says "invite an adult by email" (review F's copy).

### Cross-slice notes
- **G:** every desktop page exposes two "Language" navigations, the header's and the footer's (AUDIT §9). WEB-1504 removes only the legal pill.
- **F:** the family FAQ (`src/content/site/en.ts:112-114`, es/ca) never says reminders aren't shared (Q-L2). D9 is open, so it can't say everyone chooses their own.
- **F:** the app's Export & import, with Todoist's CSV (`App/lib/l10n/app_en.arb:1336`), is never told, though it would help a Comparer switching from Todoist.
- **App (frontend-ux-reviewer):** «A tu manera» in the reminder sheet (`App/lib/l10n/app_es.arb:1365-1366`) never says the words go to Google's AI; capture has `capturePrivacyLine`.
- **Main session:** the other session's uncommitted `Backend/core/email_delivery.py` adds Reply-To, on which privacy §1 depends. It also appends an English-only footer to every automatic email, Spanish and Catalan ones included.
- **Records:** `.claude/ux-review/DECISIONS.md:343` and `Backend/docs/ACCOUNT_DELETION.md:67` still say the site's delete page lacks the in-app option. Both have been stale since WEB-202 and WEB-204.
- **Tooling:** `artifacts/ux-web/INDEX.md:143-145` says there are no WebKit renders, yet `webkit/INDEX.md` lists 112.

### Memory notes
- **Site map:**
  - Legal files are unchanged since 44e9921 (2026-10-22).
  - The delete page's language switch sits under the request box (WP44, `LegalPage.tsx:168-172`); the top row is the back link only. WEB-1501 proposes the swap.
  - Desktop legal pages show the header's switch and the pill (WEB-1504).
- **Claims map additions:**
  - **Reminders:** every reminder is personal (`REMINDER_PLANS.md:5, 36`; the app's `sharedDataHelp`, `app_en.arb:1132`); the legal pages say nothing about it (Q-L2).
  - **«A tu manera»:** Pro words go to `POST /api/ai/reminder-plan/` (Gemini API, Vertex fallback, `ai.py:435-439`) and are stored as `said`, up to 200 characters. Privacy summary 02 and §4 don't say so yet (WEB-1502).
  - **Shared wording:** the privacy summary 02 shares its words with the app's `capturePrivacy` (`app_en.arb:527`); change both together.
  - **Watch:**
    - the deletion confirmation email is "next" (`ACCOUNT_DELETION.md:63`; CLAUDE.md). When it ships, delete §4 "no email is sent" (`en.ts:382`), privacy §1 (`en.ts:21`) and §5's Resend bullet (`en.ts:82`) change in the same release.
    - Reply-To to support exists only in the uncommitted `email_delivery.py`.
  - **Files:** the app uploads new files on save (`app_en.arb:1233`).
  - **Deletion:** `TaskReminder` rows cascade on account deletion (`models.py:248-249`).
- **Patterns:**
  - EN terms diverge from ES/CA, which say «IA opcional» in §3 and §5.
  - Proposed site words for the reminder disclosure: "ask for reminders in your own words" / «pedir recordatorios con tus palabras» / «demanar recordatoris amb les teves paraules», the FAQ's phrase.
  - For any sentence on shared reminders, reuse the app's own sentence.
- **Recurring problems:**
  - Again, the privacy summary's purpose list lagged an app feature (reminder plans). After any new AI call in the app, grep privacy summary 02, §2 and §4, and the app's capture and reminder privacy lines.
  - A layout fix can quietly undo a journey: WP44 moved the delete page's switch out of the first screen for Play's Spanish visitors. Re-walk the Play journey in ES/CA after any delete-page layout change.
- **Techniques:**
  - WSL and `crop.mjs` worked this run.
  - `python3` on Windows counts legal words from `src/content/legal/*.ts` (a scratchpad script); heredoc regexes break in Git Bash, so write scripts to a file.
  - Play's deletion help (support.google.com, answer 13327111) gives no per-language URL field.
