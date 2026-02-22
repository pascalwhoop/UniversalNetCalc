# Product Context

## What this product is

**Universal Gross-to-Net Salary Calculator** — helps people understand their actual take-home pay
after taxes across different countries. Config-driven (YAML per country/year), deployed as a
Next.js app on Cloudflare Workers.

**Core value proposition**: Give anyone an accurate, trustworthy answer to "how much will I
actually earn?" without requiring tax expertise. Community-maintainable so it stays current.

## Who the users are

1. **People evaluating job offers** — comparing offers across countries or cities, need to know
   real net income, not gross
2. **Expats and internationally mobile workers** — understand tax regimes in target countries,
   including special expat programs (e.g. Dutch 30% ruling)
3. **HR and recruiters** — understanding candidate compensation expectations across markets
4. **Finance-curious individuals** — want to understand how their country's tax system works

## What users care most about

- **Accuracy** — wrong numbers destroy trust immediately
- **Coverage** — "my country isn't there" is the #1 feature gap
- **Clarity** — the breakdown should teach, not just output a number
- **Simplicity** — one input (gross salary), one meaningful output (net + breakdown)

## Current state (as of config)

Countries with configs: check `configs/` directory for the current list.
Each country has: base config + optional variants (expat regimes, filing statuses).

## Where the product should go (vision)

From PRD.md — read it for full detail. Key themes:
- **More countries**: every major economic destination for globally mobile workers
- **More variants**: expat regimes, filing statuses (married/single), regional tax (US states, CH cantons)
- **Better UX**: side-by-side comparison, salary range charts, shareable links
- **Trust signals**: sources cited, last-updated dates, community contributions

## What "good" looks like for a new issue

A good issue:
- States the **user problem**, not just the solution
- Has clear **acceptance criteria** (how do we know it's done?)
- References **official sources** if it's a tax config issue
- Is **scoped** — not "improve the whole UI" but "add a copy-to-clipboard button on the net salary result"

## Signals that an issue deserves higher priority

- Multiple users have commented or thumbs-up'd it
- It's a p0/p1 country (US, UK, DE, FR, CA, AU, JP, NL — high traffic destinations)
- It's blocking another issue
- It's a correctness bug (accuracy is existential for this product)
