# GitHub CLI Reference

## List issues
```bash
# All open issues with labels
gh issue list --state open --json number,title,body,labels --limit 100

# Issues with a specific label
gh issue list --label "agent:needs-triage" --json number,title,body,labels
gh issue list --label "status:ready" --json number,title,body,labels --limit 50
```

## Edit issue labels
```bash
gh issue edit <number> --add-label "status:ready"
gh issue edit <number> --remove-label "agent:needs-triage"
gh issue edit <number> --add-label "status:ready" --remove-label "agent:needs-triage"
```

## Comment on an issue
```bash
gh issue comment <number> --body "your message here"
```

## Close an issue
```bash
gh issue close <number>
```

## Find PRs linked to an issue
```bash
# Search PRs by branch pattern
gh pr list --state open --json number,title,body,headRefName,reviews

# Check a specific PR's review status
gh pr view <number> --json state,reviews,mergeable,headRefName
```

## Parse output with jq
```bash
# Get all issue numbers with a label
gh issue list --label "status:ready" --json number,labels | jq '.[].number'

# Check if blocking issue is closed
gh issue view <number> --json state | jq -r '.state'
```
