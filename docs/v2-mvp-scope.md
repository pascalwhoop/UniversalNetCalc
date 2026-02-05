# V2 MVP: Swiss Move Planner

## Strategic Focus

Based on user feedback, we're building **one thing really well** rather than a mediocre global solution.

**Target:** Germany → Switzerland corridor (expandable to any country → Switzerland)

---

## MVP Scope Definition

### What's IN Scope (Must Have)

#### Core Calculation
- ✅ Multi-year projections (5 years)
- ✅ Income growth modeling (%, fixed, or custom curve)
- ✅ Swiss canton selection (all 26 cantons)
- ✅ German state comparison (all 16 states)
- ✅ Side-by-side comparison (DE vs CH)
- ✅ Year-by-year breakdown

#### Swiss-Specific Features
- ✅ Pillar 2 (mandatory pension) calculation
- ✅ Pillar 3a (voluntary pension) recommendations
- ✅ Wealth tax by canton (with thresholds)
- ✅ Church tax options (cantonal)
- ✅ Municipal tax differences
- ✅ Permit status impact (B permit vs C permit vs cross-border)

#### Cost of Living
- ✅ Rent by city (Zurich, Geneva, Basel, Bern, Zug, Lausanne)
- ✅ Mandatory Swiss health insurance (by age)
- ✅ Typical living expenses (food, transport, utilities)
- ✅ Budget builder (customizable)
- ✅ "Take-home reality" calculation (net minus living costs)

#### Life Events (Basic)
- ✅ Marriage
- ✅ Children (with age-specific childcare costs)
- ✅ Annual salary increases

#### User Features
- ✅ User accounts (Clerk authentication)
- ✅ Save calculations (up to 5 scenarios for free, unlimited for Pro)
- ✅ PDF export (basic)
- ✅ Comparison view (current vs future)

#### UX
- ✅ Guided onboarding (15-minute questionnaire)
- ✅ Simple timeline (form-based, not drag-and-drop)
- ✅ Multi-year charts (net income, disposable income, portfolio value)
- ✅ Break-even analysis ("After X years, you'll be ahead by €Y")
- ✅ Confidence indicators (data quality markers)

---

### What's OUT of Scope (Phase 2+)

#### Advanced Life Events
- ❌ Home purchase / mortgage
- ❌ Inheritance
- ❌ Job changes / unemployment
- ❌ Retirement planning
- ❌ Disability / parental leave

#### Advanced Financial Modeling
- ❌ Capital gains taxation (stocks, crypto)
- ❌ Dividend income
- ❌ Real estate rental income
- ❌ Self-employment / freelance taxation
- ❌ Monte Carlo simulation
- ❌ Currency fluctuation modeling

#### Advanced UX
- ❌ Drag-and-drop timeline builder
- ❌ Scenario forking/cloning
- ❌ Collaborative scenarios (share with partner)
- ❌ AI suggestions ("Have you considered...")
- ❌ Mobile app

#### Other Countries
- ❌ Switzerland → US, UK, etc. (Phase 2)
- ❌ Germany → Netherlands, UK, etc. (Phase 2)

---

## MVP User Journey

### Entry: "I'm considering moving from Germany to Switzerland"

**Step 1: Quick Check (2 minutes)**
```
Simple form:
- Current salary: €80,000
- Current city: Munich
- Target city: Zurich
- Family status: Single

Output:
- Current net (Munich): €51,234
- Estimated net (Zurich): CHF 68,500 (€69,870)
- Difference: +€18,636/year (+36%)

BUT WAIT:
- Rent in Zurich: +€12,000/year more expensive
- Healthcare: +€3,600/year
- Actual improvement: +€3,000/year disposable income

→ CTA: "Get detailed 5-year plan"
```

**Step 2: Guided Onboarding (15 minutes)**
```
Section 1: Current Situation
- Where do you live? (City, state)
- Gross annual salary
- Age
- Family status (single, married, partnered)
- Children (ages)
- Approximate net worth (<50k, 50-100k, 100-500k, etc.)

Section 2: Target Situation
- Which Swiss city? (dropdown)
- Expected salary (pre-filled with current, editable)
- Permit type (B permit, C permit, cross-border commuter, don't know)

Section 3: Life Plans (next 5 years)
- Planning to get married? (year)
- Planning to have children? (year, number)
- Expected salary growth? (%, fixed amount, or "don't know")

Section 4: Budget
- Current monthly rent: €X (pre-filled with city average)
- Other expenses (pre-filled, editable)

Section 5: Review & Calculate
- Shows all inputs
- "Generate my 5-year plan"
```

**Step 3: Results & Analysis (Interactive)**
```
Dashboard shows:

1. Summary Card
   - Year 1 comparison: DE vs CH
   - Year 5 cumulative: Total savings difference
   - Break-even point: "After 2.5 years, you'll be ahead"

2. Year-by-Year Table
   | Year | DE Net | CH Net | CH COL | CH Disposable | Portfolio Value |
   |------|--------|--------|--------|---------------|----------------|
   | 2026 | €51k   | €70k   | -€45k  | €25k          | €75k           |
   | 2027 | €52k   | €72k   | -€46k  | €26k          | €156k          |
   | ...  | ...    | ...    | ...    | ...           | ...            |

3. Charts
   - Line chart: Net income over time (DE vs CH)
   - Area chart: Income breakdown (gross → taxes → net → expenses → savings)
   - Line chart: Portfolio accumulation

4. Insights (Auto-generated)
   - "Wealth tax becomes significant in Year 4 (portfolio > CHF 200k in ZH)"
   - "Total taxes over 5 years: DE €145k, CH €95k (save €50k)"
   - "But COL higher: Total savings difference: €15k"
   - "If married in Year 3: Changes to..."

5. Actions
   - "Adjust scenario" (go back to inputs)
   - "Save scenario" (requires account)
   - "Download PDF report"
   - "Compare with other cities" (Geneva, Basel, etc.)

6. Confidence Indicators
   🟢 Tax calculations (official sources, 2025 rules)
   🟡 Cost of living (Numbeo data, updated monthly)
   🟡 Future income (based on your estimates)
   🔴 Future tax laws (assumes no changes)

7. Disclaimers
   "This is an estimate for planning purposes. Actual results may vary.
    Always consult a tax advisor before making major decisions."
```

**Step 4: Save & Compare (Requires Account)**
```
- Create free account (email or Google OAuth)
- Save scenario as "Base Case: Zurich"
- Create new scenario: "What if Geneva instead?"
- Compare side-by-side
- Download PDF report
```

**Step 5: Monetization Prompt**
```
Free Tier Limit: 2 scenarios, 5 years max, basic charts

Upgrade to Pro ($49 one-time):
- Unlimited scenarios
- 10-year projections
- Detailed canton breakdowns
- Priority support

Upgrade to Premium ($299 one-time):
- Everything in Pro
- Wealth tax optimization
- 20-year projections
- Consultation booking (partner tax advisors)
```

---

## Technical Implementation (MVP)

### Phase 1: Core Multi-Year Engine (Weeks 1-4)

**Services:**
- `ScenarioEngine` (multi-year orchestrator)
- `PortfolioSimulator` (simple compound interest)
- `LifeEventModel` (marriage + children only)

**Database:**
- `users` table
- `scenarios` table (JSON config)
- `scenario_results` table (cached calculations)

**API:**
- `POST /api/scenario/calculate`
- `POST /api/scenario/save`
- `GET /api/scenario/:id`

**UI:**
- Basic timeline view (table, not visual)
- Multi-year chart (Recharts)
- Comparison table

**Tests:**
- Unit tests for ScenarioEngine
- Integration test: 5-year projection matches manual calculation
- E2E test: Full user journey

**Deliverable:** Can model 5-year scenario with income growth

---

### Phase 2: Cost of Living (Weeks 5-8)

**Services:**
- `CostOfLivingService` (Numbeo integration)
- Workers KV caching (30-day TTL)

**Data:**
- Swiss cities: Zurich, Geneva, Basel, Bern, Zug, Lausanne, St. Gallen
- German cities: Munich, Berlin, Hamburg, Frankfurt, Stuttgart, Düsseldorf

**API:**
- `GET /api/cost-of-living?city=zurich&country=ch`

**UI:**
- Budget Builder component
- "Take-home reality" display
- Sankey diagram (income flow)

**Tests:**
- Mock Numbeo API responses
- Cache hit/miss tests
- Fallback data tests

**Deliverable:** Shows accurate disposable income

---

### Phase 3: Swiss-Specific Features (Weeks 9-12)

**Configs:**
- All 26 Swiss cantons (wealth tax, municipal variations)
- Pillar 2 calculation (mandatory pension)
- Pillar 3a recommendations

**Services:**
- `WealthCalculator` (basic implementation)
- Enhanced `CalculationEngine` (Pillar 2/3a nodes)

**UI:**
- Canton selector (dropdown with map preview?)
- Pension breakdown display
- Wealth tax explanation ("You'll pay CHF X in Year 5 when portfolio > CHF 200k")

**Tests:**
- Config tests for all 26 cantons
- Pillar 2/3a calculation tests (manual verification with official calculators)

**Deliverable:** Accurate Swiss tax + pension calculations

---

### Phase 4: Guided Onboarding & Polish (Weeks 13-16)

**UI:**
- Guided onboarding wizard (step-by-step)
- Progress indicator
- Input validation
- "Why we ask this" tooltips
- Pre-filled smart defaults

**Features:**
- PDF export (basic template)
- Confidence indicators
- Auto-generated insights
- Break-even analysis

**Auth:**
- Clerk integration
- User profiles
- Saved scenarios

**Tests:**
- E2E test: Full onboarding flow
- PDF generation test
- Auth flow test

**Deliverable:** Production-ready MVP

---

## Success Metrics (MVP)

### User Engagement
- **Target:** 30% of visitors complete onboarding
- **Target:** 15% create account
- **Target:** Average time spent: 15-20 minutes
- **Target:** 40% return within 7 days

### Conversion
- **Target:** 5% free → Pro conversion
- **Target:** 10% Pro → Premium conversion

### Quality
- **Target:** NPS > 50
- **Target:** <5% support tickets
- **Target:** 95% calculation accuracy (validated against real tax returns)

### Growth
- **Target:** 500 users in first 3 months (organic)
- **Target:** 50 paying users (€2,450-15,000 revenue)

---

## Launch Checklist

### Pre-Launch (Week 16)

- [ ] All 26 Swiss cantons configured
- [ ] All 16 German states configured
- [ ] Numbeo API integrated + cached
- [ ] Clerk authentication working
- [ ] Database migrations complete
- [ ] PDF export functional
- [ ] All E2E tests passing
- [ ] Mobile responsive (basic)
- [ ] SEO: Title, meta descriptions, sitemap
- [ ] Analytics: Sentry, Cloudflare Analytics
- [ ] Legal: Privacy policy, terms of service, disclaimers

### Beta Testing (Weeks 14-16)

- [ ] Recruit 20-30 beta testers (ideally people considering DE→CH move)
- [ ] Manual testing: Create scenarios, verify accuracy
- [ ] Gather feedback: Confusing UX, missing features, bugs
- [ ] Validate calculations: 5+ users compare with real tax advisors
- [ ] Iterate based on feedback

### Launch Day

- [ ] Deploy to production (tag-based release)
- [ ] Announce on:
  - [ ] Reddit: r/askswitzerland, r/switzerland, r/germany
  - [ ] HackerNews: "Show HN: Swiss Move Planner"
  - [ ] LinkedIn: Personal networks
  - [ ] Expat Facebook groups
- [ ] Monitor: Error rates, API latency, user feedback
- [ ] Have support channel ready (email, Discord?)

### Post-Launch (Week 17+)

- [ ] Weekly user interviews (5-10 users)
- [ ] Track metrics (engagement, conversion, NPS)
- [ ] Fix bugs (prioritize by severity)
- [ ] Add top-requested features
- [ ] Plan Phase 2 (next country corridor)

---

## Budget

### Development (MVP)

**With 2 engineers (16 weeks):**
- 2 full-stack engineers × $8k/month × 4 months = **$64k**

**With 3 engineers (12 weeks):**
- 3 engineers × $10k/month × 3 months = **$90k**

**Additional:**
- Designer (part-time, 8 weeks): $8k
- Tax expert validation: $2k
- **Total: $74k-100k**

### Infrastructure (MVP)

**First Year:**
- Cloudflare Workers + D1 + KV: $5-20/month
- Numbeo API: $30-60/month
- Clerk Auth: Free tier
- Sentry: Free tier
- Domain + SSL: $15/year
- **Total: $40-100/month = $480-1,200/year**

### Marketing (MVP)

**Organic Launch:**
- Content creation (blog posts, Reddit): $0 (DIY)
- Paid ads: $0 (bootstrap)
- **Total: $0**

**Paid Launch (optional):**
- Google Ads: $500/month × 3 months = $1,500
- Facebook Ads (expat groups): $300/month × 3 months = $900
- **Total: $2,400**

---

## Revenue Projections (First Year)

### Conservative Scenario

**Users:**
- Month 1-3: 500 users (organic launch)
- Month 4-6: 1,000 users (word of mouth)
- Month 7-12: 2,000 users (SEO kicking in)

**Conversion:**
- 5% → Pro ($49 one-time) = 100 users = $4,900
- 1% → Premium ($299 one-time) = 20 users = $5,980
- **Total Year 1: $10,880**

**Not profitable yet, but validates demand**

### Optimistic Scenario

**Users:**
- Month 1-3: 1,000 users (successful HN launch)
- Month 4-6: 3,000 users
- Month 7-12: 8,000 users

**Conversion:**
- 7% → Pro = 560 users = $27,440
- 2% → Premium = 160 users = $47,840
- **Total Year 1: $75,280**

**Covers development costs + profit**

### Very Optimistic (Viral + PR)

**Users:**
- Month 1-3: 3,000 users (TechCrunch feature, viral Reddit post)
- Month 4-6: 10,000 users
- Month 7-12: 25,000 users

**Conversion:**
- 10% → Pro = 2,500 users = $122,500
- 3% → Premium = 750 users = $224,250
- **Total Year 1: $346,750**

**Massive success, fund expansion**

---

## Risk Mitigation

### Risk: Not enough users

**Mitigation:**
- Pre-launch: Build email list (landing page with "Notify me")
- Launch: Multiple channels (HN, Reddit, LinkedIn, expat groups)
- Iterate: Weekly user interviews, rapid feature adds

### Risk: Low conversion rate

**Mitigation:**
- Free tier is genuinely useful (2 scenarios)
- Clear value prop for Pro ($49 = 1 hour of tax advisor time)
- Premium targets HNW users (portfolio > €500k)
- Offer annual discount ($9/month = $108/year vs $49 one-time)

### Risk: Inaccurate calculations

**Mitigation:**
- Extensive config testing (test vectors)
- Beta validation with real tax advisors
- User feedback loop ("Report issue" button)
- Confidence indicators (transparency)
- Clear disclaimers

### Risk: Competitor launches similar tool

**Mitigation:**
- First-mover advantage (launch fast)
- Superior UX (opinionated, guided)
- Community-driven configs (open source?)
- Niche focus (expat moves, not general tax)

---

## Decision Framework

### Should we build MVP?

**YES if:**
- ✅ You have 2-3 engineers for 3-4 months
- ✅ Budget of $75k-100k available
- ✅ Willing to iterate based on user feedback
- ✅ See this as multi-year product (not one-off)

**NO if:**
- ❌ Need immediate revenue (break-even in Year 2)
- ❌ Can't dedicate engineering resources
- ❌ Want to cover all countries from day 1 (scope too big)
- ❌ Not willing to handle user support

### Next Steps if YES

1. **Week 0:** Validate with 10 user interviews
   - Target: People who moved DE→CH in last 2 years
   - Questions: Would you have paid $49 for this? What's missing?

2. **Week 1:** Kick off Phase 1 development
   - Set up project, database, auth
   - Start ScenarioEngine implementation

3. **Week 8:** Internal demo
   - Full user journey working
   - Get feedback from team + advisors

4. **Week 14:** Beta launch
   - 20-30 users, manual onboarding
   - Gather detailed feedback

5. **Week 16:** Public launch
   - Announce on HN, Reddit, LinkedIn
   - Monitor metrics, iterate rapidly

### Next Steps if NO

**Alternatives:**
- Build simpler v1.5: Just add cost-of-living to existing calculator (4-6 weeks)
- Partner with tax advisors: White-label the tool, they do sales
- Focus on other features: More countries, better UX, API for partners

---

## Conclusion

**MVP is well-scoped, achievable, and valuable**

- ✅ Solves real problem (User 2 spent 5+ hours on manual research)
- ✅ Clear target market (DE→CH expats, thousands per year)
- ✅ Technical feasibility (4 months, $75k-100k)
- ✅ Revenue potential ($10k-75k Year 1, $50k-300k Year 2)

**Recommendation: BUILD IT** 🚀

But start with Phase 1-2 (8 weeks), then decide whether to continue based on early user feedback.
