"""The package check for the UX web loop: run the checks, specs and renders a change touches, and only those.

Every step of a package (its implementer, its tester, its fix, its integrator) runs this instead
of choosing specs by hand, so the run's final check is the only place the whole suite runs, once
per run. From anywhere in a package's copy of the website:

  python -I -X utf8 <website>/.claude/skills/ux-web/scripts/check.py --name <copy> --port <port> [--renders auto]

What counts as changed: the first time, everything the package changed since its seed (waves.py
add); after that, what changed since the last check, plus what failed in it. Its state is kept in
the copy's git folder, so it never reaches the main checkout. --all counts everything since the
seed again.

In the main checkout, once every package is merged (the run's repair and its re-check):

  python -I -X utf8 .claude/skills/ux-web/scripts/check.py --main --files <path> ... [--also <spec> ...]

What it runs, in the copy's build mirror (webrun.py: in WSL on Windows, directly elsewhere),
holding one of the web gate's slots from start to end (waves.py gate_slot):
  1. npm run check, when a TypeScript file or the config changed. An error stops the check.
  2. npm run legal:check, when the legal texts or the legal pages changed.
  3. The production build (SITE_URL=https://taskflow.garbar.tech npm run build), when the site
     changed: Playwright serves the last build. Also when the mirror has none yet.
  4. npm run test:unit, when src/lib/, edge/ or a *.unit.ts file changed.
  5. Playwright, both projects, on the specs that cover the change: specs that failed last time;
     changed specs; the specs of the parts of the site that changed (the table below); for the
     site's copy, the specs of the sections whose wording changed; specs that import a changed
     module or test helper. At most --max spec files (8); the rest are listed, left to the final
     check. --also <specs> adds specs whatever the choice (the specs that failed before a repair).
  6. The renders of the pages the change shows (--renders auto), or of the pages given
     (--renders "home privacy"); none unless asked: the tester renders, and a fix renders again.
     A change to every page's frame (the header, the footer, the global styles) renders the
     home and one legal page, privacy; the final check renders every page. Lab performance
     never runs here: the final check measures it.

--specs <files> runs exactly those spec files instead of choosing. --list prints what would run
and why, and runs nothing. The summary gives each step's result and time, and every failing test
with the first lines of its error; the logs are in artifacts/ux-check/. --json prints it as JSON.
The exit status is 0 when everything that ran passed; renders that fail are reported, but don't
fail the check (renders are evidence, not a gate).
"""
import argparse
import json
import os
import posixpath
import re
import subprocess
import sys
import time
from pathlib import Path

sys.dont_write_bytecode = True  # no __pycache__ in the repo's scripts folder
sys.path.insert(0, str(Path(__file__).resolve().parent))
import waves  # noqa: E402  (the seed, the changes since it, and the gate)

STATE = "ux-check.json"
LOGS = "artifacts/ux-check"
RENDER_SPEC = "tests/ux-renders.spec.ts"
RENDER_HELPERS = re.compile(r"^tests/support/ux-(audit|collect|perf|voice)\.ts$")
PAGES = ["home", "privacy", "terms", "legal", "delete-account", "not-found"]
ALL = "all"
FRAME = ["home", "privacy"]  # what every page shares, seen on the home and one legal page
SITE_URL = "https://taskflow.garbar.tech"
SITE_COPY = re.compile(r"^src/content/site/(en|es|ca)\.ts$")
# Which specs and which pages each part of the site has. Keep in step with the site: a file no
# rule names gets only the specs that import it, and the final check.
RULES = [
    (r"^src/components/(VoiceDemo|VoiceExample)\.tsx$|^src/lib/voice/|^src/app/api/voice/|^src/styles/voice\.css$",
     ["voice.spec.ts", "ux-web-voice.spec.ts", "ux-web-completion.spec.ts"], ["home"]),
    (r"^src/components/(HomePage|Phone)\.tsx$|^src/app/(\[language\]/)?page\.tsx$",
     ["ux-web-home.spec.ts", "ux-web-features.spec.ts", "website.spec.ts"], ["home"]),
    (r"^src/components/LegalPage\.tsx$|^src/content/legal/|^src/app/(\[language\]/\[document\]|privacy|terms|legal|delete-account)/|^src/styles/legal\.css$",
     ["legal.spec.ts", "ux-web-legal.spec.ts"], ["privacy", "terms", "legal", "delete-account"]),
    (r"^src/components/(Header|Footer|LanguageSwitch|SkipLink|ThemeProvider|Icon|useSiteLanguage)\.tsx?$|^src/app/layout\.tsx$|^src/styles/global\.css$|^src/app/fonts/|^src/content/site/index\.ts$",
     ["ux-web-global.spec.ts", "ux-web-frame.spec.ts", "website.spec.ts"], FRAME),
    (r"^src/components/NotFoundPage\.tsx$|^src/app/not-found\.tsx$",
     ["ux-web-global.spec.ts", "ux-web-frame.spec.ts"], ["not-found"]),
    (r"^src/app/(robots|sitemap)\.ts$|^src/app/(\[language\]/)?opengraph-image\.tsx$|^src/og/|^src/proxy\.ts$|^src/app/health/|^next\.config\.",
     ["website.spec.ts", "deployment.spec.ts"], []),
    (r"^public/", ["ux-web-home.spec.ts", "website.spec.ts"], ["home"]),
]
# The sections of the site's copy (src/content/site/<language>.ts) and who shows them.
SECTIONS = {
    "meta": (["website.spec.ts", "ux-web-global.spec.ts"], ["home"]),
    "notFound": (["ux-web-global.spec.ts", "ux-web-frame.spec.ts"], ["not-found"]),
    "frame": (["ux-web-global.spec.ts", "ux-web-frame.spec.ts"], FRAME),
    "hero": (["ux-web-home.spec.ts"], ["home"]),
    "features": (["ux-web-features.spec.ts", "ux-web-home.spec.ts"], ["home"]),
    "faq": (["ux-web-features.spec.ts"], ["home"]),
    "closing": (["ux-web-features.spec.ts"], ["home"]),
    "voice": (["ux-web-voice.spec.ts", "voice.spec.ts", "ux-web-completion.spec.ts"], ["home"]),
}
OTHER_SECTION = (["ux-web-home.spec.ts", "ux-web-features.spec.ts"], ["home"])
IMPORT = re.compile(r"""(?:^|\n)\s*(?:import|export)\b[^;]*?\bfrom\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)""")
TS = re.compile(r"\.(ts|tsx|js|jsx|mjs|cjs|json)$")
# What the production build is made of: not the tests, the docs, the deployment scripts or the
# edge worker.
SITE = re.compile(r"^(src|public)/|^(next\.config|postcss\.config|tailwind\.config)\.|^(package|package-lock|tsconfig)\.json$")
MARK = re.compile(r"^UXCHECK (\w+) (skipped|(\d+) (\d+))\s*$")


def say(message):
    print(message, flush=True)


# ---------------------------------------------------------------- what changed

def sha(data):
    import hashlib
    return hashlib.sha1(data).hexdigest()[:16]


def prints(root, paths):
    out = {}
    for rel in paths:
        p = root / rel
        out[rel] = sha(p.read_bytes()) if p.is_file() else "gone"
    return out


def sections(text):
    """{top-level key: its text} of the site's copy for one language."""
    out, key, buf = {}, None, []
    for line in (text or "").splitlines():
        m = re.match(r"^  ([A-Za-z_]\w*)\s*:", line)
        if m:
            if key:
                out[key] = "\n".join(buf)
            key, buf = m.group(1), [line]
        elif key:
            buf.append(line)
    if key:
        out[key] = "\n".join(buf)
    return out


def changed_sections(root, base_rev, files, before):
    """The copy's sections whose text changed in these files, since `before` ({file: text}) or,
    for a file it doesn't hold, since base_rev. Returns (sections, {file: text now})."""
    names, now = set(), {}
    for rel in files:
        p = root / rel
        cur = p.read_text(encoding="utf-8", errors="replace") if p.is_file() else ""
        now[rel] = cur
        old = before.get(rel)
        if old is None:
            shown = subprocess.run(["git", "-C", str(root), "show", f"{base_rev}:{rel}"], capture_output=True)
            old = shown.stdout.decode("utf-8", "replace") if shown.returncode == 0 else ""
        a, b = sections(old), sections(cur)
        names |= {k for k in set(a) | set(b) if a.get(k) != b.get(k)}
    return names, now


class Changes:
    """What a check compares against: the copy since its seed and since each step's last run,
    or the given files in the main checkout."""

    def __init__(self, args):
        self.main = args.main
        if args.main:
            self.root = waves.main_root(Path(__file__).resolve().parent)
            self.base = "HEAD"
            self.paths = sorted({norm_rel(f, self.root) for f in args.files or []})
            self.state_file = None
            self.state = {"steps": {}}
            return
        start = Path(args.copy) if args.copy else Path.cwd()
        self.root = Path(waves.git(start, "rev-parse", "--show-toplevel"))
        main = waves.main_root(self.root)
        if self.root.resolve() == main.resolve():
            raise SystemExit("This is the main checkout. In a package's copy, run check.py from there (or pass --copy); "
                             "in the main checkout, pass --main and the changed files with --files.")
        try:
            seed, paths = waves.changes(self.root)
        except waves.NotSeeded as e:
            raise SystemExit(f"{e} Make the copy with waves.py add first.")
        self.base = seed
        self.paths = sorted(p for p in paths if not p.startswith(waves.NOT_MERGED))
        if args.files:
            self.paths = sorted(set(self.paths) | {norm_rel(f, self.root) for f in args.files})
        gitdir = Path(waves.git(self.root, "rev-parse", "--path-format=absolute", "--git-dir"))
        self.state_file = gitdir / STATE
        self.state = {"steps": {}}
        if self.state_file.is_file():
            try:
                self.state = json.loads(self.state_file.read_text(encoding="utf-8"))
            except ValueError:
                pass
        if self.state.get("seed") != seed:
            self.state = {"seed": seed, "steps": {}}
        if args.all:
            self.state["steps"] = {}
        self.now = prints(self.root, self.paths)

    def since(self, step):
        """(changed paths, changed copy sections, the copy's text now) since the step's last run."""
        if self.main:
            copy = [p for p in self.paths if SITE_COPY.match(p)]
            names, now = changed_sections(self.root, self.base, copy, {})
            return list(self.paths), names, now
        last = self.state["steps"].get(step) or {}
        before = last.get("prints")
        if before is None:
            paths = list(self.paths)
        else:
            paths = sorted(p for p in set(self.now) | set(before) if self.now.get(p, "seed") != before.get(p, "seed"))
        copy = [p for p in paths if SITE_COPY.match(p)]
        names, now = changed_sections(self.root, self.base, copy, last.get("copy") or {})
        return paths, names, now

    def ever_ran(self, step):
        return "prints" in (self.state["steps"].get(step) or {})

    def failed(self, step):
        return list((self.state["steps"].get(step) or {}).get("failed") or [])

    def ran(self, step, failed, copy_now=None, advance=True, covered=()):
        if self.main:
            return
        last = self.state["steps"].get(step) or {}
        if not advance:
            failed = (set(last.get("failed") or []) - set(covered)) | set(failed)
        entry = {"failed": sorted(set(failed)), "at": time.strftime("%Y-%m-%dT%H:%M:%S"),
                 "copy": {**(last.get("copy") or {}), **(copy_now or {})}}
        if advance:
            entry["prints"] = self.now
        elif "prints" in last:
            entry["prints"] = last["prints"]
        self.state["steps"][step] = entry

    def save(self):
        if self.state_file:
            self.state_file.write_text(json.dumps(self.state, ensure_ascii=False), encoding="utf-8")


def norm_rel(path, root):
    p = str(path).replace("\\", "/")
    r = str(root).replace("\\", "/").rstrip("/")
    if p.lower().startswith(r.lower() + "/"):
        p = p[len(r) + 1:]
    p = re.sub(r"^\./", "", p)
    p = re.sub(r"^TaskFlowWeb/", "", p)
    m = re.search(r"\.taskflow-tools/wt/[^/]+/(.+)$", p)
    return m.group(1) if m else p


# ---------------------------------------------------------------- choosing

def spec_files(root):
    tests = root / "tests"
    return sorted(p.relative_to(root).as_posix() for p in tests.glob("*.spec.ts")) if tests.is_dir() else []


def module_graph(root):
    """{test file: the repo files it imports, directly or through tests/support}."""
    found = {}

    def resolve(src, spec):
        if not spec.startswith("."):
            return None
        base = posixpath.normpath(posixpath.join(posixpath.dirname(src), spec))
        for cand in (base, base + ".ts", base + ".tsx", base + ".js", base + ".json", base + "/index.ts", base + "/index.tsx"):
            if (root / cand).is_file():
                return cand
        return base

    def deps(rel, seen):
        if rel in seen:
            return set()
        seen.add(rel)
        try:
            text = (root / rel).read_text(encoding="utf-8", errors="replace")
        except OSError:
            return set()
        out = set()
        for a, b in IMPORT.findall(text):
            target = resolve(rel, a or b)
            if not target:
                continue
            out.add(target)
            if target.startswith("tests/"):
                out |= deps(target, seen)
        return out

    for spec in spec_files(root):
        found[spec] = deps(spec, set())
    return found


def choose(root, paths, names, failed, limit, also=()):
    """The specs that cover these changes, most specific first, the pages to render, and why."""
    score, pages = {}, set()
    specs = set(spec_files(root))

    def take(spec, rank, why):
        spec = spec if spec.startswith("tests/") else f"tests/{spec}"
        if spec not in specs or spec == RENDER_SPEC:
            return
        if spec in score:
            r, hits, reason = score[spec]
            score[spec] = (min(r, rank), hits + 1, reason if r <= rank else why)
        else:
            score[spec] = (rank, 1, why)

    for s in list(failed) + list(also):
        take(s, 0, "failed before")
    unmapped = []
    for rel in paths:
        if rel in specs:
            take(rel, 0, "changed")
            continue
        if rel == RENDER_SPEC or RENDER_HELPERS.match(rel):
            pages.add(ALL)
            continue
        if SITE_COPY.match(rel):
            continue  # by section, below
        hit = False
        for pattern, rule_specs, rule_pages in RULES:
            if re.search(pattern, rel):
                hit = True
                for s in rule_specs:
                    take(s, 1, f"covers {rel}")
                pages.update(rule_pages)
        if not hit and rel.startswith(("src/", "public/")) and not rel.startswith("src/content/site/types"):
            unmapped.append(rel)
    for name in sorted(names):
        rule_specs, rule_pages = SECTIONS.get(name, OTHER_SECTION)
        for s in rule_specs:
            take(s, 1, f"covers the copy's {name} section")
        pages.update(rule_pages)
    graph = module_graph(root)
    by_import = [p for p in paths if not SITE_COPY.match(p) and not p.startswith("src/content/legal/")]
    for spec, deps in graph.items():
        hit = sorted(set(by_import) & deps)
        if hit:
            take(spec, 2, f"imports {hit[0]}")
    ordered = sorted(score, key=lambda s: (score[s][0], -score[s][1], s))
    chosen = [(s, score[s][2]) for s in ordered[:limit + len(also)]]
    rest = [(s, score[s][2]) for s in ordered[limit + len(also):]]
    return chosen, rest, sorted(pages), unmapped


# ---------------------------------------------------------------- running

def runner(root, name, port, how):
    webrun = Path(__file__).resolve().parent / "webrun.py"
    if how == "wsl":
        return ["wsl", "-e", "python3", waves.wsl_path(webrun), "--src", waves.wsl_path(root), "--name", name, "--port", str(port)]
    return [sys.executable or "python3", str(webrun), "--src", str(root), "--name", name, "--port", str(port)]


def script(plan, spec_workers, render_workers):
    """The bash script for the mirror: each step to its own log, a marker with its exit status and
    seconds, and a stop after a failed type check, legal check or build."""
    lines = [f"mkdir -p {LOGS} && rm -f {LOGS}/*.json", "ok=1"]
    for step, extra in plan:
        if step == "typecheck":
            cmd = "npm run check"
        elif step == "legal":
            cmd = "npm run legal:check"
        elif step == "build":
            # Next.js sometimes stops a build with its SecurityFatalError notice (this version has a
            # published advisory) and goes on when the same build runs again: run it again once.
            log = f"{LOGS}/build.log"
            cmd = (f"SITE_URL={SITE_URL} npm run build > {log} 2>&1; b=$?; "
                   f"if [ $b != 0 ] && grep -q SecurityFatalError {log}; then echo 'UXCHECK-NOTE build security-notice'; "
                   f"cp {log} {LOGS}/build-notice.log; SITE_URL={SITE_URL} npm run build > {log} 2>&1; b=$?; fi; (exit $b)")
            if extra.get("if_missing"):
                cmd = f"if [ -f .next/BUILD_ID ]; then echo 'kept the last build' > {log}; else {cmd}; fi"
        elif step == "unit":
            cmd = "npm run test:unit"
        elif step == "specs":
            cmd = (f"PLAYWRIGHT_JSON_OUTPUT_NAME={LOGS}/specs.json PLAYWRIGHT_JSON_OUTPUT_FILE={LOGS}/specs.json "
                   "npx playwright test " + " ".join(s for s, _ in extra["chosen"])
                   + (f" --workers={spec_workers}" if spec_workers else "") + " --reporter=dot,json")
        elif step == "renders":
            grep = "" if ALL in extra["pages"] else " -g " + json.dumps("|".join(f"{p} " for p in extra["pages"]))
            cmd = (f"PLAYWRIGHT_JSON_OUTPUT_NAME={LOGS}/renders.json PLAYWRIGHT_JSON_OUTPUT_FILE={LOGS}/renders.json "
                   f"UX_RENDERS=1 npx playwright test {RENDER_SPEC} --workers={render_workers} --reporter=dot,json "
                   f"--output=test-results-renders{grep} --grep-invert \"perf \"")
        else:
            continue
        stops = step in ("typecheck", "legal", "build")
        to_log = "" if step == "build" else f" > {LOGS}/{step}.log 2>&1"
        lines.append(
            f"if [ $ok = 1 ]; then t=$SECONDS; {{ {cmd}; }}{to_log}; c=$?; echo \"UXCHECK {step} $c $((SECONDS-t))\"; "
            + ("[ $c = 0 ] || ok=0; " if stops else "")
            + f"else echo \"UXCHECK {step} skipped\"; fi"
        )
    return "\n".join(lines) + "\n"


def one_line(text):
    """The script as one line with nothing to quote, whatever passes it on (wsl.exe, Git Bash):
    it runs in a child bash, in the mirror, with the mirror's Node."""
    import base64
    return f"printf %s {base64.b64encode(text.encode()).decode()} | base64 -d | bash"


def failures_from(report_path, text):
    """The failing tests in a Playwright JSON report, else from the dot reporter's text."""
    out = []
    try:
        data = json.loads(Path(report_path).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        data = None
    if data:
        def walk(suite, trail):
            title = suite.get("title") or ""
            here = trail + ([title] if title and not title.endswith(".ts") else [])
            for spec in suite.get("specs", []):
                for t in spec.get("tests", []):
                    if t.get("status") != "unexpected":
                        continue
                    err = ""
                    for r in t.get("results", []):
                        e = r.get("error") or {}
                        err = e.get("message") or e.get("value") or ""
                        if err:
                            break
                    err = re.sub(r"\x1b\[[0-9;]*m", "", err)
                    out.append({"test": f"[{t.get('projectName', '')}] {spec.get('file', suite.get('file', ''))}:{spec.get('line', '')} › {' › '.join(here + [spec.get('title', '')])}",
                                "file": "tests/" + posixpath.basename(spec.get("file", suite.get("file", ""))),
                                "error": "\n".join(l for l in err.splitlines() if l.strip())[:900]})
            for child in suite.get("suites", []):
                walk(child, here)
        for s in data.get("suites", []):
            walk(s, [])
        stats = data.get("stats") or {}
        return out, (stats.get("expected", 0), stats.get("unexpected", 0), stats.get("skipped", 0), stats.get("flaky", 0))
    for m in re.finditer(r"^\s+\d+\) \[(\w+)\] › (tests/\S+?\.ts):(\d+):\d+ › (.*?)\s*─*\s*$", text or "", re.M):
        out.append({"test": f"[{m.group(1)}] {m.group(2)}:{m.group(3)} › {m.group(4)}", "file": m.group(2), "error": ""})
    passed = re.search(r"^\s*(\d+) passed", text or "", re.M)
    failed = re.search(r"^\s*(\d+) failed", text or "", re.M)
    return out, (int(passed.group(1)) if passed else 0, int(failed.group(1)) if failed else len(out), 0, 0)


def tail(path, n=12):
    try:
        lines = Path(path).read_text(encoding="utf-8", errors="replace").strip().splitlines()
    except OSError:
        return ""
    return "\n".join(re.sub(r"\x1b\[[0-9;]*m", "", l) for l in lines[-n:])


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--main", action="store_true", help="check the main checkout, for the files given with --files")
    parser.add_argument("--copy", help="the package's copy (default: the folder this runs in)")
    parser.add_argument("--name", help="the build mirror's name: the copy's name, or main (default)")
    parser.add_argument("--port", type=int, help="the mirror's port: the package's, or 3100 for the main checkout (default)")
    parser.add_argument("--runner", choices=["wsl", "direct"], help="how webrun.py runs (default: WSL on Windows, directly elsewhere)")
    parser.add_argument("--files", nargs="*", default=[], help="changed files (with --main), or extra ones")
    parser.add_argument("--specs", nargs="*", help="run exactly these spec files instead of choosing")
    parser.add_argument("--also", nargs="*", default=[], help="spec files to run as well as the ones chosen")
    parser.add_argument("--renders", help="'auto' for the pages the change shows, or pages: \"home privacy\"")
    parser.add_argument("--spec-workers", type=int, default=0, help="Playwright workers for the specs (default: the mirror's, 4)")
    parser.add_argument("--render-workers", type=int, default=2)
    parser.add_argument("--all", action="store_true", help="count everything since the seed, not since the last check")
    parser.add_argument("--max", type=int, default=8, help="spec files at most (default 8); the rest are left to the final check")
    parser.add_argument("--slots", type=int, help="the web gate's slots (default UX_GATE_SLOTS, else 3)")
    parser.add_argument("--list", action="store_true", help="print what would run and why; run nothing")
    parser.add_argument("--json", action="store_true", help="print the summary as JSON")
    args = parser.parse_args()
    if args.main and not args.files and not args.specs and not args.also:
        raise SystemExit("--main needs the changed files (--files) or the specs to run (--specs, --also).")

    ch = Changes(args)
    root = ch.root
    name = re.sub(r"[^A-Za-z0-9._-]", "", args.name or ("main" if ch.main else root.name))
    port = args.port or (3100 if ch.main else None)
    if not port:
        raise SystemExit("--port is needed in a package's copy: the port the workflow gave the package.")
    how = args.runner or ("wsl" if os.name == "nt" else "direct")

    plan, notes = [], []
    tc_paths, _, _ = ch.since("typecheck")
    if any(TS.search(p) for p in tc_paths) or ch.failed("typecheck"):
        plan.append(("typecheck", {}))
    lg_paths, _, _ = ch.since("legal")
    if any(re.search(r"^src/content/legal/|^src/app/(\[language\]/\[document\]|privacy|terms|legal|delete-account)/|^docs/LEGAL", p) for p in lg_paths) or ch.failed("legal"):
        plan.append(("legal", {}))
    b_paths, _, _ = ch.since("build")
    if any(SITE.search(p) for p in b_paths) or ch.failed("build"):
        plan.append(("build", {}))
    u_paths, _, _ = ch.since("unit")
    if any(re.search(r"^src/lib/|^edge/|\.unit\.ts$", p) for p in u_paths) or ch.failed("unit"):
        plan.append(("unit", {}))
    s_paths, s_names, s_copy = ch.since("specs")
    # --also takes spec files, or the failing tests' names ("[desktop] › ux-web-home.spec.ts:12:3 › …").
    also, known = [], set(spec_files(root))
    for s in args.also:
        m = re.search(r"([\w.-]+\.(?:spec|unit)\.ts)\b", norm_rel(s, root))
        spec = f"tests/{m.group(1)}" if m else norm_rel(s, root)
        if spec in known and spec not in also:
            also.append(spec)
        elif spec.endswith(".unit.ts"):
            if not any(s == "unit" for s, _ in plan):
                plan.append(("unit", {}))
        elif spec not in known:
            notes.append(f"--also {s}: not a spec file here, left out")
    if args.specs is not None:
        chosen = [(s if norm_rel(s, root).startswith("tests/") else f"tests/{norm_rel(s, root)}", "asked for") for s in args.specs]
        chosen = [(norm_rel(s, root), w) for s, w in chosen]
        rest, unmapped = [], []
    else:
        chosen, rest, _, unmapped = choose(root, s_paths, s_names, ch.failed("specs"), args.max, also)
    if chosen:
        plan.append(("specs", {"chosen": chosen, "copy": s_copy}))
    if unmapped:
        notes.append("no spec is mapped to " + ", ".join(unmapped[:8]) + ": add the specs that cover them with --also, or leave them to the final check")
    if args.renders:
        r_paths, r_names, r_copy = ch.since("renders")
        if args.renders == "auto":
            _, _, pages, _ = choose(root, r_paths, r_names, [], args.max)
            pages = sorted(set(pages) | set(ch.failed("renders")))
        else:
            pages = [p for p in re.split(r"[\s,|]+", args.renders) if p]
        if ALL in pages:
            pages = [ALL]
        if pages:
            plan.append(("renders", {"pages": pages, "copy": r_copy}))
        else:
            notes.append("renders: no page shows what changed")
    steps = [s for s, _ in plan]
    if ("specs" in steps or "renders" in steps) and "build" not in steps:
        # Playwright serves the mirror's last build: build only if it has none (a new mirror).
        plan.insert(len([s for s in steps if s in ("typecheck", "legal")]), ("build", {"if_missing": True}))

    summary = {"root": root.as_posix(), "mirror": name, "port": port, "mode": "main checkout" if ch.main else "copy",
               "since": "the given files" if ch.main else ("the last check" if ch.ever_ran("specs") or ch.ever_ran("build") else "the seed"),
               "changed": s_paths, "sections": sorted(s_names), "steps": [], "failures": [],
               "deferred": [{"spec": s, "why": w} for s, w in rest], "notes": notes, "passed": True,
               "logs": f"{root.as_posix()}/{LOGS}/"}
    if args.list:
        print(json.dumps({**summary, "plan": [{"step": s, **({"specs": [f"{a} ({w})" for a, w in x["chosen"]]} if s == "specs" else {}),
                                                  **({"pages": x["pages"]} if s == "renders" else {})} for s, x in plan],
                          "script": script(plan, args.spec_workers, args.render_workers).splitlines() if plan else []},
                         ensure_ascii=False, indent=1))
        return 0
    if not plan:
        summary["note"] = "Nothing to run: no change since the last check, and nothing failed in it."
    else:
        line = one_line(script(plan, args.spec_workers, args.render_workers))
        with waves.gate_slot(args.slots, "web") as waited:
            summary["gateWaitSeconds"] = round(waited)
            started = time.time()
            done = subprocess.run([*runner(root, name, port, how), "--", line], capture_output=True)
            out = done.stdout.decode("utf-8", "replace") + done.stderr.decode("utf-8", "replace")
            summary["seconds"] = round(time.time() - started)
        logs = root / LOGS
        logs.mkdir(parents=True, exist_ok=True)
        (logs / "run.log").write_text(out, encoding="utf-8")
        marks = {}
        for raw in out.splitlines():
            m = MARK.match(raw.strip())
            if m:
                marks[m.group(1)] = None if m.group(2) == "skipped" else (int(m.group(3)), int(m.group(4)))
        for step, extra in plan:
            mark = marks.get(step, "missing")
            if mark == "missing":
                summary["steps"].append({"step": step, "ran": False, "passed": False,
                                         "note": "didn't run: the build mirror failed first. " + "\n".join(out.strip().splitlines()[-8:])})
                continue
            if mark is None:
                summary["steps"].append({"step": step, "ran": False, "passed": False, "note": "skipped: an earlier step failed"})
                continue
            code, secs = mark
            entry = {"step": step, "ran": True, "passed": code == 0, "seconds": secs}
            if step in ("typecheck", "legal", "build", "unit"):
                if step == "build" and "UXCHECK-NOTE build security-notice" in out:
                    entry["note"] = ("Next.js stopped the build with its SecurityFatalError notice: it says this Next.js version "
                                     "has a known security vulnerability (npm's advisories), and it goes on when the build runs "
                                     "again, so the check ran it again. Mention the notice in your notes, for the owner.")
                if code:
                    entry["error"] = tail(logs / f"{step}.log")
                    if step == "build" and "SecurityFatalError" in entry["error"]:
                        entry["error"] = "Next.js stopped the build twice with its SecurityFatalError notice (a known security vulnerability in this Next.js version): run the check again; if it stops again, report it with owner infrastructure."
                elif step == "build" and extra.get("if_missing"):
                    entry["note"] = "nothing on the site changed: " + ("kept the mirror's last build" if "kept the last build" in tail(logs / "build.log", 3) else "the mirror had no build, so it built one")
                ch.ran(step, [step] if code else [])
            elif step == "specs":
                fails, stats = failures_from(logs / "specs.json", tail(logs / "specs.log", 200))
                entry.update({"files": len(extra["chosen"]), "passedTests": stats[0], "failedTests": stats[1], "skipped": stats[2], "flaky": stats[3],
                              "chosen": [f"{s} ({w})" for s, w in extra["chosen"]]})
                if code and not fails:
                    fails = [{"test": "the Playwright run", "file": "", "error": tail(logs / "specs.log")}]
                summary["failures"] += [{"step": "specs", **f} for f in fails]
                ran_specs = [s for s, _ in extra["chosen"]]
                failed_specs = sorted({f["file"] for f in fails if f.get("file")}) or ran_specs
                ch.ran("specs", failed_specs if code else [], extra["copy"], advance=args.specs is None, covered=ran_specs)
            elif step == "renders":
                fails, stats = failures_from(logs / "renders.json", tail(logs / "renders.log", 200))
                entry.update({"pages": extra["pages"], "rendered": stats[0], "failedFlows": stats[1],
                              "renders": f"{root.as_posix()}/artifacts/ux-web/ (INDEX.md lists them)"})
                entry["passed"] = True  # evidence, not a gate
                if code:
                    entry["note"] = f"{len(fails) or 'some'} render flow(s) failed: the reviewer won't have those renders"
                summary["failures"] += [{"step": "renders", **f} for f in fails]
                ch.ran("renders", extra["pages"] if code and extra["pages"] != [ALL] else [], extra["copy"])
            summary["steps"].append(entry)
        ch.save()
    summary["passed"] = all(s.get("passed", True) for s in summary["steps"])
    if args.json:
        print(json.dumps(summary, ensure_ascii=False, indent=1))
    else:
        report(summary)
    return 0 if summary["passed"] else 1


def report(summary):
    where = "the main checkout" if summary["mode"] == "main checkout" else "this copy"
    say(f"UX web check of {where}: {'passed' if summary['passed'] else 'FAILED'}")
    say(f"Changed since {summary['since']}: {', '.join(summary['changed']) or 'nothing'}"
        + (f"; copy sections {', '.join(summary['sections'])}" if summary["sections"] else ""))
    if summary.get("note"):
        say(summary["note"])
    if summary.get("gateWaitSeconds"):
        say(f"(waited {summary['gateWaitSeconds']} s for a gate slot)")
    for s in summary["steps"]:
        if not s.get("ran"):
            say(f"- {s['step']}: not run. {s.get('note', '')}")
            continue
        head = f"- {s['step']}: {'ok' if s['passed'] else 'FAILED'} ({s['seconds']} s)"
        if s["step"] == "specs":
            head += f", {s['files']} spec file(s): {s['passedTests']} passed, {s['failedTests']} failed, {s['skipped']} skipped"
        if s["step"] == "renders":
            head += f": {', '.join(s['pages'])}; {s['rendered']} rendered. Renders: {s['renders']}"
        if s.get("note"):
            head += f" [{s['note']}]"
        say(head)
        for line in s.get("chosen", []):
            say(f"    {line}")
        if s.get("error"):
            say("    " + s["error"].replace("\n", "\n    "))
    for f in summary["failures"]:
        say(f"FAILED ({f['step']}): {f['test']}")
        if f.get("error"):
            say("    " + f["error"].replace("\n", "\n    "))
    for n in summary["notes"]:
        say(f"Note: {n}")
    if summary["deferred"]:
        say(f"Left to the run's final check ({len(summary['deferred'])} more spec file(s) cover this change): "
            + ", ".join(d["spec"] for d in summary["deferred"]))
    say(f"Logs: {summary['logs']}")


if __name__ == "__main__":
    sys.exit(main())
