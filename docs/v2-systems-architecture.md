# V2 Systems Architecture Analysis

## Executive Summary

**Complexity Assessment: Medium-High**

Building the v2 "Financial Move Companion" requires:
- **7 new backend services/modules**
- **12 new frontend components**
- **4 external data integrations**
- **3-4 new database schemas**
- **Estimated effort: 6-9 months with 2-3 engineers**

The good news: Current architecture is well-designed and extensible. Most v2 features are **additive** rather than requiring rewrites.

---

## Current Architecture (V1)

### What We Have

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js App (Cloudflare Workers)         │
│  ┌────────────────────────────────────────────────────┐    │
│  │  UI Layer (shadcn/ui)                              │    │
│  │  - country-column.tsx (single calculator)          │    │
│  │  - comparison-grid.tsx (multi-country)             │    │
│  │  - result-breakdown.tsx (tax breakdown display)    │    │
│  │  - salary-range-chart.tsx (visualizations)         │    │
│  └────────────────────────────────────────────────────┘    │
│                          ↓                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │  API Layer                                          │    │
│  │  POST /api/calc - Calculate net salary             │    │
│  │  GET  /api/calc?action=countries                   │    │
│  │  GET  /api/calc?action=years                       │    │
│  │  GET  /api/calc?action=variants                    │    │
│  │  GET  /api/calc?action=inputs                      │    │
│  └────────────────────────────────────────────────────┘    │
│                          ↓                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │  packages/engine (Pure TypeScript)                 │    │
│  │  - CalculationEngine.calculate()                   │    │
│  │  - ConfigLoader (YAML loader)                      │    │
│  │  - evaluators.ts (node evaluators)                 │    │
│  │  - functions.ts (escape hatch)                     │    │
│  └────────────────────────────────────────────────────┘    │
│                          ↓                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │  YAML Configs (Static, bundled)                    │    │
│  │  configs/nl/2025/base.yaml                         │    │
│  │  configs/nl/2025/variants/30-ruling.yaml           │    │
│  │  configs/nl/2025/tests/*.json                      │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

**Current Capabilities:**
- ✅ Single-point-in-time tax calculation
- ✅ Multi-country comparison (side-by-side)
- ✅ Variant support (30% ruling, expat regimes)
- ✅ Regional tax layers (federal/canton/municipal)
- ✅ Breakdown by category (income_tax, contribution, credit)
- ✅ Config-driven, community-maintainable
- ✅ Fast (Cloudflare Workers, <100ms p95)
- ✅ No backend persistence (stateless)

**Current Limitations:**
- ❌ No multi-year projections
- ❌ No life event modeling
- ❌ No cost of living data
- ❌ No scenario comparison
- ❌ No user accounts / saved calculations
- ❌ No wealth/capital gains taxation
- ❌ No budget planning
- ❌ No personalization

---

## V2 Architecture: New Components

### Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                           │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  NEW: Guided Onboarding                                │     │
│  │  NEW: Timeline Builder (life events)                   │     │
│  │  NEW: Scenario Comparison Matrix                       │     │
│  │  NEW: Budget Builder UI                                │     │
│  │  NEW: Multi-Year Charts                                │     │
│  │  Existing: Calculator, Comparison                      │     │
│  └────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                     API Layer (Next.js Routes)                   │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  Existing: POST /api/calc (single calculation)         │     │
│  │  NEW: POST /api/scenario/calculate (multi-year)        │     │
│  │  NEW: POST /api/scenario/save                          │     │
│  │  NEW: GET  /api/scenario/:id                           │     │
│  │  NEW: POST /api/cost-of-living (fetch COL data)        │     │
│  │  NEW: POST /api/wealth/calculate (wealth tax)          │     │
│  │  NEW: GET  /api/user/scenarios (list user scenarios)   │     │
│  └────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                     Service Layer (New)                          │
│  ┌────────────────┬──────────────────┬─────────────────────┐    │
│  │ ScenarioEngine │ CostOfLivingAPI  │ WealthCalculator    │    │
│  │ (multi-year)   │ (external data)  │ (capital gains)     │    │
│  └────────────────┴──────────────────┴─────────────────────┘    │
│  ┌────────────────┬──────────────────┬─────────────────────┐    │
│  │ LifeEventModel │ PortfolioSim     │ ReportGenerator     │    │
│  │ (events→impact)│ (wealth growth)  │ (PDF export)        │    │
│  └────────────────┴──────────────────┴─────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                  Existing: CalculationEngine                     │
│  (No changes needed - used by ScenarioEngine year-by-year)      │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                     Data Layer                                   │
│  ┌─────────────────┬──────────────────┬────────────────────┐    │
│  │ Cloudflare D1   │ Workers KV       │ External APIs      │    │
│  │ (user data)     │ (cache COL data) │ (Numbeo, etc.)     │    │
│  │                 │                  │                    │    │
│  │ - users         │ - cost_of_living │ - Numbeo API       │    │
│  │ - scenarios     │ - fx_rates       │ - Expatistan API   │    │
│  │ - profiles      │                  │ - Exchange rates   │    │
│  └─────────────────┴──────────────────┴────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Detailed Component Breakdown

### 1. ScenarioEngine (NEW - Core Service)

**Purpose:** Multi-year, multi-event calculation orchestrator

**Complexity: MEDIUM-HIGH**

```typescript
class ScenarioEngine {
  constructor(
    private calculationEngine: CalculationEngine,
    private lifeEventModel: LifeEventModel,
    private portfolioSimulator: PortfolioSimulator
  ) {}

  /**
   * Calculate a scenario across multiple years
   */
  async calculateScenario(scenario: Scenario): Promise<ScenarioResult> {
    const yearlyResults: YearResult[] = []

    // Initialize state
    let portfolioValue = scenario.initial_portfolio
    let context = this.buildInitialContext(scenario)

    // Iterate through years
    for (let year = scenario.start_year; year <= scenario.end_year; year++) {
      // Apply life events for this year
      const eventsThisYear = scenario.events.filter(e => e.year === year)
      for (const event of eventsThisYear) {
        context = this.lifeEventModel.applyEvent(event, context)
      }

      // Update income (career trajectory)
      const grossIncome = this.calculateIncomeForYear(
        scenario.base_income,
        scenario.income_growth,
        year - scenario.start_year
      )

      // Calculate taxes for this year
      const taxResult = await this.calculationEngine.calculate({
        ...context.inputs,
        gross_annual: grossIncome,
      })

      // Calculate portfolio growth
      const monthlySavings = (taxResult.net - context.living_expenses) / 12
      portfolioValue = this.portfolioSimulator.calculateYearlyGrowth(
        portfolioValue,
        monthlySavings,
        scenario.investment_returns
      )

      // Calculate wealth tax if applicable
      const wealthTax = await this.wealthCalculator.calculate(
        portfolioValue,
        scenario.country,
        year
      )

      yearlyResults.push({
        year,
        gross_income: grossIncome,
        net_income: taxResult.net,
        taxes_paid: taxResult.gross - taxResult.net,
        wealth_tax: wealthTax,
        portfolio_value: portfolioValue,
        disposable_income: taxResult.net - context.living_expenses,
        events: eventsThisYear,
      })

      // Update context for next year
      context = this.updateContextForNextYear(context, taxResult)
    }

    return {
      scenario_id: scenario.id,
      years: yearlyResults,
      summary: this.generateSummary(yearlyResults),
    }
  }
}
```

**What it does:**
- Orchestrates multi-year calculations
- Applies life events at appropriate years
- Tracks portfolio growth year-over-year
- Handles income growth trajectories
- Calculates wealth tax based on accumulated portfolio
- Maintains context across years (married status, children, etc.)

**Dependencies:**
- ✅ Existing: `CalculationEngine` (no changes)
- 🆕 New: `LifeEventModel`
- 🆕 New: `PortfolioSimulator`
- 🆕 New: `WealthCalculator`

**Effort:** 3-4 weeks (1 engineer)

---

### 2. LifeEventModel (NEW - Service)

**Purpose:** Define how life events impact tax calculations

**Complexity: MEDIUM**

```typescript
interface LifeEvent {
  id: string
  year: number
  type: 'marriage' | 'child_birth' | 'home_purchase' | 'inheritance' | 'job_change'
  data: Record<string, unknown>
}

class LifeEventModel {
  /**
   * Apply a life event to the calculation context
   */
  applyEvent(event: LifeEvent, context: CalculationContext): CalculationContext {
    switch (event.type) {
      case 'marriage':
        return {
          ...context,
          inputs: {
            ...context.inputs,
            filing_status: 'married',
            spouse_income: event.data.spouse_income || 0,
          },
        }

      case 'child_birth':
        return {
          ...context,
          inputs: {
            ...context.inputs,
            dependents: (context.inputs.dependents as number || 0) + 1,
          },
          living_expenses: context.living_expenses + this.getChildcareCost(
            event.data.childcare_type as string,
            context.country,
            context.region
          ),
        }

      case 'home_purchase':
        return {
          ...context,
          inputs: {
            ...context.inputs,
            homeowner: true,
            mortgage_interest: event.data.mortgage_interest,
          },
          living_expenses: context.living_expenses
            - context.rent
            + (event.data.mortgage_payment as number),
        }

      case 'inheritance':
        // Inheritance tax calculation (complex, country-specific)
        const inheritanceTax = this.calculateInheritanceTax(
          event.data.amount as number,
          context.country,
          context.year
        )
        return {
          ...context,
          portfolio_value: context.portfolio_value
            + (event.data.amount as number)
            - inheritanceTax,
        }

      case 'job_change':
        return {
          ...context,
          inputs: {
            ...context.inputs,
            gross_annual: event.data.new_salary,
            employment_type: event.data.employment_type || 'employee',
          },
        }
    }
  }

  /**
   * Get country-specific childcare costs
   */
  private getChildcareCost(
    type: string,
    country: string,
    region: string
  ): number {
    // Lookup from cost-of-living data
    return this.costOfLivingAPI.getChildcareCost(country, region, type)
  }
}
```

**Data Requirements:**
- Event definitions (schema)
- Impact mappings (event type → context changes)
- Country-specific life event costs (childcare, etc.)

**Effort:** 2-3 weeks (1 engineer)

---

### 3. CostOfLivingService (NEW - Service)

**Purpose:** Fetch and cache cost-of-living data from external APIs

**Complexity: MEDIUM**

```typescript
interface CostOfLivingData {
  country: string
  city: string
  rent_1br_center: number
  rent_1br_outside: number
  rent_3br_center: number
  rent_3br_outside: number
  healthcare_monthly: number
  childcare_monthly: number
  transportation_monthly: number
  food_monthly: number
  utilities_monthly: number
  last_updated: string
}

class CostOfLivingService {
  constructor(
    private kvStore: KVNamespace,
    private externalAPIs: {
      numbeo: NumbeoAPI
      expatistan: ExpatistanAPI
    }
  ) {}

  /**
   * Get cost of living data (cached with 30-day TTL)
   */
  async getCostOfLiving(
    country: string,
    city: string
  ): Promise<CostOfLivingData> {
    const cacheKey = `col:${country}:${city}`

    // Check cache
    const cached = await this.kvStore.get<CostOfLivingData>(
      cacheKey,
      { type: 'json' }
    )

    if (cached && this.isFresh(cached.last_updated, 30)) {
      return cached
    }

    // Fetch from external APIs (fallback chain)
    let data: CostOfLivingData | null = null

    try {
      data = await this.externalAPIs.numbeo.getCityData(city, country)
    } catch (e) {
      console.warn('Numbeo API failed, trying Expatistan')
      try {
        data = await this.externalAPIs.expatistan.getCityData(city, country)
      } catch (e2) {
        // Use fallback hardcoded averages
        data = this.getFallbackData(country, city)
      }
    }

    // Cache for 30 days
    await this.kvStore.put(cacheKey, JSON.stringify(data), {
      expirationTtl: 60 * 60 * 24 * 30, // 30 days
    })

    return data
  }

  /**
   * Get breakdown for specific situation
   */
  async getBudget(
    country: string,
    city: string,
    familySize: number,
    housingType: 'apartment_1br' | 'apartment_3br' | 'house'
  ): Promise<BudgetBreakdown> {
    const col = await this.getCostOfLiving(country, city)

    const rent = housingType === 'apartment_1br'
      ? col.rent_1br_center
      : col.rent_3br_center

    const healthcare = col.healthcare_monthly * familySize
    const childcare = familySize > 2 ? col.childcare_monthly * (familySize - 2) : 0
    const food = col.food_monthly * Math.sqrt(familySize) // economies of scale

    return {
      rent,
      healthcare,
      childcare,
      transportation: col.transportation_monthly,
      food,
      utilities: col.utilities_monthly,
      total: rent + healthcare + childcare + col.transportation_monthly + food + col.utilities_monthly,
    }
  }
}
```

**External API Integrations:**

1. **Numbeo API** (Primary)
   - Coverage: 9000+ cities worldwide
   - Cost: ~$30/month for 10k requests
   - Data freshness: Community-updated (weekly)
   - Reliability: Good

2. **Expatistan API** (Fallback)
   - Coverage: 2000+ cities
   - Cost: Free tier (500 requests/month)
   - Data freshness: Monthly
   - Reliability: Medium

3. **Manual Fallbacks** (Last resort)
   - Curated list of 100 major cities
   - Updated quarterly by team
   - Sources: Government statistics, OECD

**Caching Strategy:**
- Workers KV: 30-day TTL for city data
- CDN cache: 7-day TTL for API responses
- Background refresh: Weekly cron job to warm cache

**Effort:** 2-3 weeks (1 engineer)

---

### 4. WealthCalculator (NEW - Service)

**Purpose:** Calculate wealth tax, capital gains tax, investment income tax

**Complexity: MEDIUM-HIGH**

```typescript
class WealthCalculator {
  /**
   * Calculate annual wealth tax
   */
  async calculateWealthTax(
    netWorth: number,
    country: string,
    region: string,
    year: number
  ): Promise<number> {
    // Load wealth tax config (similar to income tax configs)
    const config = await this.configLoader.loadWealthTaxConfig(
      country,
      year,
      region
    )

    if (!config) return 0 // No wealth tax in this jurisdiction

    // Apply exemptions
    const taxableWealth = Math.max(0, netWorth - config.exemption)

    // Bracket calculation (similar to income tax)
    return this.applyBrackets(taxableWealth, config.brackets)
  }

  /**
   * Calculate capital gains tax on realized gains
   */
  async calculateCapitalGainsTax(
    realizedGains: number,
    holdingPeriod: number, // days
    country: string,
    year: number
  ): Promise<number> {
    const config = await this.configLoader.loadCapitalGainsConfig(country, year)

    // Check for long-term vs short-term rates
    const isLongTerm = holdingPeriod >= (config.long_term_threshold || 365)
    const rate = isLongTerm ? config.long_term_rate : config.short_term_rate

    // Apply exemptions (e.g., €1000 in Germany)
    const taxableGains = Math.max(0, realizedGains - config.annual_exemption)

    return taxableGains * rate
  }
}
```

**New YAML Configs Required:**

```yaml
# configs/ch/2025/wealth-tax.yaml
meta:
  country: ch
  year: 2025
  type: wealth_tax

parameters:
  # Varies by canton
  exemptions_by_canton:
    ZH: 100000  # First 100k exempt
    GE: 0       # No exemption
    ZG: 200000  # Very high exemption

  brackets_by_canton:
    ZH:
      - threshold: 0
        rate: 0.002  # 0.2%
      - threshold: 1000000
        rate: 0.003
    GE:
      - threshold: 0
        rate: 0.005  # Higher rate, no exemption
```

**Effort:** 3-4 weeks (1 engineer)
- 2 weeks: Core logic
- 1-2 weeks: Config creation for 10 countries

---

### 5. PortfolioSimulator (NEW - Service)

**Purpose:** Model investment growth and returns

**Complexity: LOW-MEDIUM**

```typescript
class PortfolioSimulator {
  /**
   * Calculate portfolio value after one year
   */
  calculateYearlyGrowth(
    currentValue: number,
    monthlyContribution: number,
    annualReturn: number
  ): number {
    let value = currentValue
    const monthlyReturn = annualReturn / 12

    for (let month = 0; month < 12; month++) {
      value = value * (1 + monthlyReturn) + monthlyContribution
    }

    return value
  }

  /**
   * Calculate compound growth over multiple years
   */
  projectGrowth(
    initialValue: number,
    monthlyContributions: number[],
    annualReturns: number[]
  ): number[] {
    const values: number[] = [initialValue]

    for (let i = 0; i < monthlyContributions.length; i++) {
      const newValue = this.calculateYearlyGrowth(
        values[i],
        monthlyContributions[i],
        annualReturns[i]
      )
      values.push(newValue)
    }

    return values
  }

  /**
   * Monte Carlo simulation (Phase 3)
   */
  monteCarloSimulation(
    initialValue: number,
    monthlyContribution: number,
    years: number,
    iterations: number = 1000
  ): SimulationResult {
    // Not needed for MVP
  }
}
```

**Effort:** 1 week (1 engineer)

---

### 6. Database Schema (NEW - Cloudflare D1)

**Purpose:** Store user accounts, scenarios, profiles

**Complexity: LOW**

```sql
-- users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  subscription_tier TEXT DEFAULT 'free',
  subscription_expires_at INTEGER
);

CREATE INDEX idx_users_email ON users(email);

-- scenarios table
CREATE TABLE scenarios (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,

  -- Scenario configuration (JSON)
  config TEXT NOT NULL, -- JSON blob

  -- Metadata
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_calculated_at INTEGER,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_scenarios_user_id ON scenarios(user_id);
CREATE INDEX idx_scenarios_updated_at ON scenarios(updated_at);

-- scenario_results table (cached calculations)
CREATE TABLE scenario_results (
  id TEXT PRIMARY KEY,
  scenario_id TEXT NOT NULL,

  -- Results (JSON)
  results TEXT NOT NULL, -- JSON blob of ScenarioResult

  calculated_at INTEGER NOT NULL,

  FOREIGN KEY (scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE
);

CREATE INDEX idx_scenario_results_scenario_id ON scenario_results(scenario_id);

-- user_profiles table (personalization)
CREATE TABLE user_profiles (
  user_id TEXT PRIMARY KEY,

  -- Demographics
  age INTEGER,
  family_status TEXT,
  dependents INTEGER,

  -- Financial
  net_worth_range TEXT,

  -- Location
  current_country TEXT,
  current_city TEXT,

  -- Preferences
  default_currency TEXT,

  updated_at INTEGER NOT NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Effort:** 1 week (migrations, ORM setup, CRUD operations)

---

### 7. Authentication (NEW - Cloudflare Access / Clerk)

**Purpose:** User accounts, session management

**Complexity: LOW (using third-party service)**

**Options:**

1. **Clerk** (Recommended)
   - Drop-in React components
   - OAuth (Google, GitHub)
   - Email magic links
   - Cost: Free tier (10k MAU)
   - Effort: 3-5 days

2. **Auth0**
   - More enterprise features
   - Higher cost
   - Effort: 1 week

3. **Cloudflare Access**
   - Native Cloudflare integration
   - Limited UI customization
   - Effort: 1 week

**Recommendation:** Clerk for MVP

**Effort:** 3-5 days (integration + UI)

---

### 8. Frontend Components (NEW)

#### 8.1 Guided Onboarding Wizard

**Complexity: MEDIUM**

```typescript
// components/onboarding/guided-wizard.tsx
const GuidedWizard = () => {
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState<OnboardingData>({})

  const steps = [
    <CurrentSituationStep />,     // Current location, salary, family
    <TargetLocationStep />,       // Where considering moving
    <FinancialContextStep />,     // Net worth, savings, portfolio
    <LifePlansStep />,            // Future life events
    <SummaryStep />,              // Review and generate report
  ]

  return (
    <div className="wizard-container">
      <ProgressBar current={step} total={steps.length} />
      {steps[step]}
      <WizardNavigation
        onBack={() => setStep(step - 1)}
        onNext={() => setStep(step + 1)}
      />
    </div>
  )
}
```

**Effort:** 2-3 weeks (1 engineer)

#### 8.2 Timeline Builder

**Complexity: HIGH**

```typescript
// components/scenario/timeline-builder.tsx
const TimelineBuilder = () => {
  const [events, setEvents] = useState<LifeEvent[]>([])
  const [selectedYear, setSelectedYear] = useState<number>(2026)

  return (
    <div className="timeline-container">
      {/* Horizontal timeline */}
      <div className="timeline-axis">
        {years.map(year => (
          <YearMarker
            key={year}
            year={year}
            events={events.filter(e => e.year === year)}
            onClick={() => setSelectedYear(year)}
          />
        ))}
      </div>

      {/* Drag-and-drop event palette */}
      <EventPalette
        onDragStart={(eventType) => handleDragStart(eventType)}
      />

      {/* Event details panel */}
      {selectedYear && (
        <EventDetailsPanel
          year={selectedYear}
          events={events.filter(e => e.year === selectedYear)}
          onAddEvent={handleAddEvent}
        />
      )}
    </div>
  )
}
```

**UI Libraries needed:**
- `@dnd-kit/core` for drag-and-drop
- `recharts` for timeline visualization
- Custom components for event cards

**Effort:** 3-4 weeks (1 engineer)

#### 8.3 Scenario Comparison Matrix

**Complexity: MEDIUM**

```typescript
// components/scenario/comparison-matrix.tsx
const ScenarioComparisonMatrix = ({ scenarios }: { scenarios: Scenario[] }) => {
  return (
    <div className="comparison-matrix">
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            {scenarios.map(s => (
              <th key={s.id}>{s.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <MetricRow
            label="Total Net Income (5y)"
            values={scenarios.map(s => s.summary.total_net_income)}
            format="currency"
          />
          <MetricRow
            label="Total Taxes Paid (5y)"
            values={scenarios.map(s => s.summary.total_taxes)}
            format="currency"
            heatmap="reverse" // Lower is better
          />
          <MetricRow
            label="Final Portfolio Value"
            values={scenarios.map(s => s.summary.final_portfolio_value)}
            format="currency"
          />
          {/* ... more metrics */}
        </tbody>
      </table>
    </div>
  )
}
```

**Effort:** 1-2 weeks (1 engineer)

#### 8.4 Budget Builder

**Complexity: MEDIUM**

```typescript
// components/budget/budget-builder.tsx
const BudgetBuilder = ({ city, country }: BudgetBuilderProps) => {
  const { data: colData } = useCostOfLiving(city, country)
  const [budget, setBudget] = useState<Budget>(getDefaultBudget(colData))

  return (
    <div className="budget-builder">
      <BudgetCategory
        name="Housing"
        value={budget.rent}
        benchmark={colData.rent_1br_center}
        benchmarkRange={[colData.rent_1br_outside, colData.rent_3br_center]}
        onChange={(v) => setBudget({ ...budget, rent: v })}
      />

      <BudgetCategory
        name="Healthcare"
        value={budget.healthcare}
        benchmark={colData.healthcare_monthly}
        onChange={(v) => setBudget({ ...budget, healthcare: v })}
      />

      {/* ... more categories */}

      <SankeyDiagram
        income={netIncome}
        expenses={budget}
        savings={netIncome - totalExpenses}
      />
    </div>
  )
}
```

**Effort:** 2 weeks (1 engineer)

#### 8.5 Multi-Year Charts

**Complexity: MEDIUM**

```typescript
// components/charts/multi-year-chart.tsx
const MultiYearChart = ({ scenarios }: { scenarios: ScenarioResult[] }) => {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={combineScenarioData(scenarios)}>
        <XAxis dataKey="year" />
        <YAxis />
        <Tooltip />
        <Legend />

        {scenarios.map((scenario, idx) => (
          <Line
            key={scenario.scenario_id}
            type="monotone"
            dataKey={`scenario_${idx}_net`}
            stroke={COLORS[idx]}
            name={scenario.scenario_name}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
```

**Effort:** 1 week (multiple chart types)

---

### 9. API Routes (NEW)

```typescript
// app/api/scenario/calculate/route.ts
export async function POST(request: NextRequest) {
  const scenario: Scenario = await request.json()

  const scenarioEngine = new ScenarioEngine(/* ... */)
  const result = await scenarioEngine.calculateScenario(scenario)

  return NextResponse.json(result)
}

// app/api/scenario/save/route.ts
export async function POST(request: NextRequest) {
  const { userId, scenario } = await request.json()

  // Save to D1
  const id = await db.scenarios.insert({
    user_id: userId,
    name: scenario.name,
    config: JSON.stringify(scenario),
  })

  return NextResponse.json({ id })
}

// app/api/cost-of-living/route.ts
export async function GET(request: NextRequest) {
  const { city, country } = request.nextUrl.searchParams

  const colService = new CostOfLivingService(/* ... */)
  const data = await colService.getCostOfLiving(country, city)

  return NextResponse.json(data)
}
```

**Effort:** 1-2 weeks (all endpoints)

---

## Data Flow Diagrams

### Single-Year Calculation (Existing - V1)

```
User Input (gross, country, year)
        ↓
    API /api/calc
        ↓
  ConfigLoader.loadConfig()
        ↓
  CalculationEngine.calculate()
        ↓
  Evaluate DAG nodes
        ↓
  Return breakdown
```

**Latency: <100ms**

---

### Multi-Year Scenario Calculation (New - V2)

```
User defines scenario (inputs + events + years)
        ↓
    API /api/scenario/calculate
        ↓
  ScenarioEngine.calculateScenario()
        ↓
  For each year:
    ├─ Apply life events (LifeEventModel)
    ├─ Fetch cost of living (CostOfLivingService + cache)
    ├─ Calculate income tax (CalculationEngine)
    ├─ Calculate wealth tax (WealthCalculator)
    ├─ Update portfolio (PortfolioSimulator)
    └─ Store yearly result
        ↓
  Return multi-year results
```

**Latency: 500ms - 2s** (depending on # of years)
- 10 years × 100ms/year = 1s + overhead

**Optimization:** Parallelize year calculations where possible (years without dependencies)

---

### Cost of Living Lookup

```
Request COL data for city
        ↓
Check Workers KV cache
        ↓
  Cache hit? → Return cached data
        ↓
  Cache miss:
    ├─ Try Numbeo API
    ├─ Fallback: Expatistan API
    └─ Fallback: Hardcoded data
        ↓
  Store in KV (30-day TTL)
        ↓
  Return data
```

**Latency:**
- Cache hit: <10ms
- Cache miss: 200-500ms (external API)

---

## Complexity Assessment by Component

| Component | Complexity | Effort | Dependencies | Risk |
|-----------|-----------|--------|--------------|------|
| ScenarioEngine | HIGH | 3-4 weeks | LifeEventModel, PortfolioSimulator | MEDIUM |
| LifeEventModel | MEDIUM | 2-3 weeks | CostOfLivingService | LOW |
| CostOfLivingService | MEDIUM | 2-3 weeks | External APIs, KV | MEDIUM (API reliability) |
| WealthCalculator | MEDIUM-HIGH | 3-4 weeks | New YAML configs | MEDIUM (config accuracy) |
| PortfolioSimulator | LOW | 1 week | None | LOW |
| Database (D1) | LOW | 1 week | Cloudflare D1 | LOW |
| Authentication | LOW | 3-5 days | Clerk/Auth0 | LOW |
| Timeline Builder UI | HIGH | 3-4 weeks | DND library | MEDIUM |
| Budget Builder UI | MEDIUM | 2 weeks | COL data | LOW |
| Scenario Matrix UI | MEDIUM | 1-2 weeks | None | LOW |
| Multi-Year Charts | MEDIUM | 1 week | Recharts | LOW |
| Guided Onboarding | MEDIUM | 2-3 weeks | None | LOW |
| API Routes | LOW | 1-2 weeks | All services | LOW |

**Total Effort:** ~25-35 weeks of engineering time

**With 2 engineers:** 12-18 weeks (3-4.5 months)
**With 3 engineers:** 8-12 weeks (2-3 months)

---

## Technical Challenges & Risks

### 1. External API Reliability (MEDIUM RISK)

**Challenge:** Cost of living APIs (Numbeo, Expatistan) may be unreliable or change pricing

**Mitigation:**
- Aggressive caching (30-day TTL)
- Multiple fallback providers
- Hardcoded data for top 100 cities
- Admin dashboard to monitor API health
- Budget $50-100/month for API costs

### 2. Multi-Year Calculation Performance (LOW RISK)

**Challenge:** 20-year scenarios across 5 countries = 100 calculations

**Mitigation:**
- Workers CPU limits are generous (50ms-500ms per request)
- Cache scenario results (only recalculate on input change)
- Parallelize independent year calculations
- Consider Durable Objects for long-running calculations (>10s)

### 3. Database Size Growth (LOW RISK)

**Challenge:** Each user with 10 scenarios × 20 years = lots of data

**Mitigation:**
- D1 has 10GB limit (plenty for 100k users)
- Store only scenario config, calculate results on-demand
- Cache results in KV for frequently accessed scenarios
- Archive old scenarios after 1 year of inactivity

### 4. YAML Config Maintenance (MEDIUM RISK)

**Challenge:** Wealth tax, capital gains configs for 15+ countries

**Mitigation:**
- Prioritize high-value countries (CH, NL, DE, US)
- Community contributions (same workflow as income tax)
- Clearly mark "beta" features with confidence indicators
- Partner with tax consultants for validation

### 5. Data Accuracy & Liability (HIGH RISK)

**Challenge:** Users making $100k+ life decisions based on our calculations

**Mitigation:**
- Prominent disclaimers ("not tax advice")
- Confidence indicators on all numbers
- "Verify with tax advisor" CTAs
- Link to official government sources
- Consider E&O insurance

---

## Technology Stack

### Backend

- **Runtime:** Cloudflare Workers (existing)
- **Database:** Cloudflare D1 (SQLite) - NEW
- **Cache:** Cloudflare Workers KV - existing + expanded usage
- **Auth:** Clerk (recommended) or Auth0 - NEW
- **File Storage:** R2 (for PDF exports) - NEW

### Frontend

- **Framework:** Next.js 14+ App Router (existing)
- **UI:** shadcn/ui (existing)
- **Charts:** Recharts (existing)
- **Forms:** React Hook Form + Zod - NEW
- **Drag-and-Drop:** @dnd-kit/core - NEW
- **State:** Zustand or Jotai (lightweight) - NEW

### External APIs

- **Cost of Living:** Numbeo API ($30/month) - NEW
- **Cost of Living Fallback:** Expatistan API (free tier) - NEW
- **Exchange Rates:** Exchangerate-API (free) - NEW

### Dev Tools

- **Testing:** Vitest (existing), Playwright (E2E) - NEW
- **CI/CD:** GitHub Actions (existing)
- **Monitoring:** Sentry (existing), Cloudflare Analytics
- **Payments:** Stripe (Phase 2) - NEW

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Cloudflare Global Network                  │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Workers (Next.js via OpenNext)                │    │
│  │  - SSR pages                                   │    │
│  │  - API routes                                  │    │
│  │  - Scenario calculations                       │    │
│  └────────────────────────────────────────────────┘    │
│                       ↓                                  │
│  ┌────────────┬─────────────┬────────────────────┐    │
│  │  D1 (SQLite)│  KV (Cache) │  R2 (Files)       │    │
│  │  - Users    │  - COL data │  - PDF exports    │    │
│  │  - Scenarios│  - FX rates │  - Report images  │    │
│  └────────────┴─────────────┴────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                       ↓
          ┌───────────────────────────┐
          │   External Services       │
          │  - Numbeo API             │
          │  - Clerk Auth             │
          │  - Stripe Payments        │
          └───────────────────────────┘
```

**Benefits:**
- Global edge deployment (low latency everywhere)
- No cold starts (Workers keep-alive)
- Automatic scaling (no provisioning)
- Cost-effective ($5-20/month for 10k users)

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-4)

**Goal:** Build core multi-year engine + auth

- Set up D1 database + migrations
- Integrate Clerk authentication
- Build ScenarioEngine (basic multi-year)
- Build PortfolioSimulator
- Build basic Timeline UI (no drag-drop, just form)
- API: POST /api/scenario/calculate

**Deliverable:** Can model a simple 5-year scenario with income growth

---

### Phase 2: Cost of Living (Weeks 5-8)

**Goal:** Integrate real cost of living data

- Integrate Numbeo API
- Build CostOfLivingService + caching
- Build Budget Builder UI
- Enhance ScenarioEngine to use COL data
- API: GET /api/cost-of-living

**Deliverable:** Shows accurate take-home pay minus living expenses

---

### Phase 3: Life Events (Weeks 9-12)

**Goal:** Model major life changes

- Build LifeEventModel
- Build drag-and-drop Timeline UI
- Add life events: marriage, children, home purchase
- Country-specific childcare costs
- API: Scenario config includes events

**Deliverable:** Can model realistic life scenarios (marriage + kids + house)

---

### Phase 4: Scenarios & Comparison (Weeks 13-16)

**Goal:** Multi-scenario planning

- Scenario CRUD (save/load)
- Scenario Comparison Matrix UI
- Multi-Year Charts (net worth, income, taxes)
- Scenario forking/cloning
- PDF export (basic)

**Deliverable:** Full scenario planning tool

---

### Phase 5: Wealth & Advanced Features (Weeks 17-20)

**Goal:** High net worth features

- WealthCalculator
- Wealth tax YAML configs (CH, NL, ES, NO)
- Capital gains tax (basic)
- Opinionated scenario suggestions
- Enhanced PDF export

**Deliverable:** Can model wealth tax impacts for HNW users

---

### Phase 6: Polish & Launch (Weeks 21-24)

**Goal:** Production-ready

- Guided onboarding wizard
- Confidence indicators
- Payment integration (Stripe)
- Free/Pro/Premium tiers
- Marketing site
- Beta user testing
- Bug fixes & optimization

**Deliverable:** Public launch 🚀

---

## Resource Requirements

### Engineering Team

**Minimum (slower):**
- 2 full-stack engineers
- Timeline: 12-18 weeks
- Cost: $60k-90k (contract) or 3-4 months salary

**Optimal:**
- 1 backend engineer (services, APIs, database)
- 1 frontend engineer (UI components, UX)
- 1 full-stack engineer (integration, DevOps)
- Timeline: 8-12 weeks
- Cost: $90k-120k (contract)

**Additional:**
- 1 designer (part-time, weeks 1-8)
- 1 tax expert (consultant, validation)

### Infrastructure Costs

**Development:**
- Cloudflare (Workers, D1, KV): ~$5/month
- Numbeo API: $30/month
- Clerk Auth: Free tier
- **Total: ~$35/month**

**Production (1000 users):**
- Cloudflare Workers: ~$5-10/month
- Cloudflare D1: Free (under 5GB)
- Cloudflare KV: ~$2/month
- Numbeo API: $30/month
- Clerk Auth: Free tier (10k MAU)
- **Total: ~$40-50/month**

**Production (10k users):**
- Cloudflare Workers: ~$20-40/month
- Cloudflare D1: Free
- Cloudflare KV: ~$5/month
- Numbeo API: $60/month (higher tier)
- Clerk Auth: $25/month
- **Total: ~$110-130/month**

**Very cost-effective scaling!**

---

## Migration Path (V1 → V2)

### Backward Compatibility

**Good news:** V2 is mostly additive, not breaking

- ✅ Existing `/api/calc` endpoint unchanged
- ✅ Existing calculator UI still works
- ✅ Existing YAML configs compatible
- ✅ No breaking changes to engine

**New features are opt-in:**
- Users can still use simple calculator
- Scenarios require authentication
- Cost of living data optional
- Multi-year planning is new flow

### Gradual Rollout

1. **Week 1-4:** Launch scenario engine behind feature flag
2. **Week 5-8:** Beta test with 50 users
3. **Week 9-12:** Public launch, but keep simple calculator as default
4. **Week 13+:** Gradually promote scenario features

### Data Migration

**None needed** - V2 is greenfield (new tables, new features)

---

## Comparison: Build vs Buy

### Could we use existing tools?

**TurboTax / Tax software:**
- ❌ Single-country only
- ❌ Not designed for expats
- ❌ No multi-year scenario planning
- ❌ No cost-of-living integration

**Numbeo / Cost of living sites:**
- ❌ No tax calculations
- ❌ No scenario planning
- ❌ Generic city comparisons only

**Financial planning software (Personal Capital, Mint):**
- ❌ US-only
- ❌ No international tax rules
- ❌ Not move-decision focused

**Excel / Manual calculations:**
- ❌ Error-prone
- ❌ Not shareable
- ❌ Requires tax expertise
- ❌ User 2 spent 5+ hours doing this!

**Verdict: No comparable tool exists → Build**

---

## Conclusion: How Complex is V2?

### Complexity Rating: **7/10**

**Not as hard as:**
- Building a new tax calculation engine (already have it!)
- Real-time collaboration (not needed)
- Complex financial instruments (not in scope)
- Enterprise security (using Cloudflare + Clerk)

**Harder than:**
- Simple CRUD app
- Basic multi-country calculator (v1)
- Static website

### Key Factors

**What makes it manageable:**
1. ✅ Strong foundation (v1 engine is solid)
2. ✅ Additive architecture (no rewrites)
3. ✅ Good separation of concerns (services are independent)
4. ✅ Cloudflare ecosystem (everything integrated)
5. ✅ External data available (Numbeo API exists)

**What makes it challenging:**
1. ⚠️ Multi-domain problem (tax + COL + finance + UX)
2. ⚠️ Data accuracy critical (high user stakes)
3. ⚠️ Complex UI (timeline builder, scenario matrix)
4. ⚠️ Country-specific rules (15+ countries × multiple tax types)
5. ⚠️ External API reliability

### Recommendation

**Build in phases:**
- Start with MVP: Swiss Move Planner (Phase 1-4)
- Validate with real users (Beta group of 50-100)
- Iterate based on feedback
- Expand to more countries (Phase 5-6)

**Timeline:**
- **MVP (Phases 1-4): 3-4 months** with 2-3 engineers
- **Full V2 (Phases 1-6): 6-9 months**

**Cost:**
- **Development: $60k-120k** (contractor rates)
- **Infrastructure: $40-130/month** (scales with users)
- **Ongoing: 1 engineer part-time** for maintenance

**ROI:**
If we can charge:
- 1000 users × $49 (Pro tier) = $49k revenue
- 100 users × $299 (Premium tier) = $29k revenue
- **Total: $78k** in first year

**Payback period: 6-12 months** 🎯

---

## Next Steps

1. **Validate assumptions** with user interviews (5-10 potential customers)
2. **Prioritize features** based on willingness to pay
3. **Build MVP** (Swiss Move Planner - Phases 1-4)
4. **Beta test** with 50 users
5. **Iterate** based on feedback
6. **Scale** to more countries

**Should we proceed with detailed implementation planning?**
