# Product Vision

## The Question We Answer

**"If I move to [country/city], how will I actually be standing financially?"**

Not approximately. Not with hand-wavy averages. With the actual tax rules, the actual deductions
you'd qualify for, and your actual costs — so you can make a real decision.

## Who This Is For

**Primary user: the geographically mobile professional.**

Gen Z and Millennials who can move relatively freely — remote workers, people on employer-of-record
contracts, consultants at large firms who can transfer internationally, and Americans weighing a
move between states. They're educated, financially literate enough to ask the right questions, but
not tax experts. They don't want to hire a tax advisor just to evaluate whether a move makes sense.

**Secondary user: the HR professional or recruiter** helping employees or candidates navigate
international mobility — understanding what a compensation package actually means in take-home terms
in different locations.

**Beachhead market: EU free movers.** People who can legally work anywhere in the EU and are
actively evaluating their options. This is where we go deep first.

**We are not building for:** companies running payroll, accountants filing returns, or anyone
who needs authoritative legal tax advice. We're an informational tool, not a tax authority.

## The Problem With Everything Else

Tools like Numbeo and Expatistan give you rough cost-of-living comparisons but treat taxes as a
blunt percentage. Actual tax calculators are per-country silos that don't let you compare.
Neither accounts for the things that genuinely change your tax burden — the Dutch mortgage
interest deduction that could be worth €700/month, the Swiss canton-level variation that makes
Zug and Geneva wildly different, the 30% ruling for Dutch expats.

**Our edge is depth of tax knowledge at scale.** The kind of detail you'd normally pay a tax
advisor for — canton + municipality level in Switzerland, expat regimes, the top deductions per
country — built once into a config-driven engine and available free to everyone, for any country
we support.

## What the Product Does (in layers)

### Layer 1: Gross → Net (live)
Enter your gross salary, get your net after all taxes and social contributions. Multiple countries
side by side. This exists.

### Layer 2: Tax deductions (in progress)
For each country, surface the top ways to reduce your tax burden — mortgage interest, pension
contributions, childcare, etc. User inputs their situation (e.g. monthly mortgage payment), the
engine calculates the actual tax impact automatically. The goal is also educational: you might not
know you can deduct your mortgage interest in the Netherlands until this tool tells you.

### Layer 3: Cost of living (next)
Post-tax, what are your fixed costs? Rent/mortgage, healthcare, food, mobility, travel. User
enters their own numbers to start — we're not averaging their life. Eventually we may pre-fill
based on city data or logged medians, but user input first.

The combination of Layer 1 + 2 + 3 answers the real question: **disposable income per month,
per country, for your specific situation.**

## UX Direction

The current single-column-per-country layout works for quick comparisons but gets cluttered as
inputs grow. The direction is a **wizard-style editor** separated from the results view:

- **Edit mode**: walk through income → deductions → costs in steps, per country
- **Results view**: clean comparison across countries once configured
- **Synchronized salary mode**: toggle that locks your gross salary across all countries,
  so you're always comparing apples to apples

## What We're Not Doing

- Modeling lifestyle, happiness, social connections, or quality of life
- Becoming a payroll or accounting tool
- Modeling every possible deduction (80/20 — top 5 per country that cover the majority of impact)
- Charging money (for now — future TBD)
