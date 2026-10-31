@AGENTS.md

# Claude Code

What only Claude needs; everything else is in `AGENTS.md`, above.

- **The UX web loop is the `/ux-web` skill**, in `.claude/skills/ux-web/`: `SKILL.md`, its workflows in `workflows/` (run with the Workflow tool by `scriptPath`, never by `name`), its tools in `scripts/`, and how the loop works and the review guidelines in `references/`. Its agents are `.claude/agents/web-ux-reviewer.md`, `web-ux-organizer.md`, `web-ux-implementer.md` and `web-ux-tester.md`; the reviewer's memory is in `.claude/agent-memory/web-ux-reviewer/`.
- **Keep the PC awake** before any long run (a build and the renders, a fix run): request keep-awake with `until: "session_idle"`.
- **The app's loop is `/ux`, in `../TaskFlow`.** Its skill and agents load only when the session's folder is that repo: move the session there (`change_directory`) to run it.
- **Agents and skills load when a session starts or changes folder.** After adding or editing them mid-session, change directory to this repo again to reload them.
