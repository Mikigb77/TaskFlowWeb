# TaskFlow website

The marketing website for TaskFlow, the calendar-first task app for Android. Next.js 16, React 19, TypeScript and Tailwind CSS 4, in English, Spanish and Catalan, live at https://taskflow.garbar.tech. The app and its backend are in their own repo, `../TaskFlow`.

These instructions are for every coding agent. Claude Code reads them through `CLAUDE.md`, which adds what only Claude needs; Codex reads them here, with its setup in `.codex/`. How to run the site locally and what's on it: `README.md`.

## What the site may say

- **Only what the app does today.** The app repo is the source of truth: its English ARB (`../TaskFlow/App/lib/l10n/app_en.arb`), `../TaskFlow/App/docs/`, `../TaskFlow/Backend/docs/` and its decisions (`../TaskFlow/.claude/ux-review/DECISIONS.md`). Its open decisions are open here too.
- **Free and Pro, prices, limits and what happens to people's data are the owner's decisions,** recorded in `.claude/ux-web/DECISIONS.md` (WD2 onward). Change them only on the owner's word.
- **Subtract before adding.** The site needn't list every feature; it takes a visitor, truthfully, from a first visit to wanting the app.
- **Every visible string in English, Spanish and Catalan:** `src/content/site/{en,es,ca}.ts`, and the legal texts in `src/content/legal/`. Spanish and Catalan usually run longer, so check layouts at 320 px and at text 200%.
- **The legal pages** change with a version move and the owner's sign-off: `docs/LEGAL_RELEASE.md`.

## UX web loop

This section is for the main session.

Run the UX web loop once, before you report the work as done — **`/ux-web`** in Claude Code, **`$ux-web`** in Codex:
- after website work;
- whenever an app feature changes what the site should say, such as a new feature, a limit, a price, or what happens to people's data. The loop then also checks the site's claims against the app.

Before starting website work, run `bash .claude/skills/ux-web/scripts/ux-web.sh base`, so your changes can be told apart from another session's uncommitted work.

- `ux-web site` reviews the whole site and stops for the owner's approval. `ux-web fix` then carries out the approved plan.
- `ux-web <pages>` reviews only the pages named.

Owner policy (2026-10-18):
- fix everything the reviewer finds, except product decisions;
- stop for approval only on whole-site runs;
- commit each verified round on `dev`, the site's files and the loop's records together. A loop never pushes, and never deploys.

The loop is a self-contained skill: `.claude/skills/ux-web/` for Claude (its workflows, scripts and references) and `.agents/skills/ux-web/` for Codex. Both keep one shared history in `.claude/ux-web/` (decisions, the issue ledger and runs), and the reviewer's memory in `.claude/agent-memory/web-ux-reviewer/`. Never fork that history.

Record lasting owner decisions about the site in `.claude/ux-web/DECISIONS.md`. How the loop works, and which commands run in WSL and which on Windows: `.claude/skills/ux-web/references/loop.md`. Issues and their status: `.claude/ux-web/ISSUES.md`.

## Layout

- `src/app/` — the pages: the home, the legal pages and the account-deletion page, in each language; `src/app/api/` and `health/` are the server's own.
- `src/components/` — the page parts: the home page (`HomePage.tsx`, which `src/app/` renders in each language), the header and footer, and the live voice demo (`VoiceDemo.tsx`, with its static `VoiceExample.tsx` where it can't run).
- `src/content/` — all the copy: `site/` and `legal/`, per language.
- `src/styles/`, `public/` (images, fonts), `src/lib/voice/` (the live demo's limits and recording).
- `tests/` — Playwright and unit tests. `ux-web-*.spec.ts` are the loop's; `ux-renders.spec.ts` writes `artifacts/ux-web/` with `UX_RENDERS=1`.
- `scripts/` — deployment (never run them, see Rules); helpers in `scripts/dev/`. `edge/` is the Cloudflare edge worker. `.github/workflows/` — the pull request checks and the deploy from `main`.
- `.claude/` (Claude Code: the `/ux-web` skill, agents, the loop's history), `.agents/skills/` and `.codex/` (Codex).

## Commands

Node, npm and Playwright run in WSL, on WSL's own disk, where they're several times faster than on `/mnt/c`. Run each one through the loop's runner, which syncs this checkout to a mirror and runs the command there:

```bash
MSYS_NO_PATHCONV=1 wsl -e python3 /mnt/c/Users/mikig/Desktop/Custom/MikiHacks/TaskFlow/TaskFlowWeb/.claude/skills/ux-web/scripts/webrun.py --src /mnt/c/Users/mikig/Desktop/Custom/MikiHacks/TaskFlow/TaskFlowWeb --name main --port 3100 -- '<command>'
```

with `<command>` one of:

```bash
npm run check                                    # route types and TypeScript
npm run legal:check                              # the legal publication check
SITE_URL=https://taskflow.garbar.tech npm run build
npm run test:unit
npx playwright test --reporter=dot               # serves the last build: build first
```

Git runs on Windows. Port 3000 stays free for people; the loop uses 3100 and up.

## Rules

- **Branches.** Work on `dev`, the default branch; every pull request goes into `dev`. `main` is production. Never merge into or push `main`, and never deploy, unless the owner asks. Deploying means `scripts/deploy-*`, `cloudbuild.yaml`, `gcloud`, `wrangler` or `docker`. Releases go from `dev` to `main` by pull request, and **a merge into `main` deploys**: GitHub Actions publishes the site to Cloud Run, and the edge worker when `edge/` changed (the **Deploy** workflow, `.github/workflows/deploy.yml`). Pull requests into `dev` or `main` run the **CI** workflow, `.github/workflows/ci.yml`. Git's own credentials don't reach these private repos, so a push or fetch the owner asks for passes `gh`'s: `git -c credential.helper= -c "credential.helper=!gh auth git-credential" push`.
- **Other sessions' work.** This repo often holds another session's uncommitted and untracked work. Never commit, stage or revert it; the loop's `ux-web.sh base` and `stage` separate a run's own changes from it.
- **The request decides.** A request to configure, explain, plan or inspect a workflow isn't a request to run it. Permission given once isn't standing permission.
- **Tooling.** Install, download and set up the tools a task needs, then say what you did; don't ask first. Product decisions still go to the owner.
- **Evidence.** Say what kind of evidence you have: a test, a render in Chromium or WebKit, or a real device. WebKit's renders aren't a real iPhone.
- **Secrets.** Never print, copy or log `.env*` values, or the app repo's `Backend/.env` and `App/config/`.
- **The live demo** calls Google's AI and costs money: tests and renders stub its API, and never call it.

## Codex

- The website loop: `.agents/skills/ux-web/SKILL.md` (`$ux-web`). Protocol: `.codex/ux-workflow.md`. Roles: `.codex/agents/*.toml`.
- The skill authorizes delegating to those roles when a run is actually requested, never background jobs or starting a run during setup.
- Never run `.claude/skills/*/workflows/*.js` through Codex: they need Claude's Workflow runtime.
- Codex runs are named `<client-date>-codex-<mode>` in the same `runs/` folder. Don't overlap Claude and Codex review or fix runs: they share Git refs, the ledger, evidence and working directories.
