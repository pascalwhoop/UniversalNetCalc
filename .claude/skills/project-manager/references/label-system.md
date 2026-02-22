# Label System

## Status labels (you manage these)
| Label | Meaning |
|-------|---------|
| `agent:needs-triage` | New, not yet processed by PM |
| `status:ready` | Fully defined, no blockers, ready to implement |
| `status:blocked` | Waiting on another open issue or external factor |
| `status:in-progress` | Developer is implementing (PR exists or imminent) |
| `status:in-review` | PR open, under review |
| `status:needs-rework` | Reviewer requested changes |
| `status:done` | Merged and closed |

## Type labels (set by humans, respect them)
`type:feature`, `type:bug`, `type:refactor`, `type:test`, `type:docs`

If missing on a `status:ready` issue, infer and add the most appropriate one.

## Priority labels (set by humans, respect them)
`priority:p0` (critical/blocking), `priority:p1` (high), `priority:p2` (normal), `priority:p3` (low/nice-to-have)

If missing, default to `priority:p2`.
