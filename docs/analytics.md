# Analytics (Cloudflare Analytics Engine)

Server-side usage analytics for the calc API: what countries/years/variants and salary ranges users run, plus errors and response times. No client-side tracking.

## Config

- **Wrangler:** `wrangler.jsonc` is the source of truth (see `docs/implementation/build-system-migration.md`). Analytics Engine is configured there under `analytics_engine_datasets`.
- **Binding:** `ANALYTICS_ENGINE`
- **Dataset:** `calc_requests` (created automatically on first write)

Local dev has no binding, so logging is a no-op. In production (Cloudflare Workers), each successful or failed POST to `/api/calc` is logged.

## What is logged

- **Indexes:** endpoint, country (calculated), year, variant, HTTP status, error type, **visitor country**, method, **visitor region** (e.g. state), **visitor city**
- **Blobs:** region_level_1, region_level_2, config_version_hash
- **Doubles:** gross_annual, net, effective_rate, response time (ms)

Visitor location (country, region, city) comes from Cloudflare’s `request.cf` when running on Workers (no IP is logged; only geo-derived fields). Locally, only the `CF-IPCountry` header is used when present, so visitor country may be set but city/region stay empty.

See `src/lib/analytics-logger.ts` for the full schema and SQL query examples (top countries, average salary by country, error analysis, response times).

## Querying

Use the [Cloudflare Analytics Engine SQL API](https://developers.cloudflare.com/analytics/analytics-engine/get-started/#query-your-dataset) or the dashboard. Example (from the logger):

```sql
SELECT indexes[1] as country, COUNT(*) as requests
FROM calc_requests
WHERE indexes[0] = '/api/calc' AND indexes[4] = '200'
GROUP BY indexes[1]
ORDER BY requests DESC
```

Run `npm run cf-typegen` after changing `wrangler.jsonc` so `ANALYTICS_ENGINE` stays in the generated env types.
