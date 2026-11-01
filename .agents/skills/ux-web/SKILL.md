---
name: ux-web
description: Review and improve TaskFlowWeb UX and verify its claims against the TaskFlow app, reusing the existing guidelines and history. Use for $ux-web, website UX reviews, named pages, approved web UX plans, and the post-change web review required by AGENTS.md. Support changes, site, fix, plan and page-scoped modes. Do not run during setup-only or explanatory requests, or when the user says not to run yet.
---

# TaskFlow website UX loop for Codex

Read `AGENTS.md` and `.codex/ux-workflow.md`. Delegate to the configured Codex
roles using that protocol. Keep the same history as Claude; never execute its
Workflow JavaScript. This skill runs from this repo, the website; the app it checks
the site against is `../TaskFlow`, read only. Keep both on `dev`.

## Modes

| Request | Action |
| --- | --- |
| `$ux-web` | Review website changes and changed app claims since the shared baseline, then fix and verify. |
| `$ux-web site` | Review the entire site; present a plan and stop for approval. |
| `$ux-web <pages or areas>` | Review and fix only the named journeys and their affected states. |
| `$ux-web fix [skip WP3 | only WP1 WP2]` | Execute the selected approved plan; require an unambiguous run and approval scope. |
| `$ux-web plan <run-id>` | Re-plan existing reports only, without rendering, testing or fixes. |

Use current authorization when approval has already been given. Ask about
unresolved product choices; never invent legal, pricing or entitlement policy.

## Shared sources and scope

- `.claude/skills/ux-web/references/loop.md`: environment, helpers, audits and record formats.
- `.claude/skills/ux-web/references/guidelines.md`, and the records
  `.claude/ux-web/{DECISIONS,ISSUES,KNOWN_FAILURES}.md`: use the ones relevant to the run.
- `.claude/agent-memory/web-ux-reviewer/`: relevant notes if present; don't
  assume a `MEMORY.md` exists or treat old observations as current proof.
- `.claude/agents/web-ux-reviewer.md`: web audit criteria and report format.
- `.claude/skills/ux-web/SKILL.md`: the area table, render procedures and staging
  helper documentation; its Claude runtime/model instructions do not apply.

Windows Git Bash, from this repo's root (PowerShell syntax):

```powershell
& 'C:\Program Files\Git\bin\bash.exe' .claude/skills/ux-web/scripts/ux-web.sh changed
& 'C:\Program Files\Git\bin\bash.exe' .claude/skills/ux-web/scripts/ux-web.sh app
```

Either `NO_SNAPSHOT` means stop and propose `$ux-web site`. Both empty means no
review. The helper uses `refs/ux-web/last` in this repo and
`refs/ux-web/app-last` in the app repo (`../TaskFlow`). Before website edits, take the ownership
baseline with `ux-web.sh base` once the shared lane is free; don't overwrite
another active run's `refs/ux-web/base`. None of these write operations belongs
in a setup-only task.

Areas: **H** home/hero/demo, **F** features/claims/download/Pro, **L** legal/privacy/
deletion/trust, **G** navigation/languages/accessibility/SEO/theme/performance.
Use the shared skill's exact file mapping. App claim changes add F; data/privacy/
deletion changes also add L. Verify claims against current app/backend behavior,
including unavailable or staging-only features; do not rely on promotional copy.

Reserve WEB issue ranges using the existing formula: `B = 0` if there are no
WEB issues, otherwise `floor(highestExistingWEB / 100) + 1`; reviewer k starts at
`(B + k) * 100 + 1`. Check both ledger and unresolved plans for collisions.
Keep existing WP package and WD decision numbering rather than reuse old IDs.

## Evidence and checks

Git and the shared helpers run on Windows. Node/npm/Playwright run in WSL,
with `source ~/.nvm/nvm.sh` and the site working directory, because the installed
dependencies contain Linux binaries. Preserve command exit codes with
`set -o pipefail` when piping output. Derive the WSL path from the actual checkout
instead of assuming a drive letter. Do not install another Node toolchain.

Read `.claude/skills/ux-web/references/loop.md` for the current commands. Build with
`SITE_URL=https://taskflow.garbar.tech npm run build` **before** Playwright renders;
its server serves the last production build. Check port 3000 before running:
do not reuse a stale server or stop one owned by another session. Coordinate or
configure an isolated port and matching test base URL instead.

The `tests/ux-renders.spec.ts` suite with `UX_RENDERS=1` writes
`artifacts/ux-web/INDEX.md`, `AUDIT.md`, PNGs, keyboard and ARIA evidence. Run its
non-performance cases before its isolated performance cases as documented.
Keep voice API calls stubbed. Safely scope any artifact cleanup to the resolved
site's generated output and only when no other run owns it. WebKit captures run
on Windows after the main render suite via `.claude/skills/ux-web/scripts/webkit_renders.py`,
using the documented tools environment. WebKit emulation is not a real iPhone.

The tester runs focused acceptance checks per package. Once per run, after the
last package is in (owner, 2026-11-01), it runs the README's type, legal, build,
unit and Playwright checks (`npm run check`, `npm run legal:check`,
`npm run build`, `npm run test:unit`, `npm test -- --reporter=dot`), with the same
production SITE_URL for the build, and refreshes affected evidence. Review all
supported languages, mobile/desktop, light/dark, keyboard, large text and error
states. Infrastructure or missing render failures stay visible as pending checks.

Use `.claude/skills/ux-web/scripts/pkg.py` for WP packages. Only the orchestrator writes the
shared web records and memory. Use the ownership-aware `ux-web.sh stage` helper
for site hunks and inspect the staged diff before any commit. Leave overlapping
or unrelated changes untouched. Never push or deploy; `ux-web.sh save` is allowed
only after the common protocol's complete-scope verification gate.
