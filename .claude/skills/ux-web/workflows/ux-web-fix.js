export const meta = {
  name: 'ux-web-fix',
  description: 'TaskFlow UX web loop, part 2: every package flows through on its own, in its own copy of the website with its own build mirror and port (web-ux-implementer, web-ux-tester, web-ux-reviewer, one fix and a second check if it falls short, then the merge), as many at once as the machine allows; one final check runs the type and legal checks, the build, the whole suite, the unit tests and the renders; what still fails is re-planned once; then the ledger, report and reviewer memory',
  whenToUse: 'Started by the /ux-web skill after ux-web-review, with the run folder whose plan.json should be carried out.',
  phases: [
    { title: 'Load', detail: 'read the package headers, and how this machine runs the website\'s commands' },
    { title: 'Packages', detail: 'each package in its own copy of the website: implement, test, verify, fix once and verify again if it falls short, then merge. A package starts as soon as its dependencies are merged and a slot is free; it never waits for unrelated packages.' },
    { title: 'Check', detail: 'the final check in the main checkout: type and legal checks, build, the whole suite and the renders side by side, unit tests, lab performance' },
    { title: 'Re-plan', detail: 'web-ux-organizer plans what the final check or the reviewers left failing (one extra round by default)' },
    { title: 'Record', detail: 'ledger, run report and reviewer memory' },
  ],
}

// args, from the /ux-web skill:
//   runId, runDir, date
//   repoRoot:       this repo, the website, absolute, forward slashes. With it, every package runs
//                   in its own copy of the website (waves.py add); without it, every package runs
//                   in the main checkout, one at a time.
//   webDir:         the same, for older callers (optional; runs in the main checkout)
//   heavySlots:     builds and Playwright runs at once, across every workflow and lane of this
//                   repo; default 2 (WSL has about 7.5 GB; a 4-CPU cloud session has 4 CPUs).
//   agents:         agents at once in this workflow; default the runtime's own cap,
//                   min(16, CPUs - 2), from the CPU count the load step reads.
//   maxParallel:    packages in flight at once (admitted, holding a copy, a port and their
//                   files); default agents + 2.
//   fileLimit:      packages changing the same file at once; default 2. The site's copy
//                   (src/content), the stylesheets and the tests don't count: they merge line by line.
//   fixAttempts:    fixes per package after its check finds it short, in its copy; default 1.
//   maxExtraRounds: re-plan rounds after the final check; default 1.
//   portBase:       the first port for the packages' copies; default 3101. The main checkout
//                   uses 3100. Lanes take ports 30 apart (SKILL.md, "Lanes").
//   runner:         'wsl' or 'direct': how webrun.py runs; default from the load step (WSL on
//                   Windows, directly elsewhere).
//   planFile:       the plan to load, when not the run's plan.json (optional).
//   skip, only:     [packageId] — packages the owner struck, or the only ones to run (optional).
//   batch:          names this run's report and records when a plan runs in parts (optional).
//   recordMemory:   false skips the reviewer's memory step (optional; default true).
//   notes:          owner context from the conversation (optional).
//   part:           'all' (default); 'packages' runs only the packages and returns their
//                   records, for one lane of several; 'finish' runs the final check, the
//                   re-plan and the record for lanes that ran, given laneResults.
//   lane:           this lane's name, for its labels, copies and logs (with part 'packages').
//   laneResults:    [the result of each lane] (with part 'finish').
//   copies:         false runs every package in the main checkout, one at a time (a fallback).
const a = args || {}
if (!a.runId || !a.runDir) throw new Error('ux-web-fix needs runId and runDir. Start it with /ux-web.')
const norm = p => String(p || '').trim().replace(/\\/g, '/').replace(/^\/mnt\/([a-zA-Z])\//, '$1:/').replace(/^\/([a-zA-Z])\//, '$1:/').replace(/\/+$/, '')
const same = (x, y) => {
  const p = norm(x)
  const q = norm(y)
  return !!p && (p === q || (/^[a-zA-Z]:\//.test(p) && p.toLowerCase() === q.toLowerCase()))
}
const isAbs = p => /^([a-zA-Z]:)?\//.test(norm(p))
const WEB = norm(a.repoRoot || a.webDir || 'C:/Users/mikig/Desktop/Custom/MikiHacks/TaskFlow/TaskFlowWeb')
const COPIES = !!norm(a.repoRoot) && a.copies !== false
const PART = a.part === 'packages' || a.part === 'finish' ? a.part : 'all'
const LANE = a.lane ? String(a.lane).replace(/[^A-Za-z0-9._-]/g, '') : ''
const int = (v, d, min = 1) => (Number.isInteger(v) && v >= min ? v : d)
const SLOTS = int(a.heavySlots, 2)
const FILE_LIMIT = int(a.fileLimit, 2)
const FIXES = int(a.fixAttempts, 1, 0)
const EXTRA_ROUNDS = int(a.maxExtraRounds, 1, 0)
const PORT_BASE = int(a.portBase, 3101)
const MAIN_PORT = 3100
const skip = new Set(Array.isArray(a.skip) ? a.skip : [])
const only = Array.isArray(a.only) && a.only.length ? new Set(a.only) : null
const batch = typeof a.batch === 'string' && a.batch ? a.batch : ''
const tag = batch ? `${batch}-` : ''
const reportName = batch ? `report-${batch}.md` : 'report.md'
const recordMemory = a.recordMemory !== false
const RUN = isAbs(a.runDir) ? norm(a.runDir) : `${WEB}/${norm(a.runDir)}`
const PLAN = typeof a.planFile === 'string' && a.planFile ? a.planFile : `${a.runDir}/plan.json`
const PLAN_ABS = isAbs(PLAN) ? norm(PLAN) : `${WEB}/${norm(PLAN)}`
const PY = 'python -I -X utf8'
const WAVES = `MSYS_NO_PATHCONV=1 ${PY} "${WEB}/.claude/skills/ux-web/scripts/waves.py"`
const PKG = `${PY} "${WEB}/.claude/skills/ux-web/scripts/pkg.py" "${RUN}"`
const MERGE_LOG = `${RUN}/merges${batch ? `-${batch}` : ''}${LANE ? `-${LANE}` : ''}.jsonl`

// How webrun.py runs: in WSL on Windows (the website's checkout is on the Windows drive, where
// Node is slow), directly in a Linux session. Set from the load step.
let RUNNER = a.runner === 'wsl' || a.runner === 'direct' ? a.runner : /^[a-zA-Z]:\//.test(WEB) ? 'wsl' : 'direct'
let CPUS = 4
let COPY_DIR = ''
const toWsl = p => String(p).replace(/^([A-Za-z]):/, (m, d) => `/mnt/${d.toLowerCase()}`)
// Every npm, npx and Playwright command runs in a build mirror (webrun.py), on its own port,
// through the web pool's gate.
function webrun(src, name, port, serve) {
  const runner = RUNNER === 'wsl'
    ? `wsl -e python3 ${toWsl(WEB)}/.claude/skills/ux-web/scripts/webrun.py --src ${toWsl(src)}`
    : `python3 "${WEB}/.claude/skills/ux-web/scripts/webrun.py" --src "${src}"`
  return `${WAVES} gate --pool web --slots ${SLOTS} -- ${runner} --name ${name} --port ${port}${serve ? ' --serve' : ''} --`
}
const mainRun = () => webrun(WEB, 'main', MAIN_PORT)
// Playwright workers for the final check: the PC has many CPUs; a small machine slows down and
// times out with more workers than CPUs.
const workers = () => (CPUS >= 12 ? { suite: 6, renders: 4 } : { suite: 2, renders: 2 })
// The build served once, so the whole suite and the renders run side by side against it, each
// Playwright run with its own output folder.
function sideBySide() {
  const w = workers()
  return `${webrun(WEB, 'main', MAIN_PORT, true)} 'npx playwright test --reporter=dot --workers=${w.suite} > /tmp/ux-suite.log 2>&1 & s=$!; (rm -rf artifacts/ux-web && UX_RENDERS=1 npx playwright test tests/ux-renders.spec.ts --workers=${w.renders} --grep-invert "perf " --reporter=dot --output=test-results-renders > /tmp/ux-renders.log 2>&1) & r=$!; wait $s; se=$?; wait $r; re=$?; tail -n 40 /tmp/ux-suite.log; tail -n 15 /tmp/ux-renders.log; echo "suite exit $se, renders exit $re"'`
}
const perf = () => `${mainRun()} 'UX_RENDERS=1 npx playwright test tests/ux-renders.spec.ts --workers=1 --grep "perf " --reporter=dot'`

// Agents sometimes report absolute paths. Files become relative to the website root, or to a
// copy's root.
function rel(file) {
  const p = norm(file)
  const lower = p.toLowerCase()
  if (lower.startsWith(WEB.toLowerCase() + '/')) return p.slice(WEB.length + 1)
  const copy = p.match(/\.taskflow-tools\/wt\/[^/]+\/(.+)$/)
  if (copy) return copy[1]
  return p.replace(/^\.\//, '').replace(/^TaskFlowWeb\//, '')
}
// The loop's own files (its records, agents and skills): committed with the run, but never
// staged as site changes.
const isLoopFile = f => /^(\.claude|\.agents|\.codex)\//.test(f)

// Reading discipline for every step. Whole files are what made the app loop's trial
// expensive: every big read is written to cache once, then re-read on every later turn.
const LEAN = [
  `Read packages with: ${PKG} <ids> --conventions. Never open plan.json or plan-*.json directly; they are large.`,
  `Read a finding with: grep -n -A 30 "<ID>" "${RUN}"/review-*.md. Never read a whole review report.`,
  'Read source files in the parts you need (search first, then read with offset and limit), and only the renders of pages that changed (artifacts/ux-web/INDEX.md maps them).',
].join('\n')

// ---------------------------------------------------------------- schemas

const HEADER = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    area: { type: 'string' },
    size: { type: 'string' },
    findings: { type: 'array', items: { type: 'string' } },
    dependsOn: { type: 'array', items: { type: 'string' } },
    files: { type: 'array', items: { type: 'string' }, description: 'The website files the package expects to change, relative to its root, as its "files" lists them' },
  },
  required: ['id', 'title', 'area', 'size', 'findings'],
}
const LOADED = {
  type: 'object',
  properties: {
    planFile: { type: 'string' },
    cpus: { type: 'integer' },
    platform: { type: 'string' },
    toplevel: { type: 'string' },
    commonDir: { type: 'string' },
    copiesDir: { type: 'string' },
    packages: { type: 'array', items: HEADER },
  },
  required: ['cpus', 'platform', 'toplevel', 'copiesDir', 'packages'],
}
const CHECK = {
  type: 'object',
  properties: {
    command: { type: 'string' },
    passed: { type: 'boolean' },
    note: { type: 'string' },
  },
  required: ['command', 'passed'],
}
const MISSED = {
  type: 'object',
  properties: { id: { type: 'string' }, reason: { type: 'string' } },
  required: ['id', 'reason'],
}
const IMPLEMENTED = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['done', 'partial', 'blocked', 'failed'] },
    filesChanged: { type: 'array', items: { type: 'string' }, description: 'Website paths, relative to its root' },
    addressed: { type: 'array', items: { type: 'string' } },
    notAddressed: { type: 'array', items: MISSED },
    checks: { type: 'array', items: CHECK },
    deviceChecks: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string', description: 'Include every changed file that holds another session\'s uncommitted work' },
    worktree: { type: 'string', description: 'In a copy: its path, as the add command printed it. Otherwise empty.' },
  },
  required: ['status', 'filesChanged', 'addressed', 'notAddressed', 'checks'],
}
const FINDING_TEST = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    coverage: { type: 'string', enum: ['tested', 'render', 'device', 'none'] },
    tests: { type: 'array', items: { type: 'string' }, description: 'file :: test name' },
    result: { type: 'string', enum: ['pass', 'fail', 'n/a'] },
    note: { type: 'string' },
  },
  required: ['id', 'coverage', 'result'],
}
const FAILURE = {
  type: 'object',
  properties: {
    test: { type: 'string' },
    owner: { type: 'string', enum: ['site', 'infrastructure'] },
    finding: { type: 'string', description: 'The finding it proves, if any' },
    evidence: { type: 'string' },
  },
  required: ['test', 'owner', 'evidence'],
}
const TESTED = {
  type: 'object',
  properties: {
    passed: { type: 'boolean', description: 'True when every new test passes and nothing fails outside KNOWN_FAILURES.md' },
    checks: { type: 'array', items: CHECK },
    findings: { type: 'array', items: FINDING_TEST },
    failures: {
      type: 'array',
      description: 'Failures still open after you fixed your own tests: the site falls short, or infrastructure you could not fix',
      items: FAILURE,
    },
    filesChanged: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string' },
  },
  required: ['passed', 'checks', 'findings', 'failures', 'filesChanged'],
}
const MERGED = {
  type: 'object',
  properties: {
    packages: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          worktree: { type: 'string' },
          applied: { type: 'array', items: { type: 'string' } },
          conflicts: {
            type: 'array',
            items: { type: 'object', properties: { path: { type: 'string' }, why: { type: 'string' } }, required: ['path', 'why'] },
          },
          ignored: { type: 'array', items: { type: 'string' } },
          gone: { type: 'boolean' },
          alreadyMerged: { type: 'boolean' },
          error: { type: 'string' },
          cleanup: { type: 'string' },
        },
        required: ['id', 'applied', 'conflicts'],
      },
    },
    shelved: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          worktree: { type: 'string' },
          patch: { type: 'string' },
          removed: { type: 'boolean' },
          note: { type: 'string' },
          error: { type: 'string' },
        },
        required: ['id'],
      },
    },
    removed: { type: 'array', items: { type: 'string' } },
  },
  required: ['packages'],
}
const REGRESSION = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    severity: { type: 'integer' },
    title: { type: 'string' },
    where: { type: 'string' },
    fix: { type: 'string' },
  },
  required: ['id', 'severity', 'title', 'where', 'fix'],
}
const VERIFIED = {
  type: 'object',
  properties: {
    reportPath: { type: 'string' },
    results: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          result: { type: 'string', enum: ['fixed', 'partly', 'not_fixed'] },
          evidence: { type: 'string' },
          needsDevice: { type: 'boolean' },
        },
        required: ['id', 'result', 'evidence'],
      },
    },
    regressions: { type: 'array', items: REGRESSION },
    notesText: { type: 'string', description: 'Only if writing the notes file was refused: the full notes' },
  },
  required: ['reportPath', 'results', 'regressions'],
}
const REPLANNED = {
  type: 'object',
  properties: {
    packages: { type: 'array', items: HEADER },
    escalated: { type: 'array', items: MISSED },
  },
  required: ['packages', 'escalated'],
}
const CLOSED = {
  type: 'object',
  properties: {
    verdict: { type: 'string', description: 'One or two sentences' },
    report: { type: 'string', description: 'The full run report in Markdown. Return it here; the main session saves it, because subagents may not write report files.' },
    verified: { type: 'array', items: { type: 'string' } },
    open: { type: 'array', items: MISSED },
    deviceChecks: { type: 'array', items: { type: 'string' } },
  },
  required: ['verdict', 'report', 'verified', 'open', 'deviceChecks'],
}

// ---------------------------------------------------------------- scheduling

// Files every package may touch: the site's copy (src/content), the stylesheets and the tests
// merge line by line, and two insertions at one place keep both; a real conflict is carried
// into a fresh copy, and the final check's renders catch styles that clash. They never hold
// packages back. Keep in step with pkg.py.
const MERGEABLE = /^(src\/content\/|src\/styles\/|tests\/)/
function footprint(p) {
  const files = (Array.isArray(p.files) ? p.files : [])
    .map(f => rel(String(f)).split(/[\s:#(]/)[0])
    .filter(Boolean)
  return files.filter(f => !MERGEABLE.test(f))
}

// Agents at once. The runtime caps a workflow at min(16, CPUs - 2) and queues the rest first
// come, first served; this queue goes first by priority instead, so an earlier package's
// next step (test, verify, merge) runs before a later package starts. Packages finish one
// after another, their copies go, and later packages are seeded with more of the run.
let AGENTS = int(a.agents, 2)
let active = 0
let order = 0
const waiting = []
function pump() {
  while (active < AGENTS && waiting.length) {
    active++
    waiting.shift().go()
  }
}
function slot(prio) {
  return new Promise(go => {
    waiting.push({ prio, n: order++, go })
    waiting.sort((x, y) => x.prio - y.prio || x.n - y.n)
    pump()
  })
}
async function call(prio, prompt, opts) {
  await slot(prio)
  try {
    return await agent(prompt, opts)
  } catch (e) {
    log(`${opts.label}: ${(e && e.message) || e}`)
    return null
  } finally {
    active--
    pump()
  }
}

// Packages in flight: admitted ones hold a port and their files until they are merged, so at
// most FILE_LIMIT packages change one file at once. A package that can't start yet never
// holds back a later one that can.
let FLIGHT = 1
let ports = []
const flight = { running: 0, holders: new Map(), waiting: [] }
function admit(p, prio) {
  const files = footprint(p)
  return new Promise(go => {
    flight.waiting.push({ files, prio, n: order++, go })
    flight.waiting.sort((x, y) => x.prio - y.prio || x.n - y.n)
    letIn()
  })
}
function letIn() {
  for (let i = 0; i < flight.waiting.length;) {
    const w = flight.waiting[i]
    const fits = flight.running < FLIGHT && w.files.every(f => (flight.holders.get(f) || 0) < FILE_LIMIT)
    if (!fits) {
      i++
      continue
    }
    flight.waiting.splice(i, 1)
    flight.running++
    w.files.forEach(f => flight.holders.set(f, (flight.holders.get(f) || 0) + 1))
    const port = COPIES ? ports.shift() : MAIN_PORT
    let left = false
    w.go({
      port,
      leave: () => {
        if (left) return
        left = true
        flight.running--
        w.files.forEach(f => flight.holders.set(f, flight.holders.get(f) - 1))
        if (COPIES) ports.push(port)
        letIn()
      },
    })
  }
}

// Merges and shelves, one at a time in the main checkout. Whatever is waiting when the last
// merge ends goes in the next one, so packages that finish together merge together.
const toMerge = []
let merging = false
let mergeRound = 1
function enqueue(item) {
  return new Promise(resolve => {
    toMerge.push({ ...item, resolve })
    if (!merging) drain()
  })
}
async function drain() {
  merging = true
  try {
    while (toMerge.length) {
      const items = toMerge.splice(0)
      const m = await call(0, mergePrompt(items), {
        label: `merge ${items.map(x => (x.kind === 'shelve' ? `(set aside ${x.id})` : x.id)).join(' ')}${mergeRound > 1 ? ` · round ${mergeRound}` : ''}`,
        phase: 'Packages',
        schema: MERGED,
        model: 'haiku',
      })
      const merged = new Map(((m && m.packages) || []).map(e => [e.id, e]))
      const shelved = new Map(((m && m.shelved) || []).map(e => [e.id, e]))
      for (const x of items) x.resolve((x.kind === 'shelve' ? shelved : merged).get(x.id) || null)
    }
  } finally {
    merging = false
  }
}

// ---------------------------------------------------------------- prompts

const ids = list => (list.length ? list.join(', ') : 'none')
const missed = r => (r && r.notAddressed && r.notAddressed.length ? `; not addressed: ${r.notAddressed.map(n => `${n.id} (${n.reason})`).join('; ')}` : '')
const why = r => (!r ? 'its agent returned nothing' : r.status === 'failed' ? `it failed: ${r.notes || 'no notes'}` : !r.worktree ? 'it reported no copy' : `it worked in ${r.worktree}, not in its own copy`)
// A Playwright or unit test run; the renders alone don't count.
const isTest = c => /playwright test(?! tests\/ux-renders)|npm (run )?test\b/.test(c.command)

// Verify notes a reviewer couldn't save: passed on inline, and saved by the main session.
const inlineNotes = []
function notesAppendix(pred) {
  const notes = inlineNotes.filter(n => !pred || pred(n))
  return notes.length
    ? ['', 'Verify notes that could not be saved as files:', ...notes.flatMap(n => ['', `===== ${n.path} =====`, n.text])]
    : []
}

const copyName = (p, round, suffix) => `${a.runId}-${tag}${LANE ? `${LANE}-` : ''}r${round}-${p.id}${suffix || ''}`.replace(/[^A-Za-z0-9._-]/g, '')
const copyOf = (name, port) => ({ name, port, path: `${COPY_DIR}/${name}` })

function runLines(c) {
  if (!COPIES) {
    return [
      `Run every npm, npx and Playwright command as: ${mainRun()} '<command>'`,
      `That runs it in the checkout's build mirror, on port ${MAIN_PORT}, and copies artifacts/ and test-results/ back into ${WEB}.`,
    ].join('\n')
  }
  return [
    `Run every npm, npx and Playwright command as: ${webrun(c.path, c.name, c.port)} '<command>'`,
    `That runs it in the copy's own build mirror, on port ${c.port}, through a gate that lets only ${SLOTS} builds or Playwright runs go at once, and copies artifacts/ and test-results/ back into the copy.`,
  ].join('\n')
}

function where(c) {
  return COPIES
    ? `Work only in the package's copy of the website at ${c.path}: read and write files under it, with absolute paths. Never touch the main checkout at ${WEB}: other packages are being worked on at the same time, in their own copies.\n${runLines(c)}`
    : `Work in the main checkout at ${WEB}; packages run one at a time there.\n${runLines(c)}`
}

function packageLine(p, r) {
  return `- ${p.id} (${p.title}): findings ${p.findings.join(', ')}. Implementer: ${r ? r.status : 'no result'}${missed(r)}`
}

function implementPrompt(p, ctx, c, depNote, extra) {
  const lines = [
    `UX web loop run ${a.runId}, round ${ctx.round}. Implement work package ${p.id}: ${p.title}.`,
    `Area ${p.area}, size ${p.size}, findings ${p.findings.join(', ')}.`,
  ]
  if (COPIES) {
    lines.push(
      `You work in your own copy of the website, made for you. Other packages are implemented, tested and checked at the same time in theirs, sometimes on the same files, so never edit the main checkout at ${WEB}.`,
      `Before anything else, run: ${WAVES} add --repo "${WEB}" --name ${c.name} --fresh`,
      `It prints JSON: your copy is at ${c.path} ("worktree"), seeded with the website's uncommitted state and every package merged before yours. Edit only files under it, with absolute paths; package paths are relative to its root. If add fails, stop and report failed with its message.`,
      runLines(c),
      `Return ${c.path} in "worktree".`,
    )
  } else {
    lines.push(where(c))
  }
  if (depNote) lines.push(depNote)
  lines.push(
    `Your instructions are package ${p.id}: its brief, files, acceptance checks and device checks, plus the plan's shared conventions. Print exactly those with: ${PKG} ${p.id} --conventions`,
    LEAN,
    'Earlier packages in this run may already have changed the code; build on their work.',
    'Test files listed in the package are for web-ux-tester, who writes the acceptance tests after you. Only update existing tests your change breaks.',
    'Checks: npm run check; then npm run build (Playwright serves the last build); then only the existing specs that cover your change, in one Playwright call. Never the whole suite, the unit tests or the full renders: the run\'s final check runs them once. web-ux-tester renders the pages you changed, after you, for the reviewer: render one yourself only if you can\'t judge a layout change any other way, and then only that page (UX_RENDERS=1 npx playwright test tests/ux-renders.spec.ts --reporter=dot -g "<page> " --grep-invert "perf ").',
    `Another session may have uncommitted work in the website (git -C "${WEB}" status --porcelain). Change those files only where your brief says, never reformat them, and name them in your notes.`,
  )
  if (extra) lines.push(extra)
  if (a.notes) lines.push(`From the owner, this session: ${a.notes}`)
  lines.push('Return the structured result.')
  return lines.join('\n')
}

function testPrompt(p, ctx, r, c) {
  const ran = r.checks.filter(x => x.passed && isTest(x)).map(x => x.command)
  const served = COPIES ? webrun(c.path, c.name, c.port, true) : webrun(WEB, 'main', MAIN_PORT, true)
  return [
    `UX web loop run ${a.runId}, round ${ctx.round}. Mode: package. Lock work package ${p.id} with Playwright tests: ${p.title}.`,
    `Area ${p.area}, findings ${p.findings.join(', ')}. Its implementer reported: ${r.status}${missed(r)}.`,
    where(c),
    `Files the implementer changed: ${ids(r.filesChanged)}.`,
    ran.length
      ? `The implementer already ran these, green; don't run them again unless you change those specs: ${ran.join(' ; ')}`
      : 'The implementer reported no green Playwright run.',
    `1. Write the tests for ${p.id}'s acceptance checks only, as your instructions say.`,
    '2. Don\'t build again: writing tests changes no page, and the copy\'s mirror keeps the implementer\'s build. Build only if Playwright finds no build to serve.',
    `3. Run your new and changed spec files, and render the pages ${p.id} changed for the reviewer, against one served build, in one call: ${served} 'npx playwright test <your spec files> --reporter=dot; t=$?; UX_RENDERS=1 npx playwright test tests/ux-renders.spec.ts --workers=${workers().renders} --reporter=dot --output=test-results-renders -g "<page> |<page> " --grep-invert "perf "; r=$?; echo "tests exit $t, renders exit $r"'`,
    '   Pages are home, privacy, terms, legal, delete-account and not-found; add a language to narrow one ("privacy es "). The home renders every demo state with it. --grep-invert "perf " leaves out lab performance, which the final check measures on its own. If the package changes every page (layout, header, footer, global styles), render them all: leave out -g.',
    '4. If a render scenario breaks because a page changed on purpose, update tests/ux-renders.spec.ts or tests/support/ux-voice.ts; if the site broke, that\'s a site failure.',
    'Skip the run\'s check: no whole suite, no unit tests, no full renders, no lab performance. The final check runs those once, after every package is merged.',
    'Parts of a package marked "waits on WD#" were left out on purpose; do not test them.',
    LEAN,
    'Return the structured result for this package only. filesChanged lists your test files, relative to the website root.',
  ].join('\n')
}

function verifyPrompt(p, ctx, r, t, c, check, fixNote) {
  const name = `verify-${tag}r${ctx.round}-${p.id}${check > 1 ? `-${check}` : ''}.md`
  const proved = (t ? t.findings : [])
    .filter(f => p.findings.includes(f.id))
    .map(f => `- ${f.id}: ${f.coverage}, ${f.result}${f.tests && f.tests.length ? ` (${f.tests.join('; ')})` : ''}${f.note ? `. ${f.note}` : ''}`)
  const failing = (t ? t.failures : []).map(f => `- ${f.test} (${f.owner}${f.finding ? `, ${f.finding}` : ''}): ${f.evidence}`)
  return [
    `Mode: verify. UX web loop run ${a.runId}, round ${ctx.round}, work package ${p.id}, area ${p.area}. Today is ${a.date}. Website repo: ${WEB}.${check > 1 ? ` This is check ${check}, after a fix.` : ''}`,
    'Check only this package and its findings:',
    packageLine(p, r),
    fixNote || '',
    LEAN,
    'Parts of a package marked "waits on WD#" were left out on purpose (an owner decision is pending); do not count them as not fixed.',
    COPIES
      ? `The package is in its own copy of the website at ${c.path}, on top of the run's earlier work; it is merged into the main checkout only after you. Read there: files under ${c.path}, and exactly what the package changed with: ${WAVES} diff --worktree "${c.path}". Never touch the main checkout, apart from writing your notes.`
      : `It is in the main checkout. See only what this run changed with: bash .claude/skills/ux-web/scripts/ux-web.sh diff -- <file> (from ${WEB}; it leaves out another session's uncommitted work), for the files it changed: ${ids(r.filesChanged)}.`,
    'What its tester proved (a failing test means the acceptance check is not met):',
    ...(proved.length ? proved : ['- nothing reported']),
    ...(failing.length ? ['Failing tests:', ...failing] : []),
    `Its tester rendered the pages it changed into ${COPIES ? c.path : WEB}/artifacts/ux-web/ (INDEX.md there lists them)${COPIES ? `; the renders from before the run are in ${WEB}/artifacts/ux-web/` : ''}${t && t.notes ? `. The tester's notes: ${t.notes}` : ''}. Read only the renders of pages that changed. Do not run npm or Playwright.`,
    'Judge every listed finding as fixed, partly or not_fixed, with evidence. Then look for regressions, only in the files it changed and the pages they touch.',
    `Number regressions R${ctx.round}-${p.id}-1, R${ctx.round}-${p.id}-2 and so on; the organizer gives them final IDs. Another step records memory.`,
    `Write your notes to ${RUN}/${name}, then return the structured result. If writing the file is refused, put the notes in "notesText" instead.`,
  ].filter(Boolean).join('\n')
}

function fixPrompt(p, ctx, state, t, c) {
  const specs = t ? t.filesChanged.filter(f => /\.spec\.ts$/.test(f)) : []
  return [
    `UX web loop run ${a.runId}, round ${ctx.round}. Mode: fix. Work package ${p.id}: ${p.title}. Area ${p.area}, findings ${p.findings.join(', ')}.`,
    'It was implemented, locked with tests and checked by the reviewer, who found it short:',
    ...state.failing.map(f => `- ${f.id}: ${f.result}. ${f.evidence}`),
    ...(state.regressions.length ? ['Regressions it caused:', ...state.regressions.map(g => `- ${g.id}, severity ${g.severity}: ${g.title}. ${g.where}. Fix: ${g.fix}`)] : []),
    ...(state.stray.length ? ['Existing tests it broke:', ...state.stray.map(f => `- ${f.test}: ${f.evidence}`)] : []),
    `Fix exactly these, and keep what already works. Your instructions are still package ${p.id}: ${PKG} ${p.id} --conventions`,
    where(c),
    COPIES ? 'The copy exists already: don\'t run add, which would start it over.' : '',
    LEAN,
    'If a test is wrong rather than the site, say so in your notes and leave the test alone: web-ux-tester owns the acceptance tests.',
    `Then: npm run check; npm run build; one Playwright call with the package's tests${specs.length ? ` (${specs.join(', ')})` : ''} and the existing specs that cover what you changed; and, if a page's look changed, its renders again: UX_RENDERS=1 npx playwright test tests/ux-renders.spec.ts --workers=${workers().renders} --reporter=dot -g "<page> " --grep-invert "perf ".`,
    a.notes ? `From the owner, this session: ${a.notes}` : '',
    `Return the structured result: filesChanged is every file you changed in this fix; worktree is ${COPIES ? c.path : 'empty'}.`,
  ].filter(Boolean).join('\n')
}

function integratePrompt(p, ctx, old, c, conflicts) {
  return [
    `UX web loop run ${a.runId}, round ${ctx.round}. Mode: integrate. Work package ${p.id}: ${p.title}. Area ${p.area}, findings ${p.findings.join(', ')}.`,
    `${p.id} is done, tested and checked in its old copy at ${old.path}, but merging it into the main checkout conflicted with packages merged since it started:`,
    ...conflicts.map(x => `- ${x.path}: ${x.why}`),
    `You carry it over into a fresh copy of your own. Never touch the main checkout at ${WEB}.`,
    `1. ${WAVES} add --repo "${WEB}" --name ${c.name} --fresh`,
    `2. ${WAVES} carry --from "${old.path}" --into "${c.path}"`,
    '   It brings the package\'s changes over with three-way merges and prints JSON. Each file under "conflicts" holds conflict markers (main checkout now / the package\'s seed / the package): resolve each by hand, keeping both packages\' intent. If they truly contradict, keep what the main checkout has now and say so in your notes.',
    `3. Checks, each as ${webrun(c.path, c.name, c.port)} '<command>': npm run check; npm run build; one Playwright call with the package's tests and the specs of the files you resolved.`,
    `4. When they pass, remove the old copy: ${WAVES} drop --worktree "${old.path}"`,
    `Your instructions are package ${p.id}, as before: ${PKG} ${p.id} --conventions`,
    LEAN,
    a.notes ? `From the owner, this session: ${a.notes}` : '',
    `Return the structured result: filesChanged is every file the package changes; worktree is ${c.path}.`,
  ].filter(Boolean).join('\n')
}

function mergePrompt(items) {
  const parts = items.map(x => `--${x.kind === 'shelve' ? 'shelve' : 'worktree'} ${x.id}="${x.wt}"`)
  return [
    'Run exactly this one command, from anywhere, and wait for it:',
    `${WAVES} merge ${parts.join(' ')} --patches "${RUN}" --log "${MERGE_LOG}"`,
    'It prints one JSON object. Return that JSON as the structured result, unchanged. Do nothing else: no other command, no edits.',
  ].join('\n')
}

// The whole check: the type and legal checks, a production build, then the whole suite and the
// renders side by side against that one build, the unit tests, and lab performance on its own.
function fullCheck() {
  return [
    `The check, in order: ${mainRun()} 'npm run check'; then 'npm run legal:check'; then 'SITE_URL=https://taskflow.garbar.tech npm run build'.`,
    `Then the whole suite and the renders side by side, against that build, as exactly this one command: ${sideBySide()}`,
    'It takes longer than one tool call may run (on 2026-10-22 the suite alone was 1392 tests in 10.8 minutes on the PC; it is slower on a small machine): start it with the Bash tool\'s run_in_background, then wait for it to finish before reading its output.',
    `Then ${mainRun()} 'npm run test:unit', and lab performance on its own: ${perf()}`,
    'Then check the acceptance checks that artifacts/ux-web/AUDIT.md measures against its rows.',
  ].join('\n')
}

function finalPrompt(round, recs, files) {
  const findings = [...new Set(recs.flatMap(r => r.findings))]
  const locked = recs.filter(r => r.merged && r.tests && r.tests.files.length).map(r => `- ${r.id}: ${r.tests.files.join(', ')}`)
  return [
    `UX web loop run ${a.runId}. Mode: final check${round > 1 ? `, after redo round ${round}` : ''}. Every package of this run is merged into the main checkout at ${WEB}: run the whole check there, once. Write no new tests.`,
    `Packages merged: ${ids(recs.filter(r => r.merged).map(r => r.id))}.`,
    `Files changed in this run: ${ids(files)}.`,
    'Their own tests, written by their testers:',
    ...(locked.length ? locked : ['- none reported']),
    fullCheck(),
    `Report every failing test against its finding (this run's findings: ${ids(findings)}), or with no finding if it proves none, and class each as the site's or the infrastructure's; fix only your own test infrastructure, as your instructions say. Failures listed in ${WEB}/.claude/ux-web/KNOWN_FAILURES.md don't count.`,
    'Return the structured result.',
  ].join('\n')
}

function replanPrompt(round, failures, regressions, fin) {
  const failedChecks = fin ? fin.checks.filter(c => !c.passed).map(c => c.command + (c.note ? ` (${c.note})` : '')) : []
  return [
    `Mode: replan. UX web loop run ${a.runId}, after round ${round}. Today is ${a.date}. Run folder: ${a.runDir}. Website repo: ${WEB}.`,
    'Every package was implemented, locked by tests and checked on its own, and fixed once where it fell short. Findings still short after that fix are escalated to the owner, not re-planned. What is left for you:',
    'Failing tests in the final check (from web-ux-tester):',
    ...(failures.length ? failures.map(f => `- ${f.test} (${f.owner}${f.finding ? `, ${f.finding}` : ''}): ${f.evidence}`) : ['- none']),
    'Regressions the reviewers found that the package\'s own fix did not clear:',
    ...(regressions.length ? regressions.map(g => `- ${g.id} (from ${g.pkg}), severity ${g.severity}: ${g.title}. ${g.where}. Fix: ${g.fix}`) : ['- none']),
    failedChecks.length ? `Final check: failed. ${failedChecks.join('; ')}` : '',
    LEAN,
    `Read only the verify notes of the packages involved (${RUN}/verify-${tag}r${round}-<package>*.md). In .claude/ux-web/ISSUES.md, edit only the lines you change.`,
    'Plan packages only for these. Give every new package its "files" (paths relative to the website root): packages run side by side, and their files decide how many touch one file at once.',
    `Write the new packages to ${a.runDir}/plan-${tag}r${round + 1}.json (same structure as plan.json), append them to plan.md under "Round ${round + 1}${batch ? ` (${batch})` : ''}", add the regressions to .claude/ux-web/ISSUES.md with final IDs, then return the structured result.`,
    ...notesAppendix(n => n.round === round),
  ].filter(Boolean).join('\n')
}

function closePrompt(recs, finals, files) {
  return [
    `Mode: close. UX web loop run ${a.runId}${batch ? ` (${batch})` : ''}. Today is ${a.date}. Run folder: ${a.runDir}. Website repo: ${WEB}.`,
    'Every package ran on its own, in its own copy of the website: implemented, locked by tests, checked by the reviewer, fixed once and checked again where it fell short, then merged. A package whose own tests still failed after its fix was set aside unmerged, with its patch in the run folder.',
    'Packages:',
    ...recs.map(r => [
      `- ${r.id} (round ${r.round}, ${String(r.planFile).split('/').pop()}): ${r.outcome}; implementer ${r.status}${r.attempts ? `, ${r.attempts} fix(es)` : ''};`,
      `fixed ${ids(r.fixed)};`,
      `not fixed ${ids(r.notFixed.map(x => `${x.id} (${x.result}: ${String(x.evidence).slice(0, 240)})`))};`,
      `unchecked ${ids(r.unchecked)};`,
      `proven by test ${ids(r.tests ? r.tests.proven : [])}; device-only ${ids(r.tests ? r.tests.device : [])};`,
      `regressions open ${ids(r.regressions.map(g => `${g.id} S${g.severity} ${g.title} at ${g.where}`))}${r.replanned && r.replanned.length ? `; regressions re-planned ${ids(r.replanned.map(g => g.id))}` : ''};`,
      `verify notes ${ids(r.verifyReports)}.`,
    ].join(' ')),
    'Final checks:',
    ...(finals.length ? finals.map(f => `- after round ${f.round}: ${f.passed ? 'passed' : 'failed'}${f.failures.length ? `; failing: ${f.failures.map(x => `${x.test} (${x.owner}${x.finding ? `, ${x.finding}` : ''})`).join('; ')}` : ''}`) : ['- none ran: nothing was merged']),
    `Escalated to the owner: ${escalated.length ? escalated.map(e => `${e.id} (${e.reason})`).join('; ') : 'none'}.`,
    `Files changed: ${ids(files)}. Mark those that hold another session's uncommitted work (git -C "${WEB}" status --porcelain): the main session can commit only the run's own lines there.`,
    'A finding counts as verified only if the last check of it said "fixed" and no test for it failed. Note which verified findings are locked by a test. Device checks stay listed for the owner.',
    'Regressions still open get final IDs (the next free WEB- numbers after the highest in ISSUES.md) and their own lines in ISSUES.md, as open.',
    `Work from the summaries above and this run's verify notes (${RUN}/verify-${tag}*.md); don't re-read the plan or the review reports. In .claude/ux-web/ISSUES.md, find each finding's line with grep and edit only those lines.`,
    `Update .claude/ux-web/ISSUES.md, then return the structured result with the full report in "report". Don't write a report file yourself; the main session saves it as ${a.runDir}/${reportName}.`,
    ...notesAppendix(),
  ].join('\n')
}

// ---------------------------------------------------------------- one package

const changedAll = new Set()
const organizerEscalated = []
let escalated = []

// What needs the owner, from the latest package that had each finding: blocked, failed or
// set aside unmerged, or still short after its fix (or failing in the final check).
function escalations(recs) {
  const latest = new Map()
  recs.forEach(r => r.findings.forEach(id => latest.set(id, r)))
  const out = []
  for (const [id, r] of latest) {
    if (r.status === 'blocked') {
      const n = r.notAddressed.find(x => x.id === id)
      out.push({ id, reason: `${r.id} is blocked: ${n ? n.reason : r.notes || 'it needs a decision'}` })
    } else if (!r.merged) {
      out.push({ id, reason: `${r.id} ${r.outcome}` })
    } else {
      const x = r.notFixed.find(y => y.id === id)
      if (x) out.push({ id, reason: `${x.result} after ${r.attempts} fix(es): ${String(x.evidence).slice(0, 300)}` })
    }
  }
  const seen = new Set(out.map(e => e.id))
  return [...out, ...organizerEscalated.filter(e => !seen.has(e.id))]
}

function judge(p, v, t) {
  const testFailed = new Map()
  for (const f of (t ? t.failures : [])) if (f.owner === 'site' && f.finding) testFailed.set(f.finding, f)
  const results = v ? v.results : []
  const failing = []
  for (const x of results) {
    const tf = testFailed.get(x.id)
    if (x.result !== 'fixed') failing.push({ ...x, testFailed: !!tf })
    else if (tf) failing.push({ ...x, result: 'partly', evidence: `${x.evidence} But a test fails: ${tf.test}: ${tf.evidence}`, testFailed: true })
  }
  const seen = new Set(results.map(x => x.id))
  for (const [id, f] of testFailed) if (!seen.has(id)) failing.push({ id, result: 'partly', evidence: `A test fails: ${f.test}: ${f.evidence}`, testFailed: true })
  const stray = (t ? t.failures : []).filter(f => f.owner === 'site' && !f.finding)
  const regressions = v ? v.regressions : []
  return {
    failing,
    fixed: results.filter(x => x.result === 'fixed' && !testFailed.has(x.id)).map(x => x.id),
    unchecked: p.findings.filter(id => !seen.has(id) && !testFailed.has(id)),
    stray,
    regressions,
    needsFix: !!(failing.length || regressions.length || stray.length),
  }
}

function testSummary(t) {
  if (!t) return { passed: null, files: [], proven: [], device: [], failures: [], note: 'The tester did not return a result.' }
  return {
    passed: t.passed,
    files: t.filesChanged,
    proven: t.findings.filter(f => f.coverage === 'tested' && f.result === 'pass').map(f => f.id),
    device: t.findings.filter(f => f.coverage === 'device').map(f => f.id),
    failures: t.failures,
    note: t.notes || '',
  }
}

const union = (...lists) => [...new Set(lists.flat().filter(Boolean))]
const rels = list => (list || []).map(rel)

async function verify(p, ctx, r, t, c, check, fixNote) {
  for (let i = 0; i < 2; i++) {
    const v = await call(ctx.prio, verifyPrompt(p, ctx, r, t, c, check, fixNote), {
      agentType: 'web-ux-reviewer',
      label: `verify ${p.id}${check > 1 ? ` · check ${check}` : ''}${i ? ' (again)' : ''}${ctx.sfx}`,
      phase: 'Packages',
      schema: VERIFIED,
      effort: 'high',
    })
    if (v) {
      const path = `${RUN}/verify-${tag}r${ctx.round}-${p.id}${check > 1 ? `-${check}` : ''}.md`
      if (v.notesText) inlineNotes.push({ round: ctx.round, path, text: v.notesText })
      return { ...v, reportPath: v.notesText ? `${path} (inline)` : v.reportPath }
    }
  }
  return null
}

// Sets a package's copy aside without merging it: its patch goes to the run folder.
async function setAside(id, wt) {
  if (!COPIES || !wt || same(wt, WEB)) return ''
  const s = await enqueue({ kind: 'shelve', id, wt })
  return s && s.patch ? s.patch : ''
}

async function mergePackage(p, ctx, rec, c) {
  let cur = c
  for (let attempt = 1; attempt <= 3; attempt++) {
    const m = await enqueue({ kind: 'merge', id: p.id, wt: cur.path })
    if (!m) {
      if (attempt < 3) continue
      rec.patch = await setAside(p.id, cur.path)
      rec.outcome = 'not merged: the merge step returned nothing'
      return
    }
    if (m.error) {
      rec.patch = await setAside(p.id, cur.path)
      rec.outcome = `not merged: ${m.error}`
      return
    }
    if (!m.conflicts.length) {
      if (m.gone && !m.alreadyMerged && rec.filesChanged.length) {
        rec.outcome = 'lost: its copy was gone before the merge'
        log(`${p.id}: its copy ${cur.path} was gone before the merge, with ${rec.filesChanged.length} changed file(s) reported.`)
        return
      }
      rec.merged = true
      rec.applied = m.applied || []
      rec.applied.forEach(f => changedAll.add(f))
      rec.outcome = m.gone && !m.alreadyMerged ? 'nothing to merge' : attempt > 1 ? 'merged, after carrying it over' : 'merged'
      if (m.cleanup) log(`${p.id}: merged, but its copy wasn't cleaned up: ${m.cleanup}`)
      return
    }
    if (attempt === 3) {
      rec.patch = await setAside(p.id, cur.path)
      rec.outcome = `not merged: it still conflicts (${m.conflicts.map(x => x.path).join(', ')})`
      return
    }
    log(`${p.id} conflicted at merge (${m.conflicts.map(x => x.path).join(', ')}); carrying it over in a fresh copy.`)
    const next = copyOf(copyName(p, ctx.round, `-c${attempt}`), cur.port)
    const g = await call(ctx.prio, integratePrompt(p, ctx, cur, next, m.conflicts), {
      agentType: 'web-ux-implementer',
      label: `integrate ${p.id}${attempt > 1 ? ` (${attempt})` : ''}${ctx.sfx}`,
      phase: 'Packages',
      schema: IMPLEMENTED,
    })
    if (!g || g.status === 'failed' || !g.worktree || same(g.worktree, WEB)) {
      rec.patch = await setAside(p.id, cur.path)
      if (g && g.worktree && !same(g.worktree, WEB)) await setAside(`${p.id}-carry`, next.path)
      rec.outcome = `not merged: carrying it over failed (${why(g)})`
      return
    }
    rec.filesChanged = union(rec.filesChanged, rels(g.filesChanged))
    cur = next
  }
}

function newRecord(p, ctx) {
  return {
    id: p.id,
    title: p.title,
    area: p.area,
    findings: p.findings,
    planFile: ctx.planFile,
    round: ctx.round,
    status: 'failed',
    outcome: 'not started',
    merged: false,
    filesChanged: [],
    applied: [],
    notAddressed: [],
    deviceChecks: [],
    tests: null,
    attempts: 0,
    fixed: [],
    notFixed: [],
    unchecked: [],
    regressions: [],
    verifyReports: [],
    patch: '',
    notes: '',
  }
}

async function work(p, ctx, rec, depNote, port) {
  // 1. Implement, in a fresh copy; once more, in another, if the first attempt fails.
  let r = null
  let c = copyOf(copyName(p, ctx.round), port)
  for (let attempt = 1; attempt <= 2; attempt++) {
    if (attempt > 1) c = copyOf(copyName(p, ctx.round, `-${attempt}`), port)
    const extra = attempt > 1 ? `A first attempt failed: ${why(r)}. Start over in this new copy.` : ''
    r = await call(ctx.prio, implementPrompt(p, ctx, c, depNote, extra), {
      agentType: 'web-ux-implementer',
      label: `implement ${p.id}${attempt > 1 ? ' (again)' : ''}${ctx.sfx}`,
      phase: 'Packages',
      schema: IMPLEMENTED,
    })
    if (r && COPIES && r.worktree && !same(r.worktree, c.path)) log(`${p.id}: the implementer reported ${r.worktree} as its copy, not ${c.path}.`)
    const bad = !r || r.status === 'failed' || (COPIES && (!r.worktree || same(r.worktree, WEB)))
    if (!bad) break
    if (r && COPIES && r.worktree && same(r.worktree, WEB)) log(`${p.id}: the implementer worked in the main checkout; check it for stray edits.`)
    if (COPIES) await setAside(`${p.id}-attempt${attempt}`, c.path)
    if (attempt === 2) {
      rec.status = r ? r.status : 'failed'
      rec.outcome = `failed: ${why(r)}`
      rec.notes = r && r.notes ? r.notes : ''
      return
    }
  }
  rec.status = r.status
  rec.filesChanged = rels(r.filesChanged)
  rec.notAddressed = r.notAddressed
  rec.deviceChecks = r.deviceChecks || []
  rec.notes = r.notes || ''
  if (r.status === 'blocked') {
    rec.patch = await setAside(p.id, c.path)
    rec.outcome = 'blocked: it needs a decision'
    return
  }

  // 2. Lock it with tests, and render its pages for the reviewer.
  let t = await call(ctx.prio, testPrompt(p, ctx, r, c), {
    agentType: 'web-ux-tester',
    label: `test ${p.id}${ctx.sfx}`,
    phase: 'Packages',
    schema: TESTED,
  })
  if (t) t = { ...t, filesChanged: rels(t.filesChanged) }
  rec.tests = testSummary(t)
  rec.filesChanged = union(rec.filesChanged, t ? t.filesChanged : [])
  let testsOk = !(t && t.failures.some(f => f.owner === 'site'))

  // 3. Check it; fix what falls short, and check again.
  let v = await verify(p, ctx, r, t, c, 1, '')
  if (v) rec.verifyReports.push(v.reportPath)
  let state = judge(p, v, t)
  for (let k = 1; k <= FIXES && state.needsFix; k++) {
    const f = await call(ctx.prio, fixPrompt(p, ctx, state, t, c), {
      agentType: 'web-ux-implementer',
      label: `fix ${p.id}${k > 1 ? ` (${k})` : ''}${ctx.sfx}`,
      phase: 'Packages',
      schema: IMPLEMENTED,
    })
    if (!f) break
    rec.attempts = k
    rec.filesChanged = union(rec.filesChanged, rels(f.filesChanged))
    rec.deviceChecks = union(rec.deviceChecks, f.deviceChecks || [])
    const ran = f.checks.filter(isTest)
    if (ran.length) testsOk = ran.every(x => x.passed)
    if (testsOk && t) t = { ...t, failures: t.failures.filter(x => x.owner !== 'site') }
    const fixNote = [
      `A fix ran after check ${k}: ${f.status}.${f.notes ? ` ${f.notes}` : ''}`,
      `Its test run: ${ran.map(x => `${x.command}: ${x.passed ? 'passed' : 'failed'}${x.note ? ` (${x.note})` : ''}`).join('; ') || 'none reported'}.`,
      state.regressions.length ? `Regressions from check ${k}: ${state.regressions.map(g => `${g.id} (${g.title})`).join('; ')}. Say which still hold, keeping their IDs; number new ones after them.` : '',
    ].filter(Boolean).join(' ')
    const v2 = await verify(p, ctx, { ...r, status: f.status, filesChanged: rec.filesChanged }, t, c, k + 1, fixNote)
    if (v2) {
      v = v2
      rec.verifyReports.push(v2.reportPath)
    }
    state = judge(p, v, t)
  }
  rec.fixed = state.fixed
  rec.notFixed = state.failing.map(({ id, result, evidence }) => ({ id, result, evidence }))
  rec.unchecked = state.unchecked
  rec.regressions = state.regressions
  if (state.stray.length) rec.notes = [rec.notes, `Existing tests still failing: ${state.stray.map(f => f.test).join('; ')}.`].filter(Boolean).join(' ')

  // 4. Merge it, unless its own tests still fail: then it waits, unmerged, for the owner.
  if (!COPIES) {
    rec.merged = true
    rec.outcome = 'done in the main checkout'
    rec.applied = rec.filesChanged
    rec.filesChanged.forEach(f => changedAll.add(f))
    return
  }
  if (!testsOk || state.stray.length) {
    rec.patch = await setAside(p.id, c.path)
    rec.outcome = `not merged: its own tests still fail after ${rec.attempts} fix(es)${rec.patch ? `; patch ${rec.patch}` : ''}`
    return
  }
  await mergePackage(p, ctx, rec, c)
}

async function runPackage(p, ctx, before) {
  const rec = newRecord(p, ctx)
  const notMerged = []
  for (const dep of before) {
    const d = await dep
    if (d && !d.merged) notMerged.push(`${d.id} (${d.outcome})`)
  }
  const deps = (p.dependsOn || []).filter(Boolean)
  const depNote = deps.length
    ? `It builds on ${deps.join(', ')}, from earlier in this run.${notMerged.length ? ` These were not merged, so check what is really there before building on them: ${notMerged.join('; ')}.` : ' What of it this run merged is in your copy.'}`
    : ''
  const { port, leave } = await admit(p, ctx.prio)
  try {
    await work(p, ctx, rec, depNote, port)
  } catch (e) {
    rec.outcome = `failed: ${(e && e.message) || e}`
  } finally {
    leave()
  }
  log(`${p.id}: ${rec.outcome}; ${rec.fixed.length} of ${p.findings.length} finding(s) fixed${rec.tests ? `, ${rec.tests.proven.length} locked by a test` : ''}${rec.attempts ? `, after ${rec.attempts} fix(es)` : ''}${rec.regressions.length ? `, ${rec.regressions.length} regression(s) open` : ''}.`)
  return rec
}

// Runs a round's packages, each as soon as its dependencies are done and it is admitted.
async function runAll(list, round, planFile) {
  mergeRound = round
  const sfx = round > 1 ? ` · round ${round}` : ''
  const byId = new Map(list.map(p => [p.id, p]))
  // A dependency cycle would wait forever: drop the edges that close one.
  const state = new Map()
  const keep = new Map(list.map(p => [p.id, []]))
  const visit = id => {
    state.set(id, 1)
    for (const d of byId.get(id).dependsOn || []) {
      if (!byId.has(d)) continue
      if (state.get(d) === 1) {
        log(`${id} and ${d} depend on each other; ${id} won't wait for ${d}.`)
        continue
      }
      keep.get(id).push(d)
      if (!state.has(d)) visit(d)
    }
    state.set(id, 2)
  }
  list.forEach(p => { if (!state.has(p.id)) visit(p.id) })
  const done = new Map()
  const resolvers = new Map()
  list.forEach(p => done.set(p.id, new Promise(res => resolvers.set(p.id, res))))
  const all = list.map((p, i) => {
    const ctx = { round, planFile, prio: round * 1000 + i + 1, sfx }
    return runPackage(p, ctx, keep.get(p.id).map(d => done.get(d))).then(rec => {
      resolvers.get(p.id)(rec)
      return rec
    })
  })
  return Promise.all(all)
}

// ---------------------------------------------------------------- finish

async function finalCheck(round, recs) {
  const files = [...changedAll].sort()
  const fin = await call(0, finalPrompt(round, recs, files), {
    agentType: 'web-ux-tester',
    label: `final check${round > 1 ? ` · round ${round}` : ''}`,
    phase: 'Check',
    schema: TESTED,
  })
  const out = fin || { passed: false, checks: [], findings: [], failures: [], filesChanged: [], notes: 'The final check did not return a result.' }
  return { ...out, filesChanged: rels(out.filesChanged) }
}

// A test that fails in the final check overrides "fixed" for its finding.
function applyFinal(recs, fin) {
  const stray = []
  for (const f of fin.failures.filter(x => x.owner === 'site')) {
    const owner = f.finding ? [...recs].reverse().find(r => r.merged && r.findings.includes(f.finding)) : null
    if (!owner) {
      stray.push(f)
      continue
    }
    owner.fixed = owner.fixed.filter(x => x !== f.finding)
    if (!owner.notFixed.some(x => x.id === f.finding)) {
      owner.notFixed.push({ id: f.finding, result: 'partly', evidence: `A test fails in the final check: ${f.test}: ${f.evidence}` })
    }
  }
  return stray
}

async function finish(recs) {
  let round = Math.max(1, ...recs.map(r => r.round))
  const finals = []
  let fin = null
  if (recs.some(r => r.merged)) {
    fin = await finalCheck(round, recs)
    fin.filesChanged.forEach(f => changedAll.add(f))
    applyFinal(recs, fin)
    finals.push({ round, passed: fin.passed, failures: fin.failures })
    log(`Final check after round ${round}: ${fin.passed ? 'passed' : 'failed'}; ${fin.failures.length} failure(s).`)
  }
  for (let extra = 0; extra < EXTRA_ROUNDS; extra++) {
    const failures = fin ? fin.failures.filter(f => f.owner === 'site') : []
    const regressions = recs.flatMap(r => r.regressions.map(g => ({ ...g, pkg: r.id })))
    if (!failures.length && !regressions.length) break
    const next = await call(0, replanPrompt(round, failures, regressions, fin), {
      agentType: 'web-ux-organizer',
      label: `re-plan after round ${round}`,
      phase: 'Re-plan',
      schema: REPLANNED,
      effort: 'high',
    })
    if (!next) break
    organizerEscalated.push(...next.escalated)
    recs.forEach(r => {
      r.replanned = [...(r.replanned || []), ...r.regressions]
      r.regressions = []
    })
    if (!next.packages.length) break
    round++
    log(`Round ${round}: ${next.packages.length} package(s) re-planned.`)
    const more = await runAll(next.packages, round, `${a.runDir}/plan-${tag}r${round}.json`)
    recs.push(...more)
    if (more.some(r => r.merged)) {
      fin = await finalCheck(round, recs)
      fin.filesChanged.forEach(f => changedAll.add(f))
      applyFinal(recs, fin)
      finals.push({ round, passed: fin.passed, failures: fin.failures })
      log(`Final check after round ${round}: ${fin.passed ? 'passed' : 'failed'}; ${fin.failures.length} failure(s).`)
    }
  }
  const files = [...changedAll].sort()
  escalated = escalations(recs)

  const close = await call(0, closePrompt(recs, finals, files), {
    agentType: 'web-ux-organizer',
    label: 'record ledger and report',
    phase: 'Record',
    schema: CLOSED,
    effort: 'medium',
  })
  if (recordMemory) {
    await call(0, [
      `Mode: memory. UX web loop run ${a.runId} just finished.`,
      `Read the verify-*.md files in ${RUN} (search them; read only what you need) and the run summary below, and update your memory with what is worth keeping: patterns the site now follows, changes to the site map and the claims map, recurring problem types.`,
      `Run summary: ${close ? close.verdict : 'not available'}`,
      'Issue statuses and owner decisions already live in .claude/ux-web/; do not copy them.',
      ...notesAppendix(),
    ].join('\n'), { agentType: 'web-ux-reviewer', label: 'record reviewer memory', phase: 'Record', effort: 'medium' })
  }
  return {
    runId: a.runId,
    runDir: a.runDir,
    reportName,
    rounds: round,
    testsPassed: fin ? fin.passed : true,
    filesChanged: files,
    webFiles: files.filter(f => !isLoopFile(f)),
    loopFiles: files.filter(isLoopFile),
    escalated,
    packages: recs.map(r => ({ id: r.id, round: r.round, outcome: r.outcome, fixed: r.fixed, notFixed: r.notFixed.map(x => x.id), patch: r.patch })),
    close,
    inlineNotes: inlineNotes.map(n => ({ path: n.path, text: n.text })),
  }
}

function setMachine(cpus) {
  CPUS = cpus || CPUS
  AGENTS = int(a.agents, Math.max(1, Math.min(16, CPUS - 2)))
  FLIGHT = COPIES ? int(a.maxParallel, AGENTS + 2) : 1
  ports = Array.from({ length: FLIGHT }, (_, i) => PORT_BASE + i)
}

// ---------------------------------------------------------------- run

if (PART === 'finish') {
  const lanes = Array.isArray(a.laneResults) ? a.laneResults.filter(Boolean) : []
  if (!lanes.length) throw new Error('part "finish" needs laneResults: the result of every lane run.')
  const recs = lanes.flatMap(l => l.records || [])
  lanes.forEach(l => (l.filesChanged || []).forEach(f => changedAll.add(f)))
  lanes.forEach(l => (l.inlineNotes || []).forEach(n => inlineNotes.push(n)))
  if (!a.runner) RUNNER = (lanes.find(l => l.runner) || {}).runner || RUNNER
  COPY_DIR = (lanes.find(l => l.copiesDir) || {}).copiesDir || COPY_DIR
  setMachine(Math.max(...lanes.map(l => l.cpus || 0), 3))
  log(`Finishing ${lanes.length} lane(s): ${recs.length} package(s), ${recs.filter(r => r.merged).length} merged.`)
  return await finish(recs)
}

phase('Load')
const loaded = await agent([
  'Run exactly this one command and wait for it:',
  `${PY} "${WEB}/.claude/skills/ux-web/scripts/pkg.py" "${RUN}" --headers --plan "${PLAN_ABS}" --repo "${WEB}"`,
  'It prints one JSON object. Return it as the structured result, unchanged: every package, every field, in order. Do nothing else.',
].join('\n'), {
  label: 'load plan',
  phase: 'Load',
  schema: LOADED,
  model: 'haiku',
})
if (!loaded) throw new Error(`The load step returned nothing. Check that ${PLAN_ABS} exists.`)
if (COPIES && !same(loaded.toplevel, WEB)) {
  throw new Error(`repoRoot is ${WEB}, but git says the website's checkout is ${loaded.toplevel || 'not a git checkout'}. Pass repoRoot from git rev-parse --show-toplevel in the website repo.`)
}
if (!a.runner) RUNNER = loaded.platform === 'nt' ? 'wsl' : 'direct'
COPY_DIR = norm(loaded.copiesDir)
setMachine(loaded.cpus || 4)
const packages = loaded.packages.filter(p => !skip.has(p.id) && (!only || only.has(p.id)))
if (packages.length < loaded.packages.length) log(`Running ${packages.length} of ${loaded.packages.length} packages; the rest were skipped or limited.`)
if (!packages.length) {
  return { runId: a.runId, runDir: a.runDir, reportName, part: PART, lane: LANE, cpus: loaded.cpus, runner: RUNNER, copiesDir: COPY_DIR, records: [], rounds: 0, testsPassed: true, filesChanged: [], webFiles: [], loopFiles: [], escalated: [], close: null, inlineNotes: [] }
}
log(`${packages.length} package(s)${LANE ? ` in lane ${LANE}` : ''}: up to ${AGENTS} agents at once (${loaded.cpus} CPUs), ${FLIGHT} packages in flight on ports ${COPIES ? `${PORT_BASE}–${PORT_BASE + FLIGHT - 1}` : MAIN_PORT}, ${FILE_LIMIT} per file, ${SLOTS} builds at once; commands run ${RUNNER === 'wsl' ? 'in WSL' : 'directly'}.`)
if (AGENTS <= 4 && packages.length > 2 * AGENTS && PART === 'all') {
  log(`This machine allows only ${AGENTS} agents per workflow. A plan this size runs faster in lanes, several runs at once (SKILL.md, "Lanes").`)
}

phase('Packages')
const records = await runAll(packages, 1, PLAN)

if (PART === 'packages') {
  return {
    runId: a.runId,
    runDir: a.runDir,
    part: 'packages',
    lane: LANE,
    cpus: loaded.cpus,
    runner: RUNNER,
    copiesDir: COPY_DIR,
    records,
    filesChanged: [...changedAll].sort(),
    escalated: escalations(records),
    inlineNotes: inlineNotes.map(n => ({ path: n.path, text: n.text })),
  }
}
return await finish(records)
