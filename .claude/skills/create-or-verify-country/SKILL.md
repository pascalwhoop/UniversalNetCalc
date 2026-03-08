---
name: create-or-verify-country
description: |
  Create or externally verify YAML tax configurations for any country/year in the universal salary calculator.

  Use when:
  - Creating a new country configuration
  - Adding a new tax year for existing country
  - Creating variant configs (expat regimes, special tax rules)
  - Externally verifying existing configs (recommended for all configs)
  - Fixing bugs in existing configs

  Triggers: "add country", "create config", "verify country", "fix [country]", "new tax year",
  "add variant", "30% ruling", "verify test vectors", etc.

  CRITICAL GUARDRAILS:
  1. Test vectors MUST come from official government calculators - NEVER from the engine itself
  2. All configs MUST pass `npm run test:configs` before completion
  3. Progressive tax systems MUST be verified with marginal rate tests
  4. Multi-level taxation (federal+state) requires extra scrutiny
  5. Social security systems often have hidden complexity (multiple caps, progressive rates)
---

# Create or Verify Country/Year Tax Configuration

## 🚦 **Entry Decision Tree**

**Are you creating or verifying?**

### **Creating New Config:**
→ Follow full workflow: Research → Plan → Implement → Write Tests → Validate → Document

### **Verifying Existing Config:**
→ Skip to Verification Protocol (Step 7)

---

## Workflow (Creating New Config)

1. **Research** - Gather official sources (MANDATORY: official government calculator)
2. **Plan** - Identify complexity level and tax system changes
3. **Implement** - Create base.yaml with calculations
4. **Write Tests** - Create test vectors from EXTERNAL sources only
5. **Validate** - Run tests, debug failures
6. **Document** - Add sources and notices
7. **External Verification** - 3-layer verification protocol (MANDATORY)
8. **Add to Guides** - Document in guides/countries/<country>.md

---

## Step 1: Research (MANDATORY CHECKLIST)

### 🔴 **Critical Rules - Research Phase**

**✅ REQUIRED:**
1. Find the **official government tax calculator** URL
   - Examples: IRS Tax Estimator, HMRC PAYE Calculator, Belastingdienst, etc.
   - If no official calculator exists, document this explicitly
2. Find **official statutory tax rates** (government tax authority website)
3. Document **ALL sources with URLs and retrieval dates**
4. Check if tax year has **legislative changes** from previous year
5. For multi-level taxation (US, CA, CH, ES, IT), research **each level separately**

**❌ FORBIDDEN:**
- Third-party comparison sites (moneyland.ch, talent.com, nerdwallet.com, etc.)
- Generic tax advice blogs
- Using previous year's config without verifying changes
- Mental math or LLM calculations for test vectors

### Research Checklist

Gather from **official government sources ONLY**:

#### **Income Tax System**
- [ ] Progressive brackets and rates OR flat rate
- [ ] Standard deductions/personal allowances
- [ ] Filing status options (single, married, etc.)
- [ ] **CRITICAL:** Is this year-over-year **identical** or are there **changes**?
  - If copying from previous year, document what changed
  - Common changes: bracket inflation adjustments, rate changes, new credits/deductions

#### **Social Security / National Insurance**
- [ ] All contribution types (pension, health, unemployment, etc.)
- [ ] Employee vs employer rates (we calculate employee only)
- [ ] Income caps for each contribution type
- [ ] **Progressive rates** within contributions (e.g., ALV solidarity 0.5% above cap)
- [ ] **Regional variations** (e.g., CH cantonal multipliers, DE Saxony care rates)

**🚨 SOCIAL SECURITY COMPLEXITY WARNING:**
Social security is often MORE complex than it appears:
- **Multiple caps:** Different contributions may have different income caps
- **Progressive rates:** Some have base rate + solidarity/additional rate above threshold
- **Regional variations:** Rates may vary by state/province/canton
- **Special regimes:** Quebec has QPP+QPIP instead of CPP/EI

Examples of hidden complexity caught in verification:
- Switzerland: ALV 1.1% up to CHF 148,200, then 0.5% above (was missing 0.5%)
- Canada Quebec: QPP 6.40% (not CPP 5.95%) + QPIP 0.494% (was missing entirely)
- Germany Saxony: Care insurance 2.9% (not 2.4% standard)

#### **Tax Credits and Deductions**
- [ ] Standard credits applied automatically
- [ ] Optional user-claimable deductions (mortgage, pension, healthcare, etc.)
- [ ] Phaseout ranges and rates
- [ ] Income-dependent benefits

#### **Regional/Multi-Level Taxation**
For countries with federal + state/provincial/cantonal taxation:
- [ ] Federal system documented separately
- [ ] State/provincial variations documented
- [ ] How levels interact (additive, multiplicative, shared base)

#### **Expat/Special Regimes**
- [ ] Research expat tax regimes (30% ruling, impatriate, non-dom, etc.)
- [ ] Eligibility requirements
- [ ] How regime modifies standard calculation

#### **Official Calculator Validation**
- [ ] Test official calculator with 3-5 sample incomes
- [ ] Record exact results for future test vector verification
- [ ] Note calculator limitations (e.g., doesn't handle deductions, simplified approximations)

---

## Step 2: Assess Complexity

| Level    | Characteristics                                       | Approach                 | Examples |
| -------- | ----------------------------------------------------- | ------------------------ | -------- |
| Simple   | No income tax or flat tax                             | Pure YAML, minimal nodes | UAE, SG, HK |
| Moderate | Progressive brackets + contributions                  | Pure YAML                | NL, AU, IE, UK |
| High     | Multi-level regions or special calculations           | YAML + lookups           | CH, US, CA, ES |
| Complex  | Income splitting, family quotient, complex formulas   | Use `function` node      | DE, FR |

### 🚨 **Multi-Level Taxation Warning**

Countries with federal + state/provincial/cantonal taxation are **HIGH RISK** for errors:
- US (50 states), CA (13 provinces), CH (26 cantons), ES (17 autonomous communities), IT (20 regions)
- Each level needs **separate verification**
- Test vectors must **explicitly state** which region/state
- **Extra scrutiny** on how levels combine

**Common errors in multi-level configs:**
- Using flat effective rate instead of progressive brackets (CH 2026)
- Missing regional variations (DE Saxony care insurance)
- Wrong system for regions (CA Quebec QPP vs CPP)

---

## Step 3: Create base.yaml

### Year-Over-Year Change Detection

**🚨 COPYING FROM PREVIOUS YEAR? STOP AND VERIFY:**

If creating year N from year N-1:
1. **Research what changed** - Don't assume identical
2. **Check official sources** for year N specifically
3. **Document changes** in meta.notes
4. **Update ALL affected parameters**

**Common year-over-year changes:**
- Tax bracket inflation adjustments (thresholds increase ~1-3%)
- Rate changes (rare but critical - IT 2024→2025 was complete system change)
- Social security caps (usually increase annually)
- Credit/deduction amounts (may increase or phase out)
- New legislation (e.g., US TCJA expiration, IT cuneo fiscale switch)

**Example - Italy 2024→2025 disaster:**
Config blindly assumed 2024 INPS cut system carried forward to 2025.
Reality: Italy completely replaced it with cuneo fiscale tax-based system.
Result: 674% marginal rate bug, massive welfare cliffs.

### Template Structure

```yaml
meta:
  country: "xx"
  year: 2025
  currency: "XXX"
  version: "1.0.0"
  sources:
    - url: "https://official-gov-site/tax-calculator"  # REQUIRED
      description: "Official [Country] tax calculator"
      retrieved_at: "2025-01-15"
    - url: "https://official-gov-site/tax-rates"
      description: "Official statutory rates for 2025"
      retrieved_at: "2025-01-15"
  updated_at: "2025-01-15"
  notes: |
    [Country] tax system for [year].

    Key changes from [previous year]:
    - [List specific changes or state "No changes from YYYY"]

    Multi-level taxation: [Describe if applicable]

notices:
  - id: "salary_input"
    title: "Annual Gross Salary"
    body: "Enter total annual salary before deductions."
    severity: "info"

inputs:
  gross_annual:
    type: number
    required: true
    min: 0
    label: "Annual Gross Salary"

  filing_status:
    type: enum
    required: true
    default: "single"
    options:
      single:
        label: "Single"
        description: "Unmarried individual"

parameters:
  # Tax brackets
  # Social security rates and caps
  # Credit amounts

calculations:
  # Social security contributions first
  # Then deductions
  # Then taxable income
  # Then income tax
  # Then credits
  # Finally net

outputs:
  gross: "@gross_annual"
  net: "$net_annual"
  effective_rate: [...]
  breakdown:
    taxes: [...]
    contributions: [...]
```

---

## Step 4: Write Test Vectors

### 🔴 **CRITICAL - Test Vector Independence Rule**

**Test vectors MUST NEVER be derived from the engine itself.**

**✅ ACCEPTABLE SOURCES:**
1. **Official government tax calculator** (best)
2. **Deterministic Python script** implementing official formula + verified against official calculator
3. **Official tax tables** (for simple bracket calculations)
4. **Authoritative references** (PwC Tax Summaries, Big 4 firm guides) + verified

**❌ FORBIDDEN SOURCES:**
1. The engine's calculation (creates circular dependency)
2. Mental math or LLM arithmetic
3. Third-party comparison calculators (talent.com, moneyland.ch, etc.)
4. "Verified against previous year test vector" (unless previous year was externally verified)

**Why this matters:**
- If test vectors come from engine, fixing an engine bug breaks all tests
- Tests become useless as independent validation
- Example: CA Quebec tests passed despite wrong config because tests were derived from engine

### Test Vector Creation Process

1. **Use official government calculator**
   - Input gross salary, filing status, region
   - Record EXACT net result
   - Screenshot or document URL + date

2. **Create Python verification script** (optional but recommended)
   - Implement official formula independently
   - Cross-verify against government calculator
   - Use script to generate expected values

3. **Document source in test vector**
   ```json
   "sources": [{
     "description": "Verified via [Official Calculator Name]",
     "url": "https://official-calculator-url",
     "date": "2025-01-15",
     "notes": "Input: €60,000 gross, single → Net: €45,234"
   }]
   ```

### Test Vector Coverage (Minimum Required)

- [ ] **Below threshold** - Income with zero or minimal tax
- [ ] **Low income** - First tax bracket
- [ ] **Median income** - Middle bracket (~50-80k equivalent)
- [ ] **High income** - Top bracket
- [ ] **Each filing status** - Single, married, etc.
- [ ] **Regional variations** - If applicable (different states/provinces)
- [ ] **Deduction scenarios** - Baseline + each deduction type
- [ ] **Variant scenarios** - One test per variant config

### Progressive Tax Bracket Validation

For progressive tax systems, include **marginal rate validation**:
- Engine automatically tests that marginal rates don't exceed 100% (impossible)
- Helps catch flat-rate-instead-of-progressive bugs
- Example: CH 2026 had 220% marginal rate → caught flat rate error

---

## Step 5: Run Test Suite & Debug

```bash
# Run all config tests
npm run test:configs

# Run specific country/year
npm run test:configs -- -t "xx/2025"
```

### Common Failures & Root Causes

**"Impossible marginal rate of 674%" → Progressive vs Flat Rate Bug**
- Test vector assumes flat effective rate
- Engine correctly uses progressive brackets
- Fix: Recalculate test vector with progressive brackets

**"Net expected 45,000 got 43,000" → Missing Component**
- Often missing social security contribution type
- Example: CA Quebec missing QPIP (€346/year error)
- Fix: Research all contribution types thoroughly

**"Reference not found: $node_id" → Typo or Missing Node**
- Check spelling of node IDs (case-sensitive)
- Verify node is defined before it's referenced

---

## Step 6: Document

Final checklist:
- [ ] All sources are official government URLs
- [ ] meta.notes documents year-over-year changes
- [ ] Notices explain country-specific conventions
- [ ] All enum options have descriptions
- [ ] Source retrieval dates within last 6 months

---

## Step 7: External Verification Protocol (MANDATORY)

**🚨 ALL CONFIGS MUST BE EXTERNALLY VERIFIED**

Even if tests pass, configs MUST undergo 3-layer verification to ensure test vectors weren't self-derived.

### Layer 1: Arithmetic Verification

**Create Python verification script:**
```python
# verify-[country]-[year]-arithmetic.py
def verify_social_security(gross, rates, caps):
    """Implement official formula independently"""
    # Calculate each contribution using official rates
    # Compare against test vector breakdown values
    pass
```

**What to verify:**
- Social security contributions (simple rate × min(gross, cap))
- Tax credits with phaseouts
- Any arithmetic that can be independently calculated

**Pass criteria:** All values within rounding tolerance (±€1 or 0.01%)

### Layer 2: Official Government Calculator

**Use official calculator to verify:**
- Navigate to official government tax calculator
- Input test vector parameters (gross, filing status, region)
- Record exact net result
- Compare against test vector expected values

**Tools:**
- Playwright automation (preferred for bulk verification)
- Manual verification (acceptable for <5 vectors)
- Screenshot documentation (recommended)

**Pass criteria:** Net income within tolerance (usually ±€50 or 1%)

### Layer 3: Cross-Verification

**For multi-level taxation:**
- Verify each level separately
- Federal calculator + state/provincial calculator
- Ensure levels combine correctly

**For complex cases:**
- Use multiple sources (2-3 different calculators)
- Check marginal rate discontinuities
- Validate edge cases (cap thresholds, phaseout zones)

**Pass criteria:** Consistent results across multiple sources

### Verification Report

Create `reports/[COUNTRY]-[YEAR]-VERIFICATION.md`:

```markdown
# [Country] [Year] External Verification Report

**Date:** YYYY-MM-DD
**Verifier:** [Agent/Human]
**Status:** ✅ VERIFIED / ⚠️ ISSUES FOUND / ❌ FAILED

## Verification Summary

- Test vectors: X/X verified ✅
- Layer 1 (Arithmetic): PASS/FAIL
- Layer 2 (Official Calculator): PASS/FAIL
- Layer 3 (Cross-Verification): PASS/FAIL

## Methodology

### Layer 1: Arithmetic Verification
[Python script details]

### Layer 2: Official Calculator
[Calculator URL, test results]

### Layer 3: Cross-Verification
[Additional sources used]

## Findings

### Issues Found
[Document any bugs, missing components, wrong rates]

### Corrections Made
[Document fixes applied]

## Sources

- Official calculator: [URL]
- Statutory rates: [URL]
- Verification script: scripts/verify-[country]-[year].py

## Conclusion

[Summary statement on verification status]
```

---

## Creating Variants

For expat regimes, special tax treatments:

```yaml
meta:
  variant: "regime-name"
  label: "Human Readable Name"
  description: "Who qualifies and what it provides"
  base: "../base.yaml"
  sources:
    - url: "https://official-source-for-regime"
      description: "Official regime documentation"
      retrieved_at: "2025-01-15"

# Override or add parameters/calculations
# Use matching node IDs to replace base calculations
```

**Variant test vectors:**
- Must verify eligibility criteria
- Must verify regime-specific benefits
- Must have own external verification

---

## Completion Checklist

Before marking config as complete:

### Research Phase
- [ ] Found official government tax calculator
- [ ] Documented all sources with URLs and dates
- [ ] Checked for year-over-year legislative changes
- [ ] Researched social security complexity (multiple caps, progressive rates, regional variations)

### Implementation Phase
- [ ] base.yaml created with all calculations
- [ ] All nodes have category and label (for breakdown)
- [ ] All `@` and `$` references resolve correctly
- [ ] Multi-level taxation (if applicable) properly separated

### Test Vector Phase
- [ ] Test vectors cover low/median/high income
- [ ] Test vectors cover all filing statuses
- [ ] Test vectors cover regional variations (if applicable)
- [ ] **CRITICAL:** All test vectors sourced from official calculator (documented in sources field)
- [ ] **CRITICAL:** NO test vectors derived from engine or self-calculated

### Validation Phase
- [ ] `npm run test:configs` shows 100% passing
- [ ] Marginal rate tests pass (no impossible >100% rates)
- [ ] No circular dependencies (test vectors independent of engine)

### External Verification Phase (MANDATORY)
- [ ] Layer 1 (Arithmetic): Python script created and passing
- [ ] Layer 2 (Official Calculator): All test vectors verified
- [ ] Layer 3 (Cross-Verification): Edge cases validated
- [ ] Verification report written to reports/[COUNTRY]-[YEAR]-VERIFICATION.md

### Documentation Phase
- [ ] meta.sources lists official government sources only
- [ ] meta.notes documents year-over-year changes
- [ ] Notices explain country conventions
- [ ] guides/countries/[country].md updated

### Final Validation
- [ ] Run full test suite: `npm run test:configs`
- [ ] All tests passing
- [ ] Verification report shows ✅ VERIFIED status

---

## Red Flags & Common Mistakes

**🚨 STOP if you see these patterns:**

1. **"Calculated using official rates..."** in test vector source
   → Self-derived, not externally verified

2. **Third-party calculator URLs** (moneyland.ch, talent.com, nerdwallet.com)
   → Not authoritative, use official government only

3. **"Verified against previous year"** without documenting changes
   → Blind copy may miss legislative changes

4. **Marginal rate validation failures** (>100% or <0%)
   → Likely flat rate assumption or wrong tax system

5. **Test vectors with no sources field**
   → Cannot verify independence

6. **Multi-level taxation with single flat rate**
   → Likely oversimplification, verify each level separately

7. **Social security with single cap for all contributions**
   → Often wrong, different contributions have different caps

8. **Copying config from year N-1 to year N without research**
   → May miss significant legislative changes (IT 2024→2025)

---

## Examples of Past Errors (Learn From These)

### ❌ **Switzerland 2026 - Flat Rate Assumption**
- **Error:** Test vectors assumed 8% flat cantonal rate
- **Reality:** Progressive cantonal brackets (8% then 12%)
- **Impact:** 3 test failures, 220% marginal rate bug
- **Lesson:** Always verify progressive vs flat

### ❌ **Italy 2024→2025 - Wrong System**
- **Error:** Implemented 2024 INPS cut system in 2025 config
- **Reality:** 2025 switched to cuneo fiscale tax-based system
- **Impact:** 674% marginal rate, €2,071 welfare cliff
- **Lesson:** Research year-over-year changes, don't assume continuity

### ❌ **Canada 2025 Quebec - Test Vectors from Engine**
- **Error:** Test vectors derived from engine (which used CPP not QPP)
- **Reality:** Quebec uses QPP 6.40% + QPIP, not CPP 5.95%
- **Impact:** Tests passed but config was €428/year wrong
- **Lesson:** Test vectors MUST be externally verified

### ❌ **Switzerland 2026 - Missing ALV Solidarity**
- **Error:** Only implemented ALV 1.1% up to cap
- **Reality:** ALV is 1.1% up to cap, then 0.5% above
- **Impact:** High earners underpaying unemployment insurance
- **Lesson:** Social security often has progressive rates/additional contributions

---

## References

- **Formal Schema:** `packages/schema/src/config-types.ts` (source of truth)
- **Example Configs:** `configs/nl/2026/`, `configs/de/2025/`, `configs/gb/2026/`
- **Verification Examples:** `reports/NL-2026-VERIFICATION.md`, `reports/DE-2025-VERIFICATION-SUMMARY.md`
- **Research Guide:** `references/country-tax-research.md`
