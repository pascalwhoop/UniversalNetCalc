# Eurostat Data Access Research: Income-Aware PPP Adjustments

Research date: 2026-03-01

## Goal

Build **Engel curves** (spending shares by income level) per country, combined with **price level indices** per spending category, to compute income-aware PPP adjustments. This requires two data sources:

1. **Price Level Indices** by consumption category (how expensive is food/housing/transport in country X vs EU average?)
2. **Household Budget Survey** spending shares by income quintile (what % of income does a low/high earner spend on food/housing/transport?)

---

## Part 1: Price Level Indices (prc_ppp_ind_1)

### Dataset Overview

| Field | Value |
|-------|-------|
| Dataset code | `prc_ppp_ind_1` |
| Full name | Purchasing power parities, price level indices, nominal and real expenditures by analytical categories - based on COICOP 2018 |
| Time coverage | 1995-2024 (COICOP 2018 classification applied to 2022-2024 only) |
| Last updated | 2026-01-13 |
| Observations | ~130,789 |

**Legacy dataset:** `prc_ppp_ind` uses the older COICOP 1999 classification and covers 1995-2021 with the old analytical categories.

### Dimensions

| Dimension | Key | Values |
|-----------|-----|--------|
| Frequency | `freq` | `A` (Annual only) |
| Indicator | `indic_ppp` | `PLI_EU27_2020` (Price Level Index, EU27=100), `PPP_EU27_2020`, `EXP_NAC`, `EXP_EUR`, `EXP_PPS_EU27_2020`, etc. |
| Category | `ppp_cat18` | 64 analytical categories (see below) |
| Geography | `geo` | 43 entities (see below) |
| Time | `TIME_PERIOD` | 1995-2024 |

### Analytical Categories (ppp_cat18) - COICOP 2018

The categories relevant for our use case (household consumption):

| Code | Label | Maps to HBS COICOP |
|------|-------|---------------------|
| `A01` | Actual individual consumption (aggregate) | Total |
| `A0101` | Food and non-alcoholic beverages | CP01 |
| `A0102` | Alcoholic beverages, tobacco and narcotics | CP02 |
| `A0103` | Clothing and footwear | CP03 |
| `A0104` | Housing, water, electricity, gas and other fuels | CP04 |
| `A0105` | Furnishings, household equipment and routine household maintenance | CP05 |
| `A0106` | Health | CP06 |
| `A0107` | Transport | CP07 |
| `A0108` | Information and communication | CP08 |
| `A0109` | Recreation, sport and culture | CP09 |
| `A0110` | Education services | CP10 |
| `A0111` | Restaurants and accommodation services | CP11 |
| `A0112` | Miscellaneous goods and services | CP12 |

Sub-categories with even more granularity:
- Food: `A010101` (cereals), `A01010102` (meat), `A01010103` (fish), `A01010104` (dairy), etc.
- Housing: `A010405` (electricity, gas and other fuels)
- Transport: `A010701` (purchase of vehicles), `A010702` (fuels), `A010703` (passenger transport services)

Other aggregate categories:
- `E011` - Household final consumption expenditure
- `E012` - Government final consumption expenditure
- `GDP` - Gross domestic product
- `P01`/`P02` - Total goods / Total services

### Country Coverage (43 entities)

**EU27:** AT, BE, BG, CY, CZ, DE, DK, EE, EL, ES, FI, FR, HR, HU, IE, IT, LT, LU, LV, MT, NL, PL, PT, RO, SE, SI, SK

**EFTA (3):** CH, IS, NO

**Candidate countries (6):** AL, BA, ME, MK, RS, TR

**Other:** UK, US, JP

**Aggregates:** EU27_2020, EA19, EA20, CPC1

### Example Data (PLI, EU27=100, 2024)

| Country | Food (A0101) | Housing (A0104) | Transport (A0107) | Restaurants (A0111) |
|---------|-------------|-----------------|-------------------|---------------------|
| DE | 103.4 | 122.3 | 96.9 | 109.5 |
| FR | 108.9 | 117.7 | 93.0 | 120.6 |
| NL | 98.4 | 133.0 | 112.6 | 114.4 |
| CH | 159.7 | - | - | - |
| PL | 86.8 | - | - | - |

---

## Part 2: Household Budget Survey (HBS) - Engel Curves

### Key Dataset: hbs_str_t223

**Structure of consumption expenditure by income quintile and COICOP consumption purpose**

| Field | Value |
|-------|-------|
| Dataset code | `hbs_str_t223` |
| Time coverage | 1988, 1994, 1999, 2005, 2010, 2015, 2020 |
| Last updated | 2025-10-22 |
| Observations | ~48,931 |
| Unit | Per mille (PM) - divide by 1000 to get proportion |
| Survey frequency | Every 5 years |
| Next expected | 2025 data collection, available ~2027 |

### Dimensions

| Dimension | Key | Values |
|-----------|-----|--------|
| Frequency | `freq` | `A` |
| Income quintile | `quant_inc` | `QU1` (lowest 20%), `QU2`, `QU3`, `QU4`, `QU5` (highest 20%), `UNK` |
| COICOP category | `coicop` | CP01-CP12 at level 2, ~140+ codes down to 4-digit level |
| Unit | `unit` | `PM` (per mille) |
| Geography | `geo` | EU27 + NO, UK, ME, MK, RS, TR, XK (38 entities) |
| Time | `TIME_PERIOD` | 1988, 1994, 1999, 2005, 2010, 2015, 2020 |

### COICOP Categories Available (Level 2)

| Code | Label |
|------|-------|
| CP01 | Food and non-alcoholic beverages |
| CP02 | Alcoholic beverages, tobacco and narcotics |
| CP03 | Clothing and footwear |
| CP04 | Housing, water, electricity, gas and other fuels |
| CP05 | Furnishings, household equipment and routine household maintenance |
| CP06 | Health |
| CP07 | Transport |
| CP08 | Communications |
| CP09 | Recreation and culture |
| CP10 | Education |
| CP11 | Restaurants and hotels |
| CP12 | Miscellaneous goods and services |

### Example Engel Curve Data (2020, per mille)

**Germany (DE):**

| Category | QU1 (poorest) | QU2 | QU3 | QU4 | QU5 (richest) |
|----------|---------------|-----|-----|-----|---------------|
| Food (CP01) | 140 (14.0%) | 125 | 117 | 113 | 98 (9.8%) |
| Housing (CP04) | 412 (41.2%) | 361 | 335 | 310 | 266 (26.6%) |
| Transport (CP07) | 81 (8.1%) | 102 | 121 | 137 | 171 (17.1%) |
| Recreation (CP09) | 87 (8.7%) | 103 | 106 | 108 | 115 (11.5%) |
| Restaurants (CP11) | 44 (4.4%) | 52 | 55 | 60 | 69 (6.9%) |

This clearly shows classic **Engel's Law**: food and housing shares decline with income (necessities), while transport, recreation, and restaurants increase (luxuries).

**Poland (PL) - more dramatic pattern:**

| Category | QU1 | QU5 |
|----------|-----|-----|
| Food | 245 (24.5%) | ~200 |
| Housing | 402 (40.2%) | ~290 |
| Transport | 53 (5.3%) | ~100 |

### Related HBS Datasets

| Code | Description | Use case |
|------|-------------|----------|
| `hbs_str_t211` | Structure by COICOP (overall, no quintile split) | National average spending shares |
| `hbs_str_t223` | **Structure by income quintile and COICOP** | **Primary: Engel curves** |
| `hbs_str_t224` | Structure by household type and COICOP | Single vs family adjustments |
| `hbs_str_t225` | Structure by age of reference person | Age-based adjustments |
| `hbs_str_t226` | Structure by degree of urbanisation | Urban vs rural |
| `hbs_str_t227` | Structure by main source of income | Employment type |
| `hbs_exp_t133` | **Mean consumption expenditure by income quintile** | Absolute spending levels (PPS) |
| `hbs_exp_t121` | Mean expenditure per household by COICOP | Absolute spending by category |

---

## Part 3: API Details

### Available APIs (all free, no authentication required)

| API | Best for | Base URL |
|-----|----------|----------|
| **Statistics API** | Simple JSON queries, easiest to parse | `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/{dataset}` |
| **SDMX 2.1 API** | Structured data extraction, CSV/TSV bulk | `https://ec.europa.eu/eurostat/api/dissemination/sdmx/2.1/data/{dataset}/{key}` |
| **SDMX 3.0 API** | Latest standard, most flexible | `https://ec.europa.eu/eurostat/api/dissemination/sdmx/3.0/data/dataflow/ESTAT/{dataset}/...` |
| **Catalogue API** | Dataset discovery | `https://ec.europa.eu/eurostat/api/dissemination/catalogue/...` |

### Recommended: Statistics API (JSON)

Returns JSON-stat 2.0 format, easiest to parse in TypeScript.

#### Price Level Indices

```
GET https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_ppp_ind_1
    ?indic_ppp=PLI_EU27_2020
    &ppp_cat18=A0101&ppp_cat18=A0103&ppp_cat18=A0104&ppp_cat18=A0107&ppp_cat18=A0109&ppp_cat18=A0111
    &geo=DE&geo=NL&geo=FR
    &time=2024
    &lang=en
```

Response format (JSON-stat 2.0):
```json
{
  "version": "2.0",
  "class": "dataset",
  "value": { "0": 103.4, "1": 108.9, "2": 98.4, ... },
  "id": ["freq", "indic_ppp", "ppp_cat18", "geo", "time"],
  "size": [1, 1, 6, 3, 1],
  "dimension": {
    "ppp_cat18": {
      "category": {
        "index": { "A0101": 0, "A0103": 1, ... },
        "label": { "A0101": "Food and non-alcoholic beverages", ... }
      }
    },
    "geo": {
      "category": {
        "index": { "DE": 0, "FR": 1, "NL": 2 },
        "label": { "DE": "Germany", ... }
      }
    }
  }
}
```

The `value` object is a flat map where the key is a linear index computed from the multi-dimensional `size` array (row-major order).

#### HBS Spending Shares by Income Quintile

```
GET https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/hbs_str_t223
    ?quant_inc=QU1&quant_inc=QU2&quant_inc=QU3&quant_inc=QU4&quant_inc=QU5
    &coicop=CP01&coicop=CP04&coicop=CP07&coicop=CP09&coicop=CP11
    &geo=DE&geo=NL&geo=FR
    &time=2020
    &lang=en
```

### Alternative: SDMX 2.1 API (CSV/TSV)

Better for bulk downloads and simpler parsing:

```
GET https://ec.europa.eu/eurostat/api/dissemination/sdmx/2.1/data/prc_ppp_ind_1/A.PLI_EU27_2020.A0101+A0103+A0104+A0107+A0109+A0111.DE+NL+FR
    ?startPeriod=2024
    &endPeriod=2024
    &format=SDMX-CSV
```

Returns clean CSV:
```csv
DATAFLOW,LAST UPDATE,freq,indic_ppp,ppp_cat18,geo,TIME_PERIOD,OBS_VALUE,OBS_FLAG,CONF_STATUS
ESTAT:PRC_PPP_IND_1(1.0),13/01/26 23:00:00,A,PLI_EU27_2020,A0101,DE,2024,103.4,,
```

For HBS (dimension order: freq.quant_inc.coicop.unit.geo):
```
GET https://ec.europa.eu/eurostat/api/dissemination/sdmx/2.1/data/hbs_str_t223/A.QU1+QU2+QU3+QU4+QU5.CP01+CP04+CP07.PM.DE+NL+FR
    ?startPeriod=2020
    &endPeriod=2020
    &format=SDMX-CSV
```

### Data Formats

| Format | Parameter | Notes |
|--------|-----------|-------|
| JSON-stat 2.0 | `format=JSON` (SDMX) or default (Statistics API) | Easiest for JS/TS |
| SDMX-CSV | `format=SDMX-CSV` | Clean flat CSV, good for bulk |
| TSV | `format=TSV` | Tab-separated, Eurostat-specific |
| SDMX-ML (XML) | Default for SDMX APIs | Verbose, not recommended |

### Rate Limits and Throttling

- **No published rate limits** -- Eurostat does not document specific requests/second limits
- **Asynchronous fallback**: Large queries are automatically switched to async processing (HTTP 413 response with a polling URL)
- **Fair use policy**: "The decision whether to deliver data synchronously or asynchronously is related to factors such as the complexity of the query and the volume of the data"
- **Practical recommendation**: Keep queries focused (filter on specific countries/categories/years), no more than a few requests per second
- **No API key required** -- completely open access
- **CORS enabled** -- can be called from browser JavaScript
- **Database updates**: Twice daily at 11:00 and 23:00 CET

### Update Frequency

| Dataset | Update schedule |
|---------|----------------|
| `prc_ppp_ind_1` | ~Annually (Dec/Jan), with provisional estimates in June |
| `hbs_str_t223` | Every 5 years (next: 2025 data, available ~2027) |

---

## Part 4: Category Mapping (PPP <-> HBS)

The critical mapping between PPP analytical categories and HBS COICOP codes:

| PPP Category (ppp_cat18) | HBS Category (coicop) | Label |
|--------------------------|----------------------|-------|
| `A0101` | `CP01` | Food and non-alcoholic beverages |
| `A0102` | `CP02` | Alcoholic beverages, tobacco and narcotics |
| `A0103` | `CP03` | Clothing and footwear |
| `A0104` | `CP04` | Housing, water, electricity, gas and other fuels |
| `A0105` | `CP05` | Furnishings, household equipment |
| `A0106` | `CP06` | Health |
| `A0107` | `CP07` | Transport |
| `A0108` | `CP08` | Information and communication |
| `A0109` | `CP09` | Recreation, sport and culture |
| `A0110` | `CP10` | Education services |
| `A0111` | `CP11` | Restaurants and accommodation |
| `A0112` | `CP12` | Miscellaneous goods and services |

The mapping is 1:1 at the COICOP division level (2-digit). The PPP dataset uses the code prefix `A01xx` while HBS uses `CPxx`.

---

## Part 5: Implementation Strategy

### Computing Income-Aware PPP

For a person earning net income `Y` in country `C`:

1. **Determine income quintile**: Map `Y` to a quintile (QU1-QU5) based on the income distribution of country C. This requires external income distribution data (e.g., from EU-SILC `ilc_di01`).

2. **Get spending shares**: From `hbs_str_t223`, retrieve the spending shares for that quintile in country C:
   ```
   w_food(C, q), w_housing(C, q), w_transport(C, q), ...
   ```

3. **Get price level indices**: From `prc_ppp_ind_1`, retrieve PLI for each category in country C:
   ```
   PLI_food(C), PLI_housing(C), PLI_transport(C), ...
   ```

4. **Compute weighted PPP**:
   ```
   income_aware_PPP(C, q) = SUM over categories k:
       w_k(C, q) * PLI_k(C) / 100
   ```

   This gives a PPP factor relative to EU27 average that accounts for the spending pattern of someone at income level q.

### Key Insight

A low-income earner in Switzerland who spends 35% on housing and 20% on food faces a very different price level than a high earner spending 20% on housing and 10% on food. The standard GDP-based PPP (around 160 for CH) overstates how expensive Switzerland is for high earners (who spend more on globally-traded goods with smaller price differentials) and understates it for low earners (who spend more on local services with large price differentials like housing).

### Data Limitations

1. **HBS survey frequency**: Only every 5 years. Most recent is 2020. Next will be 2025 (available ~2027). The spending patterns are relatively stable over 5 years for developed countries.

2. **Country coverage gap**: HBS has strong EU coverage but no US, JP, or CH data. For non-EU countries, we would need:
   - US: BLS Consumer Expenditure Survey (CE)
   - JP: Statistics Bureau Family Income and Expenditure Survey
   - CH: Swiss Federal Statistical Office (BFS) Household Budget Survey
   - These would need separate data pipelines

3. **Quintile granularity**: Only 5 income groups (quintiles), not continuous. For a smooth Engel curve, we could fit a parametric model (e.g., Working-Leser or QUAIDS) to the 5 data points.

4. **HBS COICOP vs PPP COICOP**: The category names are nearly identical but the COICOP 2018 reclassification (applied to PPP data from 2022+) slightly changes some categories (e.g., CP08 "Communications" became "Information and communication"). The HBS still uses the older labels.

5. **Italy missing from HBS 2020 quintile data**: Italy provided overall structure data but not by income quintile in the 2020 round (check data availability per country).

### Recommended Approach for this Project

Since the data is relatively static (annual for PLI, 5-yearly for HBS), pre-fetch and embed:

1. **Build a data pipeline** (Node.js script) that:
   - Fetches `prc_ppp_ind_1` PLI data for all 12 COICOP divisions, all countries, latest year
   - Fetches `hbs_str_t223` spending shares for all quintiles, all COICOP divisions, all countries, 2020
   - Outputs a static JSON file per country

2. **Bundle the JSON** into the application at build time

3. **At runtime**: Given a user's net income and country, look up the appropriate spending weights and price levels, compute a personalized PPP adjustment

This avoids runtime API calls, rate limit concerns, and latency issues.
