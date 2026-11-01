"""Parallel packages for the UX web loop: a seeded copy of the website per package, merged back.

ux-web-fix runs every package in its own copy of this repo, as many at once as the machine
allows: a git worktree under ~/.taskflow-tools/wt, with its own build mirror (webrun.py) and
its own port. A copy starts from HEAD, but a run's changes are uncommitted until the run is
verified, so:

  add    makes the copy and seeds it: copies the run's changed files and the loop's records
         (DECISIONS.md, ISSUES.md) from the main checkout, and records that state as the copy's
         "seed" commit (git commit-tree: no ref moves, no hooks). A copy that exists and is
         seeded is kept as it is, so a second add can't wipe a package's work; --fresh makes
         it again from the main checkout.
  merge  (run by the workflow's merge step, from anywhere) takes each copy's changes since
         its seed and applies them to the main checkout with a three-way merge (git
         merge-file; insertions made on both sides keep both). A package whose changes
         conflict is applied not at all, and keeps its copy so an implementer can carry it
         into a fresh copy (carry, then drop). A package that fails in any other way is
         reported with its error; the others still merge. --shelve saves a package's patch to
         --patches and removes its copy, without merging it. Then the merged copies, their
         branches and their build mirrors are removed; a cleanup that fails is reported, never
         fatal.
  carry  (run by an integrator) brings a conflicted package's changes over from its old copy
         into a fresh, seeded one, file by file, with three-way merges. Clean files are
         written; conflicting ones get conflict markers to resolve by hand.
  gate   runs a heavy command (a build, Playwright) when one of N slots is free, so many
         implementers can work at once while only N build.

Seeds and merges take one lock in the main repo's git folder, so a seed never copies a
half-merged main checkout.

The app's loop has its own copy, for Flutter: ../TaskFlow/.claude/skills/ux/scripts/waves.py.

Usage:
  python -I -X utf8 .claude/skills/ux-web/scripts/waves.py add --repo <this repo> --name <copy> [--fresh] [--files <path> ...]
  python -I -X utf8 .claude/skills/ux-web/scripts/waves.py merge --worktree <id>=<path> [...] [--shelve <id>=<path> ...]
                    [--patches <dir>] [--log <file>] [--keep]
  python -I -X utf8 .claude/skills/ux-web/scripts/waves.py carry --from <old copy> [--into <new copy>]
  python -I -X utf8 .claude/skills/ux-web/scripts/waves.py gate --pool web [--slots N] -- <heavy command>
  python -I -X utf8 .claude/skills/ux-web/scripts/waves.py diff --worktree <path>    (a package's patch since its seed)
  python -I -X utf8 .claude/skills/ux-web/scripts/waves.py drop --worktree <path> [--save <patch>]
Paths are relative to the repo root. add, merge and carry print one JSON object.
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from contextlib import contextmanager
from pathlib import Path

CONTEXT = [".claude/ux-web/DECISIONS.md", ".claude/ux-web/ISSUES.md"]
# Never merged back: the loop's own records and setup belong to the organizer. Build output
# (.next, artifacts, test results) is ignored by git, so a copy never reports it.
NOT_MERGED = (".claude/", ".agents/", ".codex/")
# Test and build output, never a package's change, even when a copy's .gitignore misses it
# (test-results-renders/ wasn't ignored before 2026-11-01).
OUTPUT = ("artifacts/", "test-results/", "test-results-renders/", "playwright-report/", ".next/")
SEED_FILE = "UX_WAVES_SEED"
# Where the copies live. Keep in step with pkg.py.
COPIES = Path.home() / ".taskflow-tools" / "wt"


def git(cwd, *args, check=True, binary=False):
    result = subprocess.run(["git", "-C", str(cwd), *args], capture_output=True)
    if check and result.returncode != 0:
        raise SystemExit(f"git {' '.join(args)} failed in {cwd}: {result.stderr.decode('utf-8', 'replace').strip()}")
    return result.stdout if binary else result.stdout.decode("utf-8", "replace").strip()


def main_root(cwd):
    common = Path(git(cwd, "rev-parse", "--path-format=absolute", "--git-common-dir"))
    return common.parent


def try_lock(f):
    """Takes an exclusive lock on an open file without waiting. The OS releases it if the
    process dies."""
    try:
        if os.name == "nt":
            import msvcrt
            f.seek(0)
            msvcrt.locking(f.fileno(), msvcrt.LK_NBLCK, 1)
        else:
            import fcntl
            fcntl.flock(f.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        return True
    except OSError:
        return False


@contextmanager
def repo_lock(main, timeout=900):
    """One seed or merge at a time in the main checkout: merges write it, seeds copy it."""
    common = Path(git(main, "rev-parse", "--path-format=absolute", "--git-common-dir"))
    f = open(common / "ux-waves.lock", "a+b")
    waited = 0.0
    try:
        while not try_lock(f):
            if waited >= timeout:
                raise SystemExit(f"waited {timeout} s for {common / 'ux-waves.lock'}: another seed or merge is stuck")
            time.sleep(0.5)
            waited += 0.5
        yield
    finally:
        f.close()


def seed_of(wt):
    """The copy's seed commit, or None if it was never seeded."""
    gitdir = Path(git(wt, "rev-parse", "--path-format=absolute", "--git-dir"))
    path = gitdir / SEED_FILE
    return path.read_text(encoding="utf-8").strip() if path.is_file() else None


def lf(data):
    return None if data is None else data.replace(b"\r\n", b"\n")


def read(path):
    return path.read_bytes() if path.is_file() else None


def write(path, data, like):
    """Writes data (LF) with the line endings of `like`, the file it replaces."""
    if data is None:
        if path.exists():
            path.unlink()
        return
    if like is not None and b"\r\n" in like:
        data = data.replace(b"\n", b"\r\n")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


def wsl_path(path):
    text = str(path).replace("\\", "/")
    return re.sub(r"^([A-Za-z]):/", lambda m: f"/mnt/{m.group(1).lower()}/", text)


# ---------------------------------------------------------------- seed

def run_changes(main):
    """The uncommitted files in the main checkout: what the run (and anyone else) changed since
    HEAD. .env files are ignored by git and never listed."""
    tracked = git(main, "diff", "--name-only", "HEAD").splitlines()
    untracked = git(main, "ls-files", "--others", "--exclude-standard", "--", "src", "tests", "public", "scripts").splitlines()
    return {p for p in tracked + untracked if p}


def seed_worktree(wt, main, files=()):
    """Copies the main checkout's uncommitted state into the copy and records it as the seed."""
    if wt.resolve() == main.resolve():
        raise SystemExit("a copy is seeded from the main checkout, never the main checkout itself.")
    copied, removed = [], []
    with repo_lock(main):
        # Start from the main checkout's commit (dev), before anything else.
        base = git(main, "rev-parse", "HEAD")
        if git(wt, "rev-parse", "HEAD") != base:
            git(wt, "reset", "--hard", "--quiet", base)
        context = set(CONTEXT) if (main / ".claude" / "ux-web").is_dir() else set()
        for rel in sorted(set(files or []) | run_changes(main) | context):
            src, dst = main / rel, wt / rel
            if src.is_file():
                dst.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(src, dst)
                copied.append(rel)
            elif dst.is_file():
                dst.unlink()  # deleted earlier in the run
                removed.append(rel)
    git(wt, "add", "-A")
    tree = git(wt, "write-tree")
    head = git(wt, "rev-parse", "HEAD")
    commit = git(wt, "commit-tree", tree, "-p", head, "-m", "UX loop seed: the run so far")
    gitdir = Path(git(wt, "rev-parse", "--path-format=absolute", "--git-dir"))
    (gitdir / SEED_FILE).write_text(commit, encoding="utf-8")
    return copied, removed, commit


def add(args):
    """A copy of the website, outside the repo, seeded with the run so far."""
    main = main_root(Path(args.repo))
    name = re.sub(r"[^A-Za-z0-9._-]", "", args.name)
    if not name:
        raise SystemExit("add needs a --name of letters, digits, dots, dashes or underscores")
    wt = COPIES / name
    report = {"worktree": str(wt).replace("\\", "/"), "wsl": wsl_path(wt), "name": name}
    if wt.is_dir() and not args.fresh:
        try:
            seed = seed_of(wt)
        except SystemExit:
            seed = None
        if seed:
            report.update(existing=True, seed=seed[:10],
                          note="This copy exists and is seeded already: nothing changed. Keep working in it (add --fresh starts it over).")
            print(json.dumps(report))
            return
    if wt.exists():
        subprocess.run(["git", "-C", str(main), "worktree", "remove", "--force", str(wt)], capture_output=True)
        shutil.rmtree(wt, ignore_errors=True)
        git(main, "worktree", "prune")
    COPIES.mkdir(parents=True, exist_ok=True)
    git(main, "worktree", "add", "--detach", str(wt), "HEAD")
    copied, removed, commit = seed_worktree(wt, main, args.files)
    report.update(existing=False, seeded=len(copied), removed=len(removed), seed=commit[:10])
    print(json.dumps(report))


def remove_mirror(wt):
    """A copy's build mirror (webrun.py), best effort: in WSL on Windows, directly elsewhere."""
    try:
        if COPIES.resolve() not in Path(wt).resolve().parents:
            return "not a copy"
        webrun = Path(__file__).resolve().parent / "webrun.py"
        if os.name == "nt":
            command = ["wsl", "-e", "python3", wsl_path(webrun), "--remove", Path(wt).name]
        else:
            command = [sys.executable, str(webrun), "--remove", Path(wt).name]
        done = subprocess.run(command, capture_output=True, timeout=300)
        return "removed" if done.returncode == 0 else f"failed: {done.stderr.decode('utf-8', 'replace')[-200:]}"
    except Exception as e:  # never fatal: a mirror left behind costs only disk
        return f"failed: {type(e).__name__}: {e}"


# ---------------------------------------------------------------- merge

def only_insertions(diff3):
    """True when every conflict in a --diff3 merge has an empty base: both sides only added
    lines at the same place, such as two test groups appended to one file."""
    state, base_lines, seen = None, 0, False
    for line in diff3.split(b"\n"):
        if line.startswith(b"<<<<<<< "):
            state, base_lines, seen = "ours", 0, True
        elif line.startswith(b"||||||| ") and state == "ours":
            state = "base"
        elif line.startswith(b"=======") and state == "base":
            if base_lines:
                return False
            state = "theirs"
        elif line.startswith(b">>>>>>> ") and state == "theirs":
            state = None
        elif state == "base":
            base_lines += 1
    return seen and state is None


def merge_text(base, ours, theirs, marked=False, union=True):
    """Three-way merge with git merge-file. Two insertions at the same place keep both, ours
    first (unless union is False). Returns (bytes or None, conflict note). With marked, a
    conflict returns the text with diff3 conflict markers instead of None."""
    with tempfile.TemporaryDirectory() as tmp:
        paths = []
        for name, data in (("ours", ours), ("base", base), ("theirs", theirs)):
            p = Path(tmp) / name
            p.write_bytes(data or b"")
            paths.append(str(p))
        result = subprocess.run(["git", "merge-file", "-p", *paths], capture_output=True)
        if result.returncode == 0:
            return result.stdout, None
        if result.returncode < 0:
            return None, "merge-file failed"
        diff3 = subprocess.run(["git", "merge-file", "-p", "--diff3", *paths], capture_output=True).stdout
        if union and only_insertions(diff3):
            both = subprocess.run(["git", "merge-file", "-p", "--union", *paths], capture_output=True)
            if both.returncode == 0:
                return both.stdout, None
        if marked:
            labels = ["-L", "main checkout now", "-L", "the package's seed", "-L", "the package"]
            text = subprocess.run(["git", "merge-file", "-p", "--diff3", *labels, *paths], capture_output=True).stdout
            return text, f"{result.returncode} conflicting hunk(s), marked"
        return None, f"{result.returncode} conflicting hunk(s)"


# ---------------------------------------------------------------- gate

@contextmanager
def gate_slot(slots=None, pool="web"):
    """Holds one of the machine's slots for heavy commands (a build, Playwright) while the block
    runs, so many implementers can think and edit in parallel while only a few build at a time.
    A slot is a lock on a file in the main repo's git folder; the OS releases it if the process
    dies. A process the gate started (UX_GATE_HELD names its pool) holds a slot already."""
    slots = max(1, int(slots or os.environ.get("UX_GATE_SLOTS") or 3))
    # One pool per loop and repo; the app's loop keeps its own, in its own repo.
    pool = re.sub(r"[^a-z0-9-]", "", (pool or "web").lower()) or "web"
    if os.environ.get("UX_GATE_HELD") == pool:
        yield 0.0
        return
    common = git(Path(__file__).resolve().parent, "rev-parse", "--path-format=absolute", "--git-common-dir")
    lock_dir = Path(common) / f"ux-gate-{pool}"  # this repo's .git, from any of its worktrees
    lock_dir.mkdir(parents=True, exist_ok=True)
    handle, waited, said = None, 0.0, False
    while handle is None:
        for i in range(slots):
            f = open(lock_dir / f"slot-{i}.lock", "a+b")
            if try_lock(f):
                handle = f
                break
            f.close()
        if handle is None:
            if not said:
                print(f"[gate] all {slots} slots busy; waiting", file=sys.stderr, flush=True)
                said = True
            time.sleep(2)
            waited += 2
    if waited:
        print(f"[gate] waited {waited:.0f} s for a slot", file=sys.stderr, flush=True)
    previous = os.environ.get("UX_GATE_HELD")
    os.environ["UX_GATE_HELD"] = pool
    try:
        yield waited
    finally:
        if previous is None:
            os.environ.pop("UX_GATE_HELD", None)
        else:
            os.environ["UX_GATE_HELD"] = previous
        handle.close()


def gate(args):
    """Runs a heavy command once one of the machine's slots is free (gate_slot)."""
    command = args.argv
    if command and command[0] == "--":
        command = command[1:]
    if not command:
        raise SystemExit("gate needs a command after --")
    with gate_slot(args.slots, args.pool):
        if len(command) == 1:  # one command line, for the shell
            return subprocess.run(command[0], shell=True).returncode
        exe = shutil.which(command[0]) or command[0]
        return subprocess.run([exe, *command[1:]]).returncode


class NotSeeded(Exception):
    pass


def changes(wt):
    """The copy's seed and the paths it changed since, after staging them in its own index."""
    seed_commit = seed_of(wt)
    if not seed_commit:
        raise NotSeeded(f"{wt} was never seeded (no {SEED_FILE}): its changes have no known base.")
    git(wt, "add", "-A")
    listed = git(wt, "diff", "--cached", "--name-only", "--no-renames", seed_commit)
    return seed_commit, [p for p in listed.splitlines() if p and not p.startswith(OUTPUT)]


def three_way(target, wt, seed_commit, paths, marked=False):
    """Plans bringing the package in `wt` (changed `paths` since `seed_commit`) onto `target`.
    Returns (writes, conflicts, ignored). With marked, a conflicting text file is still written,
    with conflict markers."""
    writes, conflicts, ignored = [], [], []
    for rel in paths:
        if rel.startswith(NOT_MERGED):
            ignored.append(rel)
            continue
        shown = subprocess.run(["git", "-C", str(wt), "show", f"{seed_commit}:{rel}"], capture_output=True)
        base = lf(shown.stdout) if shown.returncode == 0 else None
        theirs = lf(read(wt / rel))
        ours_raw = read(target / rel)
        ours = lf(ours_raw)
        if ours == base:
            writes.append((rel, theirs, ours_raw))
        elif ours == theirs:
            continue
        elif base is None or theirs is None or ours is None:
            if marked and theirs is not None:
                # Added on both sides, or deleted in the main checkout: never a silent union.
                merged, why = merge_text(base or b"", ours or b"", theirs, marked=True, union=False)
                writes.append((rel, merged, ours_raw))
                if why:
                    conflicts.append({"path": rel, "why": ("added on both sides: " if base is None else "deleted in the main checkout: ") + why})
            else:
                conflicts.append({"path": rel, "why": "added or deleted on both sides"})
        else:
            merged, why = merge_text(base, ours, theirs, marked=marked)
            if merged is not None and (marked or not why):
                writes.append((rel, merged, ours_raw))
            if why:
                conflicts.append({"path": rel, "why": why})
    return writes, conflicts, ignored


def pairs_of(items, flag):
    out = []
    for item in items or []:
        pid, _, path = item.partition("=")
        if not path:
            raise SystemExit(f"{flag} takes <id>=<path>, not {item!r}")
        out.append((pid, Path(path)))
    return out


def save_patch(wt, path):
    """Writes the package's changes since its seed to `path`. Returns a note."""
    seed_commit, paths = changes(wt)
    keep = [p for p in paths if not p.startswith(NOT_MERGED)]
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    patch = git(wt, "diff", "--cached", "--no-renames", "--binary", seed_commit, "--", *keep) if keep else ""
    path.write_text(patch + ("\n" if patch else ""), encoding="utf-8")
    return f"{len(keep)} file(s)"


def merge(args):
    pairs = pairs_of(args.worktree, "--worktree")
    shelves = pairs_of(args.shelve, "--shelve")
    if not pairs and not shelves:
        raise SystemExit("merge needs --worktree <id>=<path> or --shelve <id>=<path>")
    # The main checkout is the one this script belongs to, never a copy's: a copy that is gone,
    # or was never seeded, can't tell us where it came from.
    main = main_root(Path(__file__).resolve().parent)
    report = {"main": str(main), "packages": [], "shelved": [], "removed": []}
    with repo_lock(main):
        for pid, wt in pairs:
            entry = {"id": pid, "worktree": str(wt), "applied": [], "conflicts": [], "ignored": []}
            report["packages"].append(entry)
            try:
                if not wt.is_dir():
                    entry["gone"] = True
                    done = merged_before(main, wt)
                    if done is not None:
                        # Merged by an earlier merge (a resumed run asks again): the same answer.
                        entry["alreadyMerged"] = True
                        entry["applied"] = done.get("applied", [])
                    continue
                seed_commit, paths = changes(wt)
                writes, conflicts, ignored = three_way(main, wt, seed_commit, paths)
                entry["ignored"] = ignored
                if conflicts:
                    entry["conflicts"] = conflicts
                    continue  # all or nothing: the package is carried over by hand
                for rel, data, like in writes:
                    write(main / rel, data, like)
                    entry["applied"].append(rel)
            except NotSeeded as e:
                entry["error"] = str(e)
            except (SystemExit, Exception) as e:  # git failures raise SystemExit
                entry["error"] = f"{type(e).__name__}: {e}"
    for pid, wt in shelves:
        entry = {"id": pid, "worktree": str(wt), "patch": "", "removed": False}
        report["shelved"].append(entry)
        try:
            if wt.is_dir():
                if args.patches:
                    patch = Path(args.patches) / f"unmerged-{pid}.patch"
                    try:
                        entry["note"] = save_patch(wt, patch)
                        entry["patch"] = str(patch)
                    except NotSeeded as e:
                        entry["note"] = f"no patch: {e}"
                entry["removed"] = drop_worktree(main, wt)
        except (SystemExit, Exception) as e:
            entry["error"] = f"{type(e).__name__}: {e}"
    # A package that conflicted or failed keeps its copy, so it can be carried over by hand.
    for (pid, wt), entry in zip(pairs, report["packages"]):
        if wt.is_dir() and not entry["conflicts"] and "error" not in entry:
            try:
                remember_merge(main, wt, pid, entry["applied"])
                if not args.keep and drop_worktree(main, wt):
                    report["removed"].append(str(wt))
            except (SystemExit, Exception) as e:  # cleanup only: the merge itself is done
                entry["cleanup"] = f"{type(e).__name__}: {e}"
    if args.log:
        try:
            Path(args.log).parent.mkdir(parents=True, exist_ok=True)
            with open(args.log, "a", encoding="utf-8") as fh:
                fh.write(json.dumps({"at": time.strftime("%Y-%m-%dT%H:%M:%S"), **report}, ensure_ascii=False) + "\n")
        except OSError as e:
            report["log"] = f"not written: {e}"
    print(json.dumps(report, ensure_ascii=False, indent=1))


def tombstone(main, wt):
    common = Path(git(main, "rev-parse", "--path-format=absolute", "--git-common-dir"))
    return common / "ux-waves-merged" / (Path(wt).name + ".json")


def remember_merge(main, wt, pid, applied):
    """Leaves a note that this copy was merged, so merging it again, once it's gone, gives the
    same answer instead of "nothing to merge"."""
    path = tombstone(main, wt)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps({"id": pid, "worktree": str(wt), "applied": applied,
                                "at": time.strftime("%Y-%m-%dT%H:%M:%S")}, ensure_ascii=False), encoding="utf-8")


def merged_before(main, wt):
    path = tombstone(main, wt)
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except ValueError:
        return {}


def carry(args):
    """Brings a conflicted package over from its old copy into a fresh, seeded one."""
    wt = Path(args.into) if args.into else Path(git(Path.cwd(), "rev-parse", "--show-toplevel"))
    old = Path(args.source)
    if not seed_of(wt):
        raise SystemExit(f"Make the new copy first (waves.py add --fresh), then carry into it: {wt} isn't seeded.")
    if wt.resolve() == old.resolve():
        raise SystemExit("carry brings a package from its old copy into a new one, not into itself.")
    seed_commit, paths = changes(old)
    writes, conflicts, ignored = three_way(wt, old, seed_commit, paths, marked=True)
    for rel, data, like in writes:
        write(wt / rel, data, like)
    report = {
        "from": str(old),
        "into": str(wt),
        "applied": [rel for rel, _, _ in writes if rel not in {c["path"] for c in conflicts}],
        "conflicts": conflicts,
        "ignored": ignored,
        "next": "Resolve every conflict marker in the files under conflicts (keep both packages' intent), then run the type check, the build and the tests.",
    }
    print(json.dumps(report, ensure_ascii=False, indent=1))


def drop_worktree(main, wt):
    branch = git(wt, "symbolic-ref", "-q", "--short", "HEAD", check=False)
    removed = subprocess.run(["git", "-C", str(main), "worktree", "remove", "--force", str(wt)], capture_output=True)
    if removed.returncode != 0:
        return False
    # The engine's throwaway branches: worktree-agent-* (Agent tool) and worktree-wf_* (workflows).
    if branch.startswith(("worktree-agent-", "worktree-wf_")):
        git(main, "branch", "-D", branch, check=False)
    remove_mirror(wt)
    return True


def show_diff(args):
    """The package's own changes since its seed, as one patch."""
    wt = Path(args.worktree)
    try:
        seed_commit, paths = changes(wt)
    except NotSeeded as e:
        raise SystemExit(str(e))
    keep = [p for p in paths if not p.startswith(NOT_MERGED)]
    if not keep:
        print("(no changes)")
        return
    sys.stdout.write(git(wt, "diff", "--cached", "--no-renames", seed_commit, "--", *keep))
    print()


def drop(args):
    wt = Path(args.worktree)
    if not wt.is_dir():
        print(f"{wt} is already gone.")
        return
    main = main_root(wt)
    if args.save:
        try:
            print(f"Saved {save_patch(wt, args.save)} to {args.save}.")
        except (NotSeeded, SystemExit) as e:
            print(f"Could not save the patch: {e}")
    print(f"Removed {wt}." if drop_worktree(main, wt) else f"Could not remove {wt}.")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="action", required=True)
    m = sub.add_parser("merge")
    m.add_argument("--worktree", action="append", default=[], help="<package id>=<copy path>, to merge")
    m.add_argument("--shelve", action="append", default=[], help="<package id>=<copy path>, to save and remove unmerged")
    m.add_argument("--patches", help="where --shelve saves unmerged-<id>.patch (the run folder)")
    m.add_argument("--log", help="a JSON-lines file to append this merge's report to")
    m.add_argument("--no-gen", action="store_true", help="ignored: the website has nothing to generate")
    m.add_argument("--keep", action="store_true", help="keep the copies")
    c = sub.add_parser("carry", help="bring a conflicted package's changes into a fresh, seeded copy")
    c.add_argument("--from", dest="source", required=True, help="the package's old copy")
    c.add_argument("--into", help="the new copy (default: the current directory's)")
    g = sub.add_parser("gate")
    g.add_argument("--slots", type=int, help="heavy commands at once (default UX_GATE_SLOTS, else 3)")
    g.add_argument("--pool", default="web", help="the slots' pool (default web: the website's builds)")
    g.add_argument("argv", nargs=argparse.REMAINDER, help="-- <command>, or one quoted command line")
    w = sub.add_parser("add", help="a seeded copy of the website")
    w.add_argument("--repo", required=True)
    w.add_argument("--name", required=True)
    w.add_argument("--fresh", action="store_true", help="make the copy again even if it exists")
    w.add_argument("--files", nargs="*", default=[])
    d = sub.add_parser("diff", help="a package's changes since its seed")
    d.add_argument("--worktree", required=True)
    r = sub.add_parser("drop", help="remove a copy, its branch and its build mirror")
    r.add_argument("--worktree", required=True)
    r.add_argument("--save", help="first save its changes since the seed to this patch file")
    args = parser.parse_args()
    if args.action == "gate":
        return gate(args)
    {"add": add, "merge": merge, "carry": carry, "diff": show_diff, "drop": drop}[args.action](args)


if __name__ == "__main__":
    sys.exit(main())
