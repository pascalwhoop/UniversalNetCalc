# V2 Quick Reference

## TL;DR

**What:** Transform from "tax calculator" → "financial move companion"
**Target:** Mid-career professionals considering international moves (focus: DE→CH)
**Effort:** 4 months, 2-3 engineers, $75k-100k
**Complexity:** 7/10 (medium-high, but manageable)
**Revenue:** $10k-75k Year 1

---

## V1 vs V2 Comparison

| Aspect | V1 (Current) | V2 MVP (Proposed) |
|--------|--------------|-------------------|
| **Core Value** | "What's my net salary?" | "Should I move? What's the 5-year financial impact?" |
| **Time Horizon** | Single point in time | 5-year projection |
| **Scope** | Taxes only | Taxes + cost of living + life events |
| **Output** | Net salary, tax breakdown | Disposable income, portfolio growth, break-even analysis |
| **User Journey** | 30 seconds (enter salary → see result) | 15 minutes (guided onboarding → detailed plan) |
| **Data Sources** | YAML configs (static) | YAML + Numbeo API + user inputs |
| **Persistence** | None (stateless) | User accounts, saved scenarios (D1) |
| **Monetization** | None | Freemium (free, Pro $49, Premium $299) |
| **Target User** | Anyone curious about taxes | Serious move planners |
| **Engineering Complexity** | Low-medium | Medium-high |
| **Infrastructure** | Cloudflare Workers (stateless) | Workers + D1 + KV + Auth |
| **Monthly Cost** | $5 | $40-100 |
| **Lines of Code** | ~5k | ~15k (estimate) |

---

## Core Components (What to Build)

### Backend Services (7 new)

1. **ScenarioEngine** - Multi-year orchestrator
   - Complexity: HIGH
   - Effort: 3-4 weeks
   - Dependencies: All other services

2. **LifeEventModel** - Event → tax impact mapping
   - Complexity: MEDIUM
   - Effort: 2-3 weeks
   - Dependencies: CostOfLivingService

3. **CostOfLivingService** - External API integration
   - Complexity: MEDIUM
   - Effort: 2-3 weeks
   - Dependencies: Numbeo API, KV

4. **WealthCalculator** - Wealth tax calculations
   - Complexity: MEDIUM-HIGH
   - Effort: 3-4 weeks
   - Dependencies: New YAML configs

5. **PortfolioSimulator** - Investment growth modeling
   - Complexity: LOW
   - Effort: 1 week
   - Dependencies: None

6. **AuthService** - User accounts (via Clerk)
   - Complexity: LOW
   - Effort: 3-5 days
   - Dependencies: Clerk API

7. **ReportGenerator** - PDF export
   - Complexity: MEDIUM
   - Effort: 1-2 weeks
   - Dependencies: Puppeteer or similar

**Total Backend Effort:** ~12-18 weeks

### Frontend Components (12 new)

1. **GuidedOnboarding** - Step-by-step wizard
2. **TimelineBuilder** - Life events input (simple form for MVP)
3. **ScenarioMatrix** - Side-by-side comparison
4. **BudgetBuilder** - Cost of living customizer
5. **MultiYearChart** - Line charts (net, portfolio, disposable income)
6. **BreakdownChart** - Sankey diagram (income flow)
7. **InsightsPanel** - Auto-generated insights
8. **ConfidenceIndicators** - Data quality badges
9. **SaveDialog** - Scenario management
10. **ComparisonView** - Current vs future
11. **SettingsPanel** - User preferences
12. **PaymentFlow** - Stripe integration (Phase 2)

**Total Frontend Effort:** ~10-15 weeks

### Data Layer (4 new)

1. **D1 Database** - SQLite (users, scenarios)
2. **Workers KV** - Cache (COL data, FX rates)
3. **Numbeo API** - Cost of living data
4. **Clerk Auth** - User management

**Total Data Effort:** ~2-3 weeks

---

## Technology Decisions

### Core Stack (No Changes)
- ✅ Next.js 14+ App Router
- ✅ Cloudflare Workers (OpenNext)
- ✅ TypeScript
- ✅ shadcn/ui
- ✅ Recharts
- ✅ Vitest

### New Additions
- 🆕 Cloudflare D1 (SQLite database)
- 🆕 Clerk (authentication) - **Recommended**
  - Alternative: Auth0, Cloudflare Access
- 🆕 Numbeo API (cost of living) - **Primary**
  - Fallback: Expatistan API, hardcoded data
- 🆕 React Hook Form + Zod (form validation)
- 🆕 Zustand or Jotai (state management, lightweight)
- 🆕 @dnd-kit (drag-and-drop, Phase 2)
- 🆕 Stripe (payments, Phase 2)

### Why These Choices?

**Clerk over Auth0:**
- Better DX (drop-in React components)
- Free tier is generous (10k MAU)
- Native Next.js integration

**Numbeo over building our own:**
- 9000+ cities already covered
- Community-updated (fresh data)
- $30/month is negligible cost

**D1 over Postgres/MySQL:**
- Native Cloudflare integration (low latency)
- SQLite is perfect for this scale
- Free tier (10GB storage)
- Familiar SQL syntax

**Zustand over Redux:**
- Simpler API
- Less boilerplate
- Better TypeScript support
- Lightweight (1KB)

---

## Data Flow

### V1: Single Calculation
```
User Input (30s)
    ↓
POST /api/calc
    ↓
CalculationEngine (100ms)
    ↓
Result Display
```

### V2: Multi-Year Scenario
```
User Input (15 min guided onboarding)
    ↓
POST /api/scenario/calculate
    ↓
ScenarioEngine:
  For each year (1-5):
    ├─ Fetch COL data (cache hit: 10ms, miss: 500ms)
    ├─ Apply life events
    ├─ Calculate taxes (CalculationEngine: 100ms)
    ├─ Calculate wealth tax
    ├─ Update portfolio
    └─ Store result
    ↓
Cache result in D1
    ↓
Return to frontend (500ms-2s total)
    ↓
Interactive dashboard
    ↓
User saves scenario (requires auth)
```

---

## Implementation Timeline

### 4-Month Plan (2 engineers)

**Month 1: Foundation**
- Week 1-2: Database, auth, project structure
- Week 3-4: ScenarioEngine core, PortfolioSimulator

**Month 2: Cost of Living**
- Week 5-6: Numbeo integration, caching
- Week 7-8: Budget builder UI, COL display

**Month 3: Swiss Features**
- Week 9-10: All Swiss canton configs
- Week 11-12: Wealth tax, Pillar 2/3a

**Month 4: Polish & Launch**
- Week 13-14: Guided onboarding, multi-year charts
- Week 15-16: Beta testing, bug fixes, launch 🚀

### 3-Month Plan (3 engineers)

**Month 1: Parallel Development**
- Engineer 1: Backend (ScenarioEngine, services)
- Engineer 2: Frontend (onboarding, charts)
- Engineer 3: Infrastructure (DB, auth, APIs)

**Month 2: Integration**
- Week 5-6: Connect frontend + backend
- Week 7-8: Swiss configs, COL integration

**Month 3: Polish & Launch**
- Week 9-10: Testing, bug fixes
- Week 11-12: Beta, launch 🚀

---

## API Endpoints

### New Endpoints

```
POST   /api/scenario/calculate
GET    /api/scenario/:id
POST   /api/scenario/save
PUT    /api/scenario/:id
DELETE /api/scenario/:id
GET    /api/user/scenarios

GET    /api/cost-of-living?city=zurich&country=ch
GET    /api/wealth-tax?country=ch&canton=zh&year=2025

POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout

GET    /api/user/profile
PUT    /api/user/profile

POST   /api/report/generate (PDF export)
GET    /api/report/:id/download
```

### Existing (Unchanged)

```
POST /api/calc
GET  /api/calc?action=countries
GET  /api/calc?action=years
GET  /api/calc?action=variants
GET  /api/calc?action=inputs
```

---

## Database Schema

### users
```sql
id, email, created_at, updated_at,
subscription_tier, subscription_expires_at
```

### scenarios
```sql
id, user_id, name, description,
config (JSON), created_at, updated_at
```

### scenario_results
```sql
id, scenario_id, results (JSON), calculated_at
```

### user_profiles
```sql
user_id, age, family_status, dependents,
net_worth_range, current_country, current_city
```

---

## Cost Breakdown

### Development (One-time)

| Item | Cost |
|------|------|
| 2 engineers × 4 months | $64,000 |
| Designer (part-time) | $8,000 |
| Tax expert validation | $2,000 |
| **Total** | **$74,000** |

### Infrastructure (Monthly)

| Service | Free Tier | Production (1k users) | Production (10k users) |
|---------|-----------|----------------------|------------------------|
| Cloudflare Workers | $0 | $5-10 | $20-40 |
| Cloudflare D1 | $0 | $0 | $0 |
| Cloudflare KV | $0 | $2 | $5 |
| Numbeo API | - | $30 | $60 |
| Clerk Auth | $0 | $0 | $25 |
| Sentry | $0 | $0 | $26 |
| Domain | $15/year | $15/year | $15/year |
| **Total** | **$0** | **$40-50/mo** | **$130-160/mo** |

**Note:** Infrastructure costs scale very gracefully. Even at 10k users, only ~$150/month.

---

## Revenue Model

### Pricing Tiers

**Free**
- 2 scenarios max
- 5-year projections
- Basic charts
- No PDF export

**Pro - $49 one-time**
- Unlimited scenarios
- 10-year projections
- Detailed canton breakdowns
- PDF export
- Priority support

**Premium - $299 one-time**
- Everything in Pro
- 20-year projections
- Wealth tax optimization
- Capital gains modeling
- Consultation booking

### Alternative: Monthly Subscription

**Free** - $0/month
**Pro** - $9/month
**Premium** - $29/month

**Trade-off:**
- One-time: Higher barrier, but better for user (pay once, use forever)
- Monthly: Recurring revenue, but may deter serious users

**Recommendation:** One-time for MVP, offer monthly as alternative

---

## Success Metrics

### Engagement (Leading Indicators)

- Completion rate (start onboarding → finish)
- Average time spent
- Return rate (1 week, 1 month)
- Scenarios created per user

### Conversion (Lagging Indicators)

- Free → Pro conversion
- Pro → Premium conversion
- Churn rate (monthly users)

### Quality (Validation)

- NPS score
- Support ticket rate
- Calculation accuracy (vs real tax returns)
- User-reported errors

### Growth (Outcomes)

- Monthly active users
- MRR / ARR
- Customer acquisition cost
- Lifetime value

---

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Low user adoption | HIGH | MEDIUM | Pre-launch email list, multi-channel launch, user interviews |
| Calculation errors | HIGH | LOW | Extensive testing, config validation, beta users, disclaimers |
| External API downtime | MEDIUM | MEDIUM | Aggressive caching, multiple fallbacks, hardcoded data |
| Competitor launch | MEDIUM | LOW | First-mover advantage, superior UX, niche focus |
| Low conversion rate | MEDIUM | MEDIUM | Clear value prop, competitive pricing, free tier is useful |
| Scope creep | MEDIUM | HIGH | Strict MVP definition, say "no" to features, phased rollout |

---

## Decision Checklist

### ✅ Build MVP if:

- [ ] Budget available ($75k-100k)
- [ ] Engineering resources (2-3 engineers, 3-4 months)
- [ ] Validated demand (user interviews, beta interest)
- [ ] Long-term vision (multi-year product)
- [ ] Willing to iterate (not one-and-done)
- [ ] Can handle support (email, Discord, etc.)

### ❌ Don't build if:

- [ ] Need immediate profit (break-even in Year 2)
- [ ] Can't dedicate engineering time
- [ ] Want all countries from day 1 (scope too big)
- [ ] Not interested in user feedback loops
- [ ] Looking for side project (needs full commitment)

---

## Next Actions

### If YES → Build

1. **Week 0: Validate**
   - 10 user interviews (people who moved DE→CH)
   - Questions: Would you pay $49? What's missing?
   - Goal: 70%+ say "yes, I would pay"

2. **Week 1: Kick-off**
   - Set up project repo, CI/CD
   - Database migrations
   - Auth integration (Clerk)
   - Team sprint planning

3. **Week 4: Checkpoint**
   - ScenarioEngine working (basic)
   - Can calculate 5-year projection
   - Internal demo

4. **Week 8: Mid-point**
   - COL integration working
   - Budget builder UI complete
   - Swiss configs (basic)

5. **Week 12: Pre-beta**
   - Full user journey working
   - Guided onboarding done
   - Charts + insights

6. **Week 14-15: Beta**
   - 20-30 users
   - Gather feedback
   - Fix critical bugs

7. **Week 16: Launch**
   - Public launch (HN, Reddit)
   - Monitor metrics
   - Rapid iteration

### If NO → Alternative Paths

**Option 1: Simple Enhancement (6-8 weeks)**
- Add cost-of-living to existing calculator
- No multi-year, no scenarios, no auth
- Just show: "Net salary - COL = Disposable income"
- Effort: 1 engineer, 6-8 weeks, $15k-20k

**Option 2: Partnership (0 dev work)**
- White-label existing tool to tax advisors
- They do sales, you provide tech
- Revenue share (e.g., 30% commission)

**Option 3: Focus on V1 Growth (0 new features)**
- Add more countries (existing system scales)
- Improve SEO, content marketing
- Build email list, wait for demand signal

---

## FAQs

### Why Switzerland first?

1. High immigration interest (especially from EU)
2. Complex tax system (perfect showcase)
3. High-value users (professionals, willing to pay)
4. Large salary differential (makes tool valuable)
5. User validation (User 2's exact use case)

### Why not build all countries at once?

- Complexity scales linearly (15 countries = 15× effort)
- Better to get 1 country perfect than 15 mediocre
- Can validate demand before expanding
- Easier to debug, test, support

### Can we expand to other countries later?

Yes! Architecture is country-agnostic:
- ScenarioEngine works for any country
- Just need: Tax configs + COL data + country-specific rules
- Estimate: 2-3 weeks per new country corridor

### What if Numbeo API shuts down?

- Have fallback (Expatistan API)
- Can manually curate data for top 100 cities
- Or partner with data provider
- Or crowdsource from community

### How accurate are the calculations?

- Tax calculations: **95%+ accurate** (based on official sources)
- Cost of living: **80-90% accurate** (community data, varies by city)
- Future projections: **Directionally correct** (depends on user inputs)

**Always recommend:** "Verify with tax advisor before making decisions"

### What's the biggest technical challenge?

**Timeline builder UI** (if doing drag-and-drop)
- Complex interaction design
- State management for events
- Mobile responsiveness

**Mitigation for MVP:** Use simple form-based timeline, add drag-and-drop in Phase 2

### What's the biggest business risk?

**Low conversion rate** (free → paid)

**Mitigation:**
- Make free tier genuinely useful (2 scenarios is enough for basic use)
- Clear value prop (Pro = unlimited scenarios, $49 = 1 hour of advisor time)
- Target HNW users with Premium ($299 is nothing for portfolio > $500k)

---

## Recommended Path

**Build the MVP, but start small:**

1. **Phase 0 (Week 0):** Validate with user interviews (10 people)
2. **Phase 1 (Weeks 1-8):** Build core engine + COL integration
3. **Checkpoint:** Demo to potential users, gather feedback
4. **Decision Point:** Continue to Phase 2-3 OR pivot based on feedback

**Total investment to first decision point: 8 weeks, ~$30k**

If feedback is positive → Full steam ahead to launch
If feedback is meh → Reassess, maybe simplify scope or pivot

**This de-risks the investment** 🎯

---

## Final Recommendation

**BUILD IT** - but be prepared to iterate

The product vision is sound, the market exists, the technology is proven. The main risk is execution and market fit, which you can only validate by building and getting users.

**Start with 8 weeks, spend $30k, then decide.**

If you build it, they *might* come. But if you don't build it, they definitely won't. 🚀
