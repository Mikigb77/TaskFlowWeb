---
name: site-map
description: TaskFlowWeb pages, home anchors, components, legal section ids and which renders show what (as of run 2026-10-18-site, b5 closed 2026-10-20)
metadata:
  type: project
---

Snapshot 2026-11-02 (after run 2026-10-28-site b2). Check against the code before relying on line numbers.

**Home** (`src/components/HomePage.tsx`; copy in `src/content/site/{en,es,ca}.ts`, shared type `types.ts`):
- hero `#hero-title`; primary CTA → `#voice` (`.button`), secondary text link → `#features`; under the status line `p.hero-free` (`HomePage.tsx:29`, copy `hero.free` = `closing.plans`' first sentence, no "Pro" in the hero; below the fold at 320 × 568, accepted)
- `#features` (cards: voice, calendar/reminders — `.feature-calendar` is a flex column and `.calendar-illustration` grows to the card bottom (WEB-1004; at desktop text200 the week panel shows ~460 px blank, accepted), notes/checklist/files, offline as a full-width card)
- live voice demo `#voice` (`VoiceDemo.tsx`, static fallback `VoiceExample.tsx`; plans block `.voice-plans` inside the section; `?developer=1` shows English-only developer text, not visitor-facing)
- FAQ `#questions` (9 items: download yet, free (two paragraphs: Free, then Pro), account, voice, repeats ("every Monday", More details › Repeat), offline, family, notes, home screen/WhatsApp). `answer: string | string[]`; `HomePage.tsx` renders one `<p>` per paragraph; closing `#get-taskflow` (lime button → `#voice`)
- `TaskDemo.tsx` (the sample walkthrough) was removed in 2026-10-18-site.
- Other components: `Header` (phone menu `<details>`: ≡ swaps to ✕ on `[open]` by CSS, name stays "Menu"; closes on Escape, CloseWatcher (Android Back), focus leaving; at `max-height: 480px` the header is `relative`, not sticky), `Footer` (back-to-top → `#main-content`, company name GARBAR; site nav `.footer-top nav a` and legal row `.footer-legal` both 1rem, operator/fine print 0.875rem; footer language switch is `div role=group`, not a second nav), `LanguageSwitch` (cookie `taskflow-lang`, 1 year; links to `followsVisitor` addresses carry `?lang=`), `SkipLink`, `NotFoundPage` (sets `document.title` in the address's language), `useSiteLanguage`.
- Language routing in `src/proxy.ts`: matcher `/` and `/delete-account/` only (list `followsVisitor`, `src/content/site/index.ts:20`, WD5 + WD27): `?lang=` sets the cookie and 307s to the clean address; else cookie, then Accept-Language → 307 to `/es/…` or `/ca/…`; English served in place. `/es/`, `/ca/` pages and other legal pages never redirect.
- Hero screenshots: `public/images/hero-calendar-{en,es,ca}-{light,dark}.png` (one per language and theme), copied from the app's renders (see [[site-patterns]]); also drawn in `opengraph-image.<lang>.png`.

**Legal** (`LegalPage.tsx`, content `src/content/legal/{en,es,ca}.ts`, metadata/UI strings `index.ts`, company data `company.json`, styles `src/styles/legal.css`):
- h1 = the document's name; no eyebrow, no visible description (description is meta/og/twitter only).
- `.legal-version` line is only "In force since <date>" (Intl long date, UTC); company name lives in footer/legal notice/company card.
- privacy ids: controller, data, purposes, voice, sharing, transfers, retention, website (live demo + language cookie), permissions, rights, age-changes
- terms ids: operator, account, service, content, ai, subscription, withdrawal, ending, responsibility, complaints
- legal notice: company, scope, rights
- delete-account: in-app, request (in-app route first, bold "No app, or can't sign in? Email us:", mailto button, then mail details; h2 visually hidden on phones), scope, timing, subscription, other-rights. Language switch sits after the request box on this page only.

**Tests the loop maintains** (TaskFlowWeb `tests/`): `ux-web-voice.spec.ts`, `ux-web-legal.spec.ts`, `legal.spec.ts`, `ux-web-home.spec.ts`, `ux-web-features.spec.ts`, `ux-web-frame.spec.ts`, `ux-web-global.spec.ts`. A fixed finding is expected to have a test.

**Demo state renders** (artifacts/ux-web): voice-capture, voice-recording, voice-recording-50s, voice-mic-waiting, voice-result, voice-no-tasks, voice-last-try, voice-error-invalid-draft, voice-error-previous-failure, voice-waiting-10s, voice-stop-waiting, voice-timeout, voice-connect-offline, voice-connect-gateway, voice-offline, voice-check-pending/-unreachable/-gave-up, voice-connect-paused (demo off), voice-resend-waiting, voice-typing, voice-error-budget-pause, plus results/tries-used. AUDIT §13 holds the demo-state rows (axe, announcement). FAQ answer renders: `home-faq-pricing.*`, `home-faq-repeat.*`. ARIA snapshots: `artifacts/ux-web/aria/<state>.<lang>.txt`. New loop spec: `tests/ux-web-completion.spec.ts` (task completion, card geometry).

Related: [[claims-map]], [[site-patterns]].
