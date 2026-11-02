---
name: site-patterns
description: Settled conventions on the TaskFlow website (CTAs, demo error handling, legal page structure, type sizes, icons, language) to enforce consistency
metadata:
  type: project
---

Settled by run 2026-10-18-site (b1-b5), extended by 2026-10-28-site (b1-b2) and 2026-11-02-changes. Enforce these; a deviation in a new change is a finding.

**Calls to action**
- Primary CTA everywhere points to the live demo `#voice`, never to a download (Play not published). Availability line: "Coming soon to Google Play / You can't download it yet"; header/menu/closing "Coming soon to Android". ES/CA say «Próximamente» / «Properament», never «Muy pronto» / «Molt aviat».
- Phone layout (≤580 px): hero, closing card and `.voice-plans` are left-aligned, not centred; hero accent has no underline; `h1` has `text-wrap: balance`. Desktop hero is top-aligned (CTA and status inside 1440 × 1000 and 200% zoom).
- Demo button is "Done" / «Listo» / «Fet» (matches the app). No "Create drafts".

**Live voice demo (VoiceDemo.tsx)**
- **Result task card (2026-10-28-site WP266):** `div.voice-task-toggle` holds the native checkbox (`id` from `useId`, `aria-label` = app's `completeNamedTask` "Complete {title}") then `span.voice-task-circle` (aria-hidden, 24 px round, green fill + check only when checked, focus ring on the circle); the title is `<h4><label htmlFor>` so the heading's name is the title alone. Never put the control inside the heading. Date line: Today/Tomorrow (visitor's clock) · time, 1rem. Open: WEB-1615 — the tap area is now only the 24 px input + the title text; fix is CSS (input covers the circle column full height, h4 `flex: 1`).
- **Transcript `details`:** shown when `mode === "voice" || allowanceUsed`; summary "See what I said" for voice, "Original text" / «Texto original» / «Text original» (app's `reviewOriginalText`) for typed. Typed with tries left shows "Change the text" instead.
- **Recording:** listening circle `.voice-level` is an outlined green ring (transparent fill, 2 px border, line mic) with a mint halo driven by mic level (`--level`, 3 steps under reduced motion) — visibly different from the filled idle "Tap to talk" disc. While waiting the record button is `aria-disabled` (opacity 1, dimmed fill), not `disabled`, so focus stays. From 50 s: "Listening · 0:50 · 10 seconds left", announced once; sends at 60 s. Close demo discards the recording and sends nothing.
- **Tries:** a request that returns no result doesn't use a try (server removes it); a `tasks: []` result does ("That used a try."). Error copy never says a failure used a try. `unavailable` errors offer Try again with a fresh request id, not the off stage.
- **Typing mode order:** label, box, counter, check, Done, privacy, Pro note, Talk instead; Done scrolls into view above the phone keyboard.
- `noTasks` = app's `captureNoTasks` + demo clause.
- **WD17, browser verified 2026-10-21 (`2026-10-21-codex-completion-banner`):** generated results retain WD16's local native completion checkboxes and EN/ES/CA reward copy. A nonempty fully checked result shows one full-width leaf + reward banner immediately before the entire task list, outside all cards. Tasks/details stay visible. One existing atomic polite status announces completion; the visual banner adds no live region. Undo hides it; record/submit/new result/Change text/close reset it. Inputs retain identity/focus and toggles make no API/quota/storage change. Qualifying pointer/touch completion schedules one cancellable animation frame, measures current banner/header bounds inside it, then uses an instant reveal or zero-distance cancellation of pending native focus movement. Undo/reset/unmount cancel pending work. Keyboard/assistive activation makes no explicit completion scroll and keeps reading context. Reduced motion removes reveal animation. Source blob `50141eab` and 54 fresh browser regions are verified; physical phone/AT/Safari checks remain pending. The run records preserve the earlier full-suite revision and the final behavior command's pre-completion setup failure plus unchanged retry.
- **WEB-801 remains open outside WP51:** unchanged tries badge overflows ES 32 px / CA 16 px at 390-wide, actual root32, both themes. Completion has no overflow offender. Do not describe all focused page records as overflow-free.
- Never shows a server `error` string or `reason.message`; every code maps through `failureFor` to copy in `src/content/site/*.ts` `voice.errors.*`.
- Opening failure uses `errors.offlineOpening` (no "what you said is kept"); sending failure uses `errors.offline`.
- Recovery is always a filled `.button` "Try again" under the alert; alert takes focus and is announced.
- Waiting: heading "Understanding…" only; at 10 s "Still understanding… up to half a minute" + "Stop waiting"; page timeout 40 s. Stop keeps text and resends with the same request id (doesn't use another try), shows `errors.processing`.
- Stages `off` / `unverified` replace the form with the static example + reason alert + hand-over; badge reads "Live demo", never a tries count.
- Turnstile: interaction-only, compact <300 px, retry never; 2 failures → `unverified`.
- Close demo disabled while recording/loading.
- No sample walkthrough anywhere (WEB-6): no JS → `<noscript>` line + server-rendered `VoiceExample`, start button disabled until ready; `off` / `unverified` / gave-up stages show the example, then the alert, then the hand-over; tries-used shows only the tries line + hand-over. Re-flag any "walkthrough", `#demo`, "sample", «recorrido», «recorregut».
- Capture is one "Tap to talk" mic, then "Done": two taps to a result; no listen-back, no "Record again". "Type instead" / «Escribir» / «Escriu» is a plain `.text-link` button, never a toggle (no `aria-pressed`, role, switch or fill).
- A held/disabled "Try again" (`.voice-retry[aria-disabled]`) stays at opacity 1 with a dimmed green fill so its focus ring keeps contrast; other disabled buttons fade.
- `<section id="voice" lang={language}>` gives the demo the page's language; no inner `lang` attributes. Since WEB-707 (2026-10-21-changes b1) `HomePage.tsx` renders a bare `<VoiceDemo />` inside the home's `<div lang={language}>`: no `lang="en"` / `display:contents` wrapper anywhere between `#voice` and `<body>`. Protected by `tests/ux-web-global.spec.ts:163` (section and ancestors = page language, `englishAround: []` on /es/ /ca/) and a no-JS server-HTML walk. Re-flag any `lang="en"` wrapper returning.

**Hero and preview screenshots (WD4, WEB-5)**
- `public/images/hero-calendar-{en,es,ca}-{light,dark}.png` are byte-identical copies of the app's own renders `../TaskFlow/App/build/web-assets/calendar-hero.done.<language>.<theme>.1x-390.png` (780 × 1688), never hand-edited. Check: `cmp` against the app render, manifest `renderedAt` newer than the last `../TaskFlow/App/lib` commit. `tests/ux-web-home.spec.ts:174` asserts size and rejects stale SHA-256s. Re-render right before publishing (WEB-114, WD13). Rows currently: two tasks, no subtitle, no «Sin hora», no «· 0 completadas».
- Alt text (`src/content/site/en.ts:9`) names only the two tasks, so it survives row-format changes; re-check it whenever the app's day view changes.

**Type and targets**
- All font sizes in rem (voice.css, legal.css); body text ≥ 1rem incl. legal `dd` values. Targets ≥ 44 px on phones.
- Legal prose `max-width: 52ch` (≈ 75 chars at 1440).

**Legal pages**
- Legal version 2026-11-02 (`company.json:10`; awaiting WD3 sign-off). Privacy §8 explains `/delete-account/` opening in the visitor's language.
- Legal copy uses "suggestions" / «sugerencias» / «suggeriments» and "limits", never draft/allowance/transcript/AI Studio; terms §5 heading "5. AI suggestions". Meta descriptions ~100-115 chars. Bumping the legal text moves `company.json` version, `docs/LEGAL_RELEASE.md` and the pinned dates in both legal specs together.
- h1 = document name; plain numbered summary first; in-force line only; icons: `arrow` for internal, `arrowUp` only for `http` links, none on mailto.
- Email addresses render split with `<wbr>` before `@` (not hard-coded).
- Catalan uses «suprimir/supressió» for the account (eliminar only for records/exports).
- Retention wording (2026-11-02): plain "your tasks", never "synchronisation metadata" / «metadatos de sincronización» / «metadades de sincronització»; ES/CA conditionals take the subjunctive («mientras tengas», «hasta que elimines»; «mentre tinguis», «fins que suprimeixis»).
- Home copy names the app's entry buttons "Continue with Google" / "Continue with email" (WEB-1701); no "sign in" / «Inicias sesión» / «Inicies la sessió» in `src/content/site/`. Legal texts still say "sign in" in prose (terms withdrawal, delete page) — accepted, not a finding.
- Per-page openGraph + twitter (summary_large_image) in the page's language.

**Feature-card / prose wrapping**: `text-wrap: pretty` on `.feature-card p` (`global.css:583`, WEB-1105), `.floating-note p`, `.closing-card > p`; any new paragraph style that can end on one word gets it too. Lengthening a card sentence: crop es/ca mobile full renders (screens 4-5) for a one-word last line and the drawing still reaching the card's bottom edge (WEB-1004).

**Reminder wording**: site says «recordatorios»/«recordatoris» everywhere; the app's ES/CA Pro screen says «avisos» (`app_es.arb:1408`) — accepted, not a finding. Don't quote the app's «A tu manera» label on the site. The short line under the demo omits reminders by decision (WD2/WD14).

**Footer hierarchy**: site nav (incl. "Try it with your voice") 1rem/650 muted, legal row 1rem regular, operator and fine print 0.875rem. Change one row's size → check the others still rank right.

**Copy punctuation**: ES/CA quoted examples have no full stop inside «» (e.g. «Mañana, llamar al dentista y comprar pan»). "Google LLC." and the 404 text use `text-wrap: pretty`.

**Language**: every string in en/es/ca from one shared type; app's words for features; no jargon (draft, allowance, sync, transcript, voice-to-task) on home.

Related: [[site-map]], [[recurring-problems]].
