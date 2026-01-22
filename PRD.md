## PRD: Universal Gross to Net Salary Calculator

### 1) Summary

Build a web app that calculates after tax income (gross to net) for many countries, using community maintained YAML tax configurations per country and year (and optional variants like expat regimes, filing types, regions). App runs on Next.js and deploys to Cloudflare Workers via OpenNext. ([Cloudflare Docs][1])

---

### 2) Goals

* Accurate gross to net calculations with a transparent breakdown (taxes, contributions, credits, surcharges).
* Config driven tax logic using YAML, versioned by country and tax year (2023, 2024, 2025, etc.).
* Support regional tax layers where required (federal plus canton plus municipality, etc.).
* Community workflow: PR based contributions, automated validation with test vectors.

### 3) Non goals

* Filing and official tax advice.
* Edge case completeness on day 1 (stock option taxation, unusual deductions, complex self employment regimes).
* Payroll provider integrations.

---

### 4) Target countries for v1 validation set (expat heavy)

Switzerland, Netherlands, Germany, UK, Ireland, France, Spain, Portugal, Italy, UAE, Singapore, Hong Kong, Canada, Australia, US.

These force the framework to support: multi level taxation (CH), payroll taxes (US), separate levies (AU Medicare), etc. ([youtube.com][2])

---

### 5) Users and primary use cases

**Users**

* Expats comparing destinations.
* Employers and recruiters giving rough net estimates.
* Contributors maintaining country configs.

**Use cases**

* Compare net across countries with identical gross.
* Compare net across years within a country to see tax drift.
* Toggle variants (expat regime, filing status, region, dependents).

---

### 6) Product requirements

#### 6.1 Calculation engine

**Must**

* Deterministic evaluation of a config defined calculation graph (DAG) producing:

  * `gross`, `taxable_bases`, `employee_contributions[]`, `income_taxes[]`, `surtaxes[]`, `credits[]`, `net`, optional `employer_cost`.
* Support multi jurisdiction layers (federal/state/municipal) and region keyed parameters.
* Support year selection and mid year effective dates (optional for v1, required for v2).

**Nice to have**

* Minimal solver support for limited circular dependencies (rare).
* Monte Carlo for bonus or equity scenarios (v2).

#### 6.2 YAML configuration system

**Must**

* One config per (country, year, variant). Variants are overlays (patches) on a base config.
* Schema validation (JSON Schema published).
* Golden test vectors stored alongside config: input context and expected outputs.

**Config primitives**

* Math nodes: `sum`, `sub`, `mul`, `min`, `max`, `clamp`
* Tax nodes: `bracket_tax`, `percent_of`, `tax_on_tax`
* Adjustments: `deduction`, `credit` (refundable vs non), `phaseout`
* Control flow: `switch` (by filing status, residency, regime), `lookup` (tables)
* Utilities: `round`, `prorate` (pay frequency, partial year)

#### 6.3 API

**Endpoints**

* `POST /api/calc`

  * Input: `country`, `year`, `variant?`, `region?`, `gross_annual`, other inputs
  * Output: full breakdown plus `config_version_hash`
* `GET /api/configs` (discoverability)
* `GET /api/config/:country/:year/:variant?` (raw config, cached)

#### 6.4 Transparency

* Show exact config version and last updated timestamp.
* Show line item breakdown and formulas used (node level explanation), derived from the evaluated graph.

---

### 7) UX requirements (high level, no detailed UI)

* Inputs: gross, country, year, variant, region, filing status, dependents.
* Output: net, effective rate, breakdown table, downloadable JSON.
* Compare mode: multiple countries side by side and multiple years for one country.

Component system: shadcn/ui for primitives and Aceternity UI for animated sections where helpful. ([ui.shadcn.com][3])

---

### 8) Technical architecture

#### 8.1 Runtime and deployment

* Next.js (App Router) deployed to Cloudflare Workers using OpenNext adapter. ([Cloudflare Docs][1])
* Constraints to account for:

  * Worker bundle size limits (notably compressed size thresholds). ([opennext.js.org][4])
  * Workers have platform limits and CPU time constraints; long wall clock is possible while client connected, but CPU is bounded and configurable. ([Cloudflare Docs][5])

#### 8.2 Data and storage

* Configs: stored in GitHub repo, shipped with the app, optionally cached in Workers KV for fast reads. Workers KV is global read optimized storage. ([Cloudflare Docs][6])
* Optional persistence:

  * D1 for saved scenarios, comparisons, community metadata (SQLite semantics, Workers binding). ([Cloudflare Docs][7])
  * Durable Objects only if strong consistency or coordination is needed (ex: collaborative editing, rate limited moderation). ([Cloudflare Docs][8])

#### 8.3 Repo structure

* `apps/web` Next.js app
* `packages/engine` calculation engine (pure TS, no Next dependency)
* `packages/schema` JSON Schema + validators
* `configs/<country>/<year>/default.yaml` and `configs/<country>/<year>/variants/*.yaml`
* `configs/<country>/<year>/tests/*.json` test vectors

---

### 9) Config contribution workflow (community)

* PR adds or updates YAML plus test vectors.
* CI pipeline:

  * Schema validation
  * Engine evaluation against test vectors
  * Linting and formatting
  * Optional: snapshot test for breakdown structure stability
* Review checklist per config:

  * Source references recorded in config metadata (links, effective dates)
  * Coverage: low, median, high gross; at least one regional example if relevant
  * Variant coverage if provided

---

### 10) Security and compliance

* No PII required for baseline calculations.
* If user accounts are added later:

  * Auth via OAuth or email magic link.
  * Store minimal data (saved scenarios), encrypt at rest via provider guarantees.
* Add clear disclaimer: informational estimates, not tax advice.

---

### 11) Observability and quality

* Metrics:

  * Calculation latency p50/p95
  * Cache hit rate for configs
  * Error rate by config id
  * Test vector pass rate per country and year
* Logging:

  * Include config hash, country, year, variant, region, but not user identifiers.

---

### 12) Milestones

**M0**

* Engine MVP: bracket tax, percent contributions, lookups, variants, breakdown output.

**M1**

* Config system + schema + test vectors; ship 3 reference countries (NL, CH, US) to prove universality.

**M2**

* Compare mode (country and year), cache layer, publish contribution docs.

**M3**

* Expand to v1 target set (10 to 15 countries) with minimum coverage tests.

---

### 13) Open questions

* Do we treat all inputs as annual only, or support monthly and 13th salary conventions explicitly?
* Do we include employer cost and show “total cost to company” as a first class output?
* How strict should test vectors be around rounding and pay period rules per jurisdiction?

[1]: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/?utm_source=chatgpt.com "Next.js · Cloudflare Workers docs"
[2]: https://www.youtube.com/watch?v=1cgS-YqCB3M&utm_source=chatgpt.com "How to use Aceternity UI Library in Next JS - YouTube"
[3]: https://ui.shadcn.com/docs/installation/next?utm_source=chatgpt.com "Next.js - shadcn/ui"
[4]: https://opennext.js.org/cloudflare?utm_source=chatgpt.com "Index - OpenNext"
[5]: https://developers.cloudflare.com/workers/platform/limits/?utm_source=chatgpt.com "Limits · Cloudflare Workers docs"
[6]: https://developers.cloudflare.com/kv/?utm_source=chatgpt.com "Cloudflare Workers KV"
[7]: https://developers.cloudflare.com/d1/?utm_source=chatgpt.com "Overview · Cloudflare D1 docs"
[8]: https://developers.cloudflare.com/durable-objects/?utm_source=chatgpt.com "Overview · Cloudflare Durable Objects docs"

