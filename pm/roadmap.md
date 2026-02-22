# Roadmap

This is a living document. The PM agent updates it as priorities shift based on user signal and
product state. It reflects current thinking, not commitments.

---

## Now — Active work

### Tax deductions framework
Branch: `claude/tax-deductions-framework-sTjVq`

Per-country top-5 tax deductions surfaced to the user as configurable inputs. User enters their
situation (e.g. monthly mortgage payment) and the engine calculates the actual tax impact. Also
serves an educational purpose — showing people deductions they didn't know they had.

Requires: per-country deduction config blocks, UI for deduction inputs, engine evaluation.

### Synchronized salary mode + copy-all fix
The current "copy all" button is broken — it copies the salary number without converting currency,
so €100k becomes £100k instead of the actual equivalent.

Replace with a **synchronized salary toggle** at the top: when on, editing the gross salary in
any country column updates all columns. This is more useful than copy-all and solves the
underlying UX confusion.

---

## Next — Clearly defined, not yet started

### Cost of living module
After deductions, the third layer: post-tax fixed costs. Rent/mortgage, healthcare, food,
mobility, travel. User enters their own numbers per country. Simple subtraction from net.

Visually separate from tax inputs — part of the wizard-style editor direction.

Key decision: start with user-entered values only. No pre-filling yet.

### Wizard-style editor (UX refactor)
Separate editing from results. When adding/configuring a country, walk through:
1. Income setup
2. Tax deductions (country-specific)
3. Cost of living

Results view shows the clean comparison. "Edit" button per country reopens the wizard.

This becomes more important once deductions + costs are in — the single-column layout won't
scale to that many inputs.

---

## Later — Directionally right, details TBD

### Smart cost-of-living pre-filling
Once we have user-entered cost data, start offering city-level starting points. Two approaches
being considered:
- **Log and median**: aggregate what users have entered anonymously, offer median as default
- **Spending percentile**: instead of flat numbers, ask "where are you on the spending curve
  for going out?" and translate that to local amounts. More nuanced and more useful.

### Broader country coverage (EU focus first)
More EU countries to serve the beachhead market. Priority order roughly: countries with high
inbound mobility for EU professionals. Watch issue tracker for user requests — repeated asks
for the same country are the signal.

### US state coverage
Americans moving between states is a real use case. Federal + state tax is the complexity.
Deprioritized vs. EU for now but clearly scoped.

### Regional depth (cantons, municipalities)
Switzerland is already direction-set for canton + municipality level. Other countries with
meaningful regional variation (e.g. Belgium, Spain) should follow the same pattern.

---

## Intentionally not doing

- Modeling lifestyle, happiness, or non-financial factors
- Full tax return / payroll tool
- Monetization (for now)
- Modeling more than ~5 deductions per country (80/20 rule)
