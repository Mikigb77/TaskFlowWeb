---
name: ux-web
description: Run TaskFlow's UX web loop on the marketing website (TaskFlowWeb). web-ux-reviewer reviews what changed since the last web review (or the whole site, or named pages) — including whether the site still tells the truth about the app — web-ux-organizer plans the fixes, web-ux-implementers make them side by side, and each package is locked with Playwright by web-ux-tester and re-checked on its own until it holds. Use when the owner types /ux-web, asks for a UX review of the website, after website work, and when an app feature changes what the site should say (AGENTS.md's UX web loop section).
argument-hint: "[site | fix [skip WP3 | only WP1 WP2] | plan <run id> | <pages or areas>]"
---

# /ux-web — TaskFlow's UX web loop

Invoking this skill is the owner's opt-in to running the `ux-web-review` and `ux-web-fix` workflows (decided 2026-10-18; see `.claude/ux-web/DECISIONS.md`). How the loop works: `.claude/skills/ux-web/references/loop.md`.

Two repos are involved:
- **this one, the website** (`C:/Users/mikig/Desktop/Custom/MikiHacks/TaskFlow/TaskFlowWeb`), holds the loop and is what gets reviewed and fixed. The skill is self-contained: its workflows are in `workflows/`, its tools in `scripts/`, and how the loop works and the review guidelines in `references/`. The loop's records (decisions, ledger, runs) are in `.claude/ux-web/`, and its agents in `.claude/agents/web-ux-*.md`;
- **the app repo**, `../TaskFlow`, holds the app the site describes. The loop only reads it: every claim on the site is checked against it, and its open decisions bind the site.

**Where commands run.** Git, `ux-web.sh` and `pkg.py` run on Windows, from this repo's root. Node, npm, npx and Playwright run in WSL, on WSL's own disk, through `.claude/skills/ux-web/scripts/webrun.py` (2026-10-21). Every such command has this shape (written `WSL: <command>` below):

```
MSYS_NO_PATHCONV=1 wsl -e python3 /mnt/c/Users/mikig/Desktop/Custom/MikiHacks/TaskFlow/TaskFlowWeb/.claude/skills/ux-web/scripts/webrun.py --src /mnt/c/Users/mikig/Desktop/Custom/MikiHacks/TaskFlow/TaskFlowWeb --name main --port 3100 -- '<command>'
```

- **What it does:** it syncs the website to a mirror under `~/twb` with rsync (or its own copy where rsync is missing), with `node_modules` installed once per lockfile and hard-linked into each mirror. It runs the command there with nvm's Node (or the Node on PATH), on the mirror's own port, and copies `artifacts/` and `test-results/` back to the checkout.
- **Why:** on `/mnt/c`, Node was several times slower.
- **The port:** the loop uses 3100 and up. The runner stops a server left on its port, and 3000 stays free for people.
- **Git Bash:** `MSYS_NO_PATHCONV=1` keeps Git Bash from rewriting the `/mnt/c` paths.
- **In a Linux session,** such as a cloud session, there's no WSL, and everything runs there: Git and the scripts, and the same runner directly, `python3 .claude/skills/ux-web/scripts/webrun.py --src "$(git rev-parse --show-toplevel)" --name main --port 3100 -- '<command>'`. The fix workflow picks the right form itself.

## 1. Read the argument

| Argument | Mode | What happens |
|---|---|---|
| (none) | **changes** | Review what changed on the website, and in the app features it describes, since the last web review; then fix and verify without stopping. |
| `site` | **site** | Review the whole website. Stop after the plan for the owner's approval. |
| `fix`, optionally followed by `skip WP3 WP7` or `only WP1 WP2` | — | Carry out the latest plan waiting for approval (§6). |
| `plan <run id>` | the run's mode | Plan again from the reports already in that run folder, without a new review. Use it after the owner answers decisions. Call `ux-web-review` with `reportPaths` set to the folder's `review-*.md` files, then continue as in §5. |
| anything else | **pages** | Review only the named pages, journeys or areas (`home`, `privacy`, `delete-account`, `languages`, `F`…), then fix and verify without stopping. |

## 2. Before starting

- Check that both repos are on `dev`: `git branch --show-current` and `git -C ../TaskFlow branch --show-current`. If either isn't, stop and ask.
- Check that no merge, rebase or cherry-pick is in progress in either repo.
- Name the run `<today>-<mode>`, adding `-2`, `-3` and so on if that folder already exists. The run folder is `.claude/ux-web/runs/<run id>/`; create it.
- Look at `git status --porcelain`. Another session has uncommitted and untracked work here: the legal pages and content, docs, `Dockerfile`, `package.json`, `src/app/layout.tsx` and more. It's part of the site being reviewed. **Never commit it, stage it or revert it**; §6 says how a run's own changes are told apart from it.
- Handle owner decisions from this conversation:
  - add the lasting ones to `.claude/ux-web/DECISIONS.md`, dated and in the owner's words;
  - pass everything else the agents should know as `notes`. They can't see the conversation.

## 3. Work out the scope

### changes
1. Run `bash .claude/skills/ux-web/scripts/ux-web.sh changed` (website files) and `bash .claude/skills/ux-web/scripts/ux-web.sh app` (the app-repo files the site's claims rest on: `../TaskFlow/App/docs/`, the app's English ARB, `../TaskFlow/Backend/docs/`, the app loop's DECISIONS and approved plans).
   - Either prints `NO_SNAPSHOT`: tell the owner there's no baseline yet, suggest `/ux-web site`, and stop.
   - Both print nothing: say "Nothing on the website changed since the last web review, and nothing in the app it describes" (the date comes from `ux-web.sh status`), and stop.
2. Map every website file to an area with the table below. Each area touched gets one reviewer. Its scope is its changed files, "and the pages, journeys and states they touch". An area with more than about 10 changed files gets two reviewers instead (keys `H1` and `H2`, and so on), each with half its files, grouped by page.
3. App-side changes add area **F** (if it isn't there already), with the scope "the site's claims about what these app-repo files changed: <list>". Add area **L** too when `../TaskFlow/Backend/docs/ACCOUNT_DELETION.md`, or a decision about data, privacy or deletion, changed. Pass the list as `appChanged`. If the app-side changes are clearly only wording the site never quotes, you may drop them; say so to the owner.

### pages
Map the named pages, journeys or areas to areas with the table. The scope is those pages and journeys, in every state, language, viewport and theme.

### site
Use all four areas, with the full scope from the table. The largest, H, gets two reviewers (owner, 2026-10-21), so five review side by side:
- **H1 · The pitch:** the hero, the closing call to action, and every call to action and where it leads.
- **H2 · The demo:** the live demo in every state (idle, recording, microphone denied, waiting, result, error, allowance used), and its static example (no JavaScript).
- **F**, **L** and **G** as in the table.

Packages still take the letter H; the workflow tells the organizer.

### Areas

| Area | Name | Files | Journeys to walk (site mode) |
|---|---|---|---|
| H | Home and hero, the value proposition, demos and calls to action | `src/components/HomePage.tsx` (the hero, the live demo and the closing call to action), `VoiceDemo.tsx` and `VoiceExample.tsx` (its static example, shown without JavaScript and wherever the live demo can't run), `Phone.tsx`, `src/styles/voice.css`, `src/lib/voice/policy.ts` and `recorder.ts` (the limits and recording a visitor feels), `public/images/`, `public/audio-capture.js` | first visit to wanting it, on a phone in Spanish and on desktop in English; the live demo in every state (idle, recording, microphone denied, waiting, result, error, allowance used) and its static example (no JavaScript); every call to action and where it leads |
| F | Features and faithfulness, the funnel to download and Pro, pricing | `src/components/HomePage.tsx` (the features, the questions, and anything about downloading, pricing or Pro), `src/components/Phone.tsx` and `public/images/` (the app as shown), checked against the app-side sources (`ux-web.sh app` lists the ones that changed) | from wanting it to getting it, honestly, while Google Play isn't published; free and Pro against the app; the claims inventory for the whole site; app features the site doesn't tell |
| L | Legal, privacy, terms, delete-account and trust | `src/app/{privacy,terms,legal,delete-account}/page.tsx`, `src/app/[language]/[document]/page.tsx`, `src/components/LegalPage.tsx`, `src/content/legal/`, `src/styles/legal.css` | trust: who runs TaskFlow, privacy, terms and contact, from the home page and from the app's links; deleting an account from Google Play's link, a search and the app, in each language; the legal pages' claims against the app and `../TaskFlow/Backend/docs/ACCOUNT_DELETION.md` |
| G | Global: navigation, header and footer, language switching, performance, accessibility, SEO and meta, light and dark | `src/app/layout.tsx`, `not-found.tsx`, `opengraph-image.tsx`, `robots.ts`, `sitemap.ts`, `src/components/Header.tsx`, `Footer.tsx`, `ThemeProvider.tsx`, `Icon.tsx`, `src/styles/global.css` (tokens, base, header, footer, buttons), `public/fonts/`, `public/favicon.svg`, `next.config.ts` | a wrong URL, a language switch and the way back; navigation on phone and desktop; every page at 320 px and at text 200%, by keyboard and screen reader, in light and dark; titles, descriptions, link previews, `lang` and `hreflang` for every page and language |

Shared files:
- `src/components/HomePage.tsx` belongs to H for the hero, the live demo and the closing call to action, and to F for the features and the questions. When a diff touches both, both. `src/app/page.tsx` and `src/app/[language]/page.tsx` only render it, with the home's metadata: G.
- `src/content/site/{en,es,ca}.ts` belongs to the areas of the keys the diff touches: `hero`, `voice` and `closing` → H; `features` and `faq` → F; `frame`, `meta` and `notFound` → G. `src/content/legal/` is L.
- `src/styles/global.css` belongs to the area of the selectors the diff touches (`.hero`, `.closing-` → H; `.feature-`, `.faq-` → F; tokens, base, `.site-header`, `.site-footer`, `.button`, `.appearance-` (the theme switch) → G). If unclear, G.
- `src/components/Phone.tsx` and `public/images/` belong to H and F.
- `src/app/layout.tsx`, `Header.tsx` and `Footer.tsx` show on every page: G, plus L when the legal pages' language or trust links are affected.
- A new file belongs to the area it fits by what it shows.

### ID ranges
- Let N be the highest WEB number in `.claude/ux-web/ISSUES.md`, or 0 if there's none: `grep -oE 'WEB-[0-9]+' .claude/ux-web/ISSUES.md | sort -t- -k2 -n | tail -1`.
- Let B be 0 when N is 0, otherwise `floor(N / 100) + 1`.
- Reviewer k (0-based) gets `idStart = (B + k) * 100 + 1`. The first whole-site run numbers its four areas from WEB-1, WEB-101, WEB-201 and WEB-301.

## 4. Render and measure the pages

Before any reviewer starts, run two commands; give the second a 10-minute timeout:

```
WSL: SITE_URL=https://taskflow.garbar.tech npm run build
WSL: rm -rf artifacts/ux-web && UX_RENDERS=1 npx playwright test tests/ux-renders.spec.ts --workers=6 --grep-invert "perf " --reporter=dot && UX_RENDERS=1 npx playwright test tests/ux-renders.spec.ts --workers=1 --grep "perf " --reporter=dot
```

- **The build comes first,** because the Playwright config serves the last production build (`npm run start`); without it the renders show old code. `SITE_URL` is production's, as the `Dockerfile` sets it: without it the pages have no canonical, hreflang or `og:url`, and the audit can't judge them. The build takes 1.5 to 6 minutes.
- **The renders and the audit** take about 3.5 minutes on 6 workers. **Lab performance** follows on its own, about 2 minutes, because other work running alongside slows its throttled CPU.
- Everything lands in `artifacts/ux-web/` (git ignores `artifacts/`), and its `INDEX.md` explains every file:
  - every public page, in each language it exists in, on desktop (1440 × 1000) and mobile (iPhone 13 in Chromium, 390 × 664), in light and dark: a first-viewport PNG and a full-page PNG with a magenta line at the fold;
  - the same pages with the browser's text size doubled (`text200`), at 200% zoom (`zoom200`) and 320 px wide (`w320`);
  - every state of the live demo on the home page, with the voice API stubbed and never called: recording, microphone refused, waiting, the timeout, results, every error the API sends, and more;
  - the home without JavaScript, the phone menu open, an FAQ answer open;
  - `AUDIT.md` and `audit.json`, the measured audit: axe, target sizes, text sizes, contrast, what a screen reader gets (with `aria/`), the keyboard path (with `focus/`), headings, metadata, overflow, and lab performance;
  - the link preview.

  On 2026-10-18 that was 550 PNGs, 446 focus screenshots and 103 ARIA snapshots.
- **Safari's engine (WebKit), from Windows, after the renders above.** Those start by deleting `artifacts/ux-web/`, so WebKit goes second. WSL here can't run Playwright's WebKit (its libraries aren't packaged for this Kali Linux), so it runs on Windows with Playwright for Python, in `C:\Users\mikig\.taskflow-tools\webkit`, set up on 2026-10-18.
  1. **Serve the mirror's build** as a background Bash job: `WSL: npm run start`, with `--no-back` before the `--`. It serves on port 3100. A server started with `nohup` dies when its `wsl` call returns.
  2. **Render.** Once http://localhost:3100 answers from Windows, run `UX_WEB_BASE=http://localhost:3100 C:\Users\mikig\.taskflow-tools\webkit\venv\Scripts\python.exe -X utf8 .claude/skills/ux-web/scripts/webkit_renders.py`. It takes about 2 minutes and writes 112 PNGs to `artifacts/ux-web/webkit/`, with an `INDEX.md` that lists any console errors.
  3. **Stop the server.**
  4. **If the tools folder is missing,** rebuild it:
     - create it with `python -m venv C:\Users\mikig\.taskflow-tools\webkit\venv`;
     - install Playwright with `…\venv\Scripts\python.exe -m pip install playwright`;
     - install WebKit with `PLAYWRIGHT_BROWSERS_PATH=C:\Users\mikig\.taskflow-tools\webkit\browsers …\venv\Scripts\python.exe -m playwright install webkit`.

     Don't put it under `AppData\Local`, because the Store's Python silently redirects it there.
- If the build or a render fails, mention it but keep going: renders are evidence, not a gate. A failing build is itself something to tell the owner.

## 5. Review and plan — workflow `ux-web-review`

Call the Workflow tool with `scriptPath` set to the absolute path of `.claude/skills/ux-web/workflows/ux-web-review.js` (the repo root comes from `git rev-parse --show-toplevel`). Don't use `name`: saved workflows are only looked up by name if they existed when the session started. Pass these args:

```
{ runId, runDir, date, mode,
  webDir: "C:/Users/mikig/Desktop/Custom/MikiHacks/TaskFlow/TaskFlowWeb",
  slices: [{ key, name, scope, idStart }],
  appChanged,
  notes }
```

When it returns:
- **`inlineReports` isn't empty:** a reviewer wasn't allowed to save its report. Write each `text` to its `path`.
- **`plan` is null** (no findings): run `bash .claude/skills/ux-web/scripts/ux-web.sh save`, tell the owner, and stop.
- **site mode:**
  1. Run `bash .claude/skills/ux-web/scripts/ux-web.sh save`.
  2. Show the owner:
     - each area's verdict;
     - the counts;
     - the decisions, with the organizer's recommendations;
     - the packages, one line each;
     - a link to `plan.md`.
  3. Stop. The owner approves ("go"), strikes packages, or answers decisions.
  4. Record their answers in `.claude/ux-web/DECISIONS.md`. If an answer unblocks findings, run `/ux-web plan <run id>`, so those findings become packages.
  5. Then go to §6.
- **changes or pages mode:** go straight on to §6.

## 6. Fix and verify — workflow `ux-web-fix`

Every package flows through on its own, in its own copy of the website with its own build mirror and port: web-ux-implementer, then web-ux-tester (tests, and renders of its pages), then web-ux-reviewer; if it falls short, one fix and a second check; then it's merged into the main checkout. A package starts as soon as its `dependsOn` are merged and an agent is free; it never waits for unrelated packages. When every package is in, one final check runs the type and legal checks, the build, the whole suite and the renders, the unit tests and lab performance; what still fails is re-planned once. How it works: `.claude/skills/ux-web/references/loop.md`, step 5.

1. **Make the starting point.**
   - If this session made website changes of its own before the run (the work being reviewed), commit them first, as in step 4's commit: `ux-web.sh ran` lists them if a `base` was taken before that work began (AGENTS.md asks for one). Message: `Changes reviewed by the UX web loop (<run id>)`, plus the attribution line. If no `base` was taken, commit only files that `git status` shows as changed by this session alone, and leave the rest for the owner.
   - Then run `bash .claude/skills/ux-web/scripts/ux-web.sh base`. It records the website's whole working tree, including the other session's uncommitted work, so the run's own changes can be told apart from it afterwards.
2. **Get ready.**
   - Keep the PC awake while it runs. In the desktop app, call `mcp__ccd_host__request_keep_awake` with `until: "session_idle"`. The longest runs so far each lost 2–4 hours to a sleeping or restarting laptop.
   - Count the CPUs: `nproc`. A workflow runs at most min(16, CPUs − 2) agents at once, whatever its args say: 14 on a 16-CPU PC, but only 2 in a 4-CPU cloud session. That cap, not the plan, is why runs in the cloud took so long.
   - It may run while a `ux-fix` run is going (owner, 2026-10-21). Each loop limits its own heavy commands: the website's builds and Playwright runs, the app's Flutter.
   - While it runs, don't edit, commit, stash or switch branches in the main checkout: every package's copy is seeded from it, and every merge writes it.
3. **Run it.** Call the Workflow tool with `scriptPath` set to the absolute path of `.claude/skills/ux-web/workflows/ux-web-fix.js`, and args `{ runId, runDir, date, repoRoot, heavySlots, skip, only, notes }`:
   - `repoRoot` is this repo (`git rev-parse --show-toplevel`), with forward slashes. With it, every package runs in its own copy of the website (`waves.py add`, under `~/.taskflow-tools/wt/`), with its own build mirror and port. Without it, packages run one at a time in the main checkout.
   - `heavySlots` is 2: builds and Playwright runs at once, across every run and lane of this repo. That's what WSL's 7.5 GB allows on the PC, and a cloud session's 4 CPUs.
   - For `/ux-web fix`, the run folder is the newest one under `.claude/ux-web/runs/` that has a `plan.json` but no `report.md`.
   - Leave `maxParallel`, `agents`, `fileLimit`, `fixAttempts`, `maxExtraRounds`, `portBase` and `runner` at their defaults unless the owner asks. The workflow works out for itself whether the runner goes through WSL (Windows) or runs directly (Linux).
   - Save the args of every run you start, with its run ID: resuming needs exactly the same args.

   **Lanes, on a machine with fewer than 8 CPUs** (a cloud session has 4): run the plan as two workflows at once, so each brings its own agents. More lanes don't help the website: its two heavy slots are full by then.
   1. Split it: `python -I -X utf8 .claude/skills/ux-web/scripts/pkg.py <runDir> --lanes 2`, adding `--only …` or `--skip …` as the owner asked. It prints each lane's packages; packages that depend on each other share a lane.
   2. Start one run per lane, both in the same message: the args above plus `part: "packages"`, `lane: "L1"` or `"L2"`, `only` set to that lane's packages, and `portBase` 3101 for L1 and 3131 for L2, so their copies' ports never meet.
   3. When both have returned, start one more run with the same args, without `lane`, `only` or `portBase`, plus `part: "finish"` and `laneResults` set to the list of the lanes' results, unchanged. It runs the final check, the re-plan and the record. Its result is what step 4 uses.
4. **When it returns:**
   - **Save the reports.** Write `close.report` to `<runDir>/<reportName>`, and each of `inlineNotes` to its `path`. Subagents may not write report files, so the agents return the text.
   - **`testsPassed` is true:** commit the run, in one commit.
     - **The site's files.** Run `bash .claude/skills/ux-web/scripts/ux-web.sh ran`. Stage the files that appear both there and in the workflow's `webFiles`, with `bash .claude/skills/ux-web/scripts/ux-web.sh stage <files>`:
       - a file that was clean when the run started is staged whole;
       - a file that held the other session's uncommitted changes gets only the run's hunks (`git apply --cached`);
       - a file it can't separate is **refused**: the run's lines touch the other session's, or the file is one the other session created and hasn't committed. Leave it uncommitted and tell the owner.

       A file in `ran` but in neither `webFiles` nor `loopFiles` changed under the run, by someone else: don't stage it.
     - **The loop's records.** `git add -- .claude/ux-web/ISSUES.md .claude/ux-web/KNOWN_FAILURES.md .claude/ux-web/runs/<run id> .claude/agent-memory/web-ux-reviewer`, plus `.claude/ux-web/DECISIONS.md` if you recorded decisions. They're the loop's own files, never another session's.
     - Check `git diff --cached` (only the run's lines and records), then commit: subject `UX web loop <run id>: <n> fixes verified`; body: the verified IDs, then the IDs still open with a short reason each, then any refused files; end with the attribution line.
   - **`testsPassed` is false:** don't commit. Tell the owner which checks fail, and that the changes are left uncommitted for them to look at.
   - **Packages set aside** (`packages[].patch`): a package whose own tests still failed after its fix isn't merged; its patch is in the run folder. List them for the owner; don't apply them.
   - Either way, run `bash .claude/skills/ux-web/scripts/ux-web.sh save` afterwards.
   - **Leftovers:** `ls ~/.taskflow-tools/wt/` should list no copy named after this run. A run that was stopped can leave copies behind; remove each with `python -I -X utf8 .claude/skills/ux-web/scripts/waves.py drop --worktree <path> --save <runDir>/leftover-<name>.patch`, which also removes its build mirror.

Never push. Never deploy: no `scripts/deploy-*`, `gcloud`, `wrangler` or `docker`. Never commit on `main`. Never skip hooks. Never commit, stage or revert the other session's work.

### Big plans run in one go

Run the whole approved plan in one run, or one pair of lanes. Don't split it into batches: each package already gets its own tester and reviewer, and every batch only added a final check, a record and a wait for its slowest package. `batch` still names a run's report and records, for a plan that must be split for another reason, such as the owner approving it in parts. Then set `recordMemory: false` on every part but the last, and after each part save its report, commit, and run `ux-web.sh save`, then `ux-web.sh base`.

### How long it takes

The 2026-10-28-site plan's first batch (5 packages) took almost 4 hours, from its start to its commit, in a 4-CPU cloud session on 2026-11-01: its packages in waves, two agents at a time; then four of them integrated again, one by one, in the main checkout, because the merge step crashed calling WSL, which a cloud session hasn't got; then the round's check (31 minutes) and a second round. With packages flowing through on their own, the same batch comes to about 2 hours there in one run, and about 1½ hours in two lanes. These are estimates from that batch's measured step times, not a measured run. On the PC, with 14 agents and WSL's heavy slots, a plan's packages no longer wait for agents at all, only for the two heavy slots.

## 7. Tell the owner

Keep it short; the details live in `report.md`.
- The verdict, in one line.
- What was fixed and verified: up to five IDs with titles, then "and N more".
- What's still open, what was escalated, and the decisions needed, each with its question.
- Files `stage` refused, which stay uncommitted.
- Checks for a real device or a person: Safari on an iPhone, a screen reader, the live voice demo.
- Links to `report.md`, `.claude/ux-web/ISSUES.md`, and the commit.

## Size and cost

- **Each package:** an implementer, a tester and a reviewer; a fix and a second check when it falls short; a share of a merge step (a small model runs it). A conflict at merge adds an integrator.
- **Each run:** a load step, one final check, the record and the reviewer's memory; a re-plan and its packages if the final check fails.
- **Scoped run, one area:** 1 reviewer and 1 organizer, then about 4–6 agents per package.
- **Whole site:** 5 reviewers (H has two) and 1 organizer, then the same per package.
- Each implementer builds the site once in its copy's mirror (1.5 to 6 minutes), and its tester serves that build. The final check builds once more and runs the whole suite, the renders and the audit side by side: about half an hour in a cloud session.

Models and effort are set in each agent's frontmatter in `.claude/agents/web-ux-*.md`. The fix workflow lowers the effort of verification, the re-plan and the record, and runs the mechanical steps (loading the plan, merging) on a small model.
