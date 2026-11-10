# TaskFlow website

The marketing website for TaskFlow, the calendar-first task app for Android. Next.js 16, React 19, TypeScript and Tailwind CSS 4, in English, Spanish and Catalan, live at https://taskflow.garbar.tech. The app and its backend are in their own repo, `../TaskFlow`.

These instructions are for every coding agent. Claude Code reads them through `CLAUDE.md`, which adds what only Claude needs. How to run the site locally and what's on it: `README.md`.

## What the site may say

- **Only what the app does today.** The app repo is the source of truth: its English ARB (`../TaskFlow/App/lib/l10n/app_en.arb`), `../TaskFlow/App/docs/`, `../TaskFlow/Backend/docs/` and its decisions (`../TaskFlow/.claude/ux-review/DECISIONS.md`). Its open decisions are open here too.
- **Free and Pro, prices, limits and what happens to people's data are the owner's decisions,** recorded in `.claude/ux-web/DECISIONS.md` (WD2 onward). Change them only on the owner's word.
- **Subtract before adding.** The site needn't list every feature; it takes a visitor, truthfully, from a first visit to wanting the app.
- **Every visible string in English, Spanish and Catalan:** `src/content/site/{en,es,ca}.ts`, and the legal texts in `src/content/legal/`. Spanish and Catalan usually run longer, so check layouts at 320 px and at text 200%.
- **The legal pages** change with a version move and the owner's sign-off: `docs/LEGAL_RELEASE.md`.

## Owner decisions

Record lasting owner decisions about the site in `.claude/ux-web/DECISIONS.md`, newest first.

## Layout

- `src/app/` — the pages: the home, the legal pages and the account-deletion page, in each language; `src/app/api/` and `health/` are the server's own.
- `src/components/` — the page parts: the home page (`HomePage.tsx`, which `src/app/` renders in each language), the header and footer, and the live voice demo (`VoiceDemo.tsx`, with its static `VoiceExample.tsx` where it can't run).
- `src/content/` — all the copy: `site/` and `legal/`, per language.
- `src/styles/`, `public/` (images, fonts), `src/lib/voice/` (the live demo's limits and recording).
- `tests/` — Playwright and unit tests. `ux-renders.spec.ts` writes page renders and an accessibility audit to `artifacts/ux-web/` with `UX_RENDERS=1`.
- `scripts/` — deployment (never run them, see Rules); helpers in `scripts/dev/`. `edge/` is the Cloudflare edge worker. `.github/workflows/` — the pull request checks and the deploy from `main`.
- `.claude/ux-web/DECISIONS.md` — the owner's decisions about the site.

## Commands

Node, npm and Playwright run in WSL, on WSL's own disk, where they're several times faster than on `/mnt/c`. Run each one through `scripts/dev/webrun.py`, which syncs this checkout to a mirror and runs the command there:

```bash
MSYS_NO_PATHCONV=1 wsl -e python3 /mnt/c/Users/mikig/Desktop/Custom/MikiHacks/TaskFlow/TaskFlowWeb/scripts/dev/webrun.py --src /mnt/c/Users/mikig/Desktop/Custom/MikiHacks/TaskFlow/TaskFlowWeb --name main --port 3100 -- '<command>'
```

with `<command>` one of:

```bash
npm run check                                    # route types and TypeScript
npm run legal:check                              # the legal publication check
SITE_URL=https://taskflow.garbar.tech npm run build
npm run test:unit
npx playwright test --reporter=dot               # serves the last build: build first
```

Git runs on Windows. Port 3000 stays free for people; agents use 3100 and up.

## Rules

- **Branches.** Work on `dev`, the default branch; every pull request goes into `dev`. `main` is production. Never merge into or push `main`, and never deploy, unless the owner asks. Deploying means `scripts/deploy-*`, `cloudbuild.yaml`, `gcloud`, `wrangler` or `docker`. Releases go from `dev` to `main` by pull request, and **a merge into `main` deploys**: GitHub Actions publishes the site to Cloud Run, and the edge worker when `edge/` changed (the **Deploy** workflow, `.github/workflows/deploy.yml`). Pull requests into `dev` or `main` run the **CI** workflow, `.github/workflows/ci.yml`. Git's own credentials don't reach these private repos, so a push or fetch the owner asks for passes `gh`'s: `git -c credential.helper= -c "credential.helper=!gh auth git-credential" push`.
- **Other sessions' work.** This repo often holds another session's uncommitted and untracked work. Never commit, stage or revert it; commit only your own hunks.
- **The request decides.** A request to configure, explain, plan or inspect a workflow isn't a request to run it. Permission given once isn't standing permission.
- **Tooling.** Install, download and set up the tools a task needs, then say what you did; don't ask first. Product decisions still go to the owner.
- **Evidence.** Say what kind of evidence you have: a test, a render in Chromium or WebKit, or a real device. WebKit's renders aren't a real iPhone.
- **Secrets.** Never print, copy or log `.env*` values, or the app repo's `Backend/.env` and `App/config/`.
- **The live demo** calls Google's AI and costs money: tests and renders stub its API, and never call it.
