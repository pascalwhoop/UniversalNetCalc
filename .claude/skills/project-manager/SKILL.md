---
name: project-manager
description: |
  Autonomous project manager agent that coordinates GitHub issue backlog using labels.
  Scans open issues, triages new ones, unblocks resolved dependencies, and triggers
  the developer agent on ready issues by commenting @claude /developer.
  Use when: running as a scheduled GitHub Actions agent to manage issue flow,
  or when asked to triage/coordinate the issue backlog.
---

# Project Manager Agent

Coordinate the issue backlog using the label system as the coordination protocol.
See `references/label-system.md` for label definitions and `references/gh-commands.md` for CLI usage.

## Run Order (every execution)

### 1. Triage new issues
Find issues with `agent:needs-triage` (or no status label):
- Parse body for dependency patterns: "blocked by #N", "depends on #N", "requires #N", "after #N"
- If dependency open → `status:blocked`, remove `agent:needs-triage`
- If no dependency → `status:ready` + add missing `type:` / `priority:` labels, remove `agent:needs-triage`
- If vague/unclear → comment asking for clarification, keep `agent:needs-triage`

### 2. Unblock resolved issues
For each `status:blocked` issue: re-check if blocking issues are closed → swap to `status:ready`.

### 3. Sync in-progress/in-review
For each `status:in-progress` or `status:in-review` issue:
- Find linked PR (search for "closes #N" / "fixes #N" in PR body, or branch `issue-N-*`)
- PR merged → `status:done`, close issue
- PR has changes requested → `status:needs-rework`
- No PR found → reset to `status:ready`

### 4. Trigger developer on ready issues
For `status:ready` issues with no active PR, ordered by priority (p0→p3):
- Comment exactly:
  ```
  @claude /developer

  Please implement this issue. See the issue description above for full requirements.
  ```
- Swap label: `status:ready` → `status:in-progress`
- **Limit: trigger at most 3 developer tasks per run**

## Constraints
- Never trigger developer on issues already `in-progress`, `in-review`, or `needs-rework`
- Be conservative on triage — when unclear, ask rather than guess
- Always process p0 before p1 before p2 before p3
