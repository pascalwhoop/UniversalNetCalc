import { NextRequest } from "next/server"
import { getCloudflareContext } from "@opennextjs/cloudflare"

interface CalcRequest {
  country: string
  year: string | number
  variant?: string
  region_level_1?: string
  region_level_2?: string
  gross_annual: number
  filing_status?: string
  [key: string]: unknown
}

interface CalculationResult {
  gross?: number
  net?: number
  effective_rate?: number
  config_version_hash?: string
  [key: string]: unknown
}

interface LogAPIRequestParams {
  request: NextRequest
  endpoint: string
  method: string
  requestData: Partial<CalcRequest>
  result?: CalculationResult
  error?: Error
  status: number
  responseTime: number
}

interface CloudflareAnalyticsEngine {
  writeDataPoint(data: {
    indexes?: string[]
    blobs?: string[]
    doubles?: number[]
  }): void
}

/**
 * Get Analytics Engine binding from Cloudflare context
 */
function getAnalyticsEngine(): unknown {
  try {
    const ctx = getCloudflareContext()
    return (ctx.env as unknown as Record<string, unknown>).ANALYTICS_ENGINE
  } catch {
    // Running locally without Cloudflare context
    return undefined
  }
}

/** Cloudflare geo on the request (present when running on Workers) */
interface RequestCfGeo {
  country?: string | null
  city?: string | null
  region?: string | null
  regionCode?: string | null
}

function getRequestCf(request: NextRequest): RequestCfGeo | undefined {
  try {
    return (request as NextRequest & { cf?: RequestCfGeo }).cf
  } catch {
    return undefined
  }
}

/** Visitor geo: country, city, region. Uses request.cf on Workers; falls back to CF-IPCountry header. */
function getVisitorGeo(request: NextRequest): {
  country: string
  city: string
  region: string
} {
  const cf = getRequestCf(request)
  const country = (cf?.country ?? request.headers.get("cf-ipcountry") ?? "").toUpperCase() || ""
  const city = (cf?.city ?? "").trim() || ""
  const region = (cf?.regionCode ?? cf?.region ?? "").trim() || ""
  return { country, city, region }
}

/**
 * Categorize errors into types for analytics
 */
function categorizeError(error: Error): string {
  const message = error.message || ""
  const name = error.name || ""

  if (message.includes("ENOENT") || message.includes("not found")) {
    return "config_not_found"
  }
  if (name === "YAMLException" || message.includes("YAML")) {
    return "yaml_error"
  }
  if (message.includes("required fields")) {
    return "validation_error"
  }
  if (
    message.includes("undefined") ||
    message.includes("is not a function")
  ) {
    return "calculation_error"
  }
  return "unknown_error"
}

/**
 * Log API request to Analytics Engine
 * Non-blocking, gracefully degrades if Analytics Engine unavailable
 */
export async function logAPIRequest(
  params: LogAPIRequestParams
): Promise<void> {
  const analyticsEngine = getAnalyticsEngine()

  // Gracefully skip logging if Analytics Engine not available (local dev)
  if (!analyticsEngine) {
    return
  }

  try {
    const {
      request,
      endpoint,
      method,
      requestData,
      result,
      error,
      status,
      responseTime,
    } = params

    // Extract data for analytics
    const country = (requestData.country || "").toLowerCase()
    const year = String(requestData.year || "")
    const variant = (requestData.variant || "").toLowerCase()
    const gross = requestData.gross_annual || 0
    const net = result?.net || 0
    const effectiveRate = result?.effective_rate || 0
    const errorType = error ? categorizeError(error) : ""
    const visitor = getVisitorGeo(request)
    const regionLevel1 = (requestData.region_level_1 || "").toLowerCase()
    const regionLevel2 = (requestData.region_level_2 || "").toLowerCase()
    const configVersionHash = (result?.config_version_hash || "") as string

    // Analytics Engine limits: exactly 1 index (sampling key), up to 20 blobs (string dims),
    // up to 20 doubles (numeric metrics). SQL columns: blob1..blob20, double1..double20, index1.
    const indexes = [
      endpoint, // index1: sampling key — "/api/calc"
    ]

    // Blobs are the queryable string dimensions (referenced as blob1, blob2, ... in SQL)
    const blobs = [
      country,               // blob1:  calculated country e.g. "nl", "ch"
      year,                  // blob2:  tax year e.g. "2025"
      variant,               // blob3:  variant e.g. "30-ruling" or ""
      String(status),        // blob4:  HTTP status "200", "400", "500"
      errorType,             // blob5:  error category or ""
      visitor.country,       // blob6:  visitor country "US", "NL", "DE"
      method,                // blob7:  "POST", "GET"
      visitor.region,        // blob8:  visitor region/state e.g. "TX", "California"
      visitor.city,          // blob9:  visitor city e.g. "Austin"
      regionLevel1,          // blob10: canton, state, or ""
      regionLevel2,          // blob11: municipality or ""
      configVersionHash,     // blob12: config version for debugging
    ]

    // Doubles are numeric metrics (referenced as double1, double2, ... in SQL)
    const doubles = [
      gross,        // double1: gross salary
      net,          // double2: net salary
      effectiveRate, // double3: effective tax rate
      responseTime, // double4: response time in ms
    ]

    // Write to Analytics Engine
    // Type assertion is safe because we validate existence above
    const engine = analyticsEngine as CloudflareAnalyticsEngine
    engine.writeDataPoint({
      indexes,
      blobs,
      doubles,
    })
  } catch (logError) {
    // Log errors but don't throw - analytics shouldn't break the API
    console.warn("Analytics logging error:", logError)
  }
}

/**
 * SQL query examples for Analytics Engine (columns are 1-indexed):
 * blob1=country, blob2=year, blob3=variant, blob4=status, blob5=error_type,
 * blob6=visitor_country, blob7=method, blob8=visitor_region, blob9=visitor_city,
 * blob10=region_level_1, blob11=region_level_2, blob12=config_version_hash
 * double1=gross, double2=net, double3=effective_rate, double4=response_time_ms
 *
 * Count all requests in last 24h:
 * SELECT COUNT(*) as total_requests
 * FROM calc_requests
 * WHERE timestamp > NOW() - INTERVAL '24' HOUR
 *
 * Top calculation countries:
 * SELECT blob1 as country, COUNT(*) as requests
 * FROM calc_requests
 * WHERE blob4 = '200'
 * GROUP BY blob1
 * ORDER BY requests DESC
 *
 * Geographic distribution (visitor country):
 * SELECT blob6 as visitor_country, COUNT(*) as total_requests
 * FROM calc_requests
 * GROUP BY blob6
 * ORDER BY total_requests DESC
 *
 * By visitor region and city:
 * SELECT blob6 as country, blob8 as region, blob9 as city, COUNT(*) as n
 * FROM calc_requests
 * WHERE blob4 = '200'
 * GROUP BY blob6, blob8, blob9
 * ORDER BY n DESC
 *
 * Average salary by country:
 * SELECT blob1 as country,
 *        AVG(double1) as avg_gross,
 *        AVG(double2) as avg_net,
 *        AVG(double3) as avg_effective_rate
 * FROM calc_requests
 * WHERE blob4 = '200'
 * GROUP BY blob1
 *
 * Error analysis:
 * SELECT blob5 as error_type, COUNT(*) as error_count
 * FROM calc_requests
 * WHERE blob5 != ''
 * GROUP BY blob5
 * ORDER BY error_count DESC
 *
 * Response time by country (p50/p95):
 * SELECT blob1 as country,
 *        PERCENTILE_CONT(double4, 0.5) as p50_ms,
 *        PERCENTILE_CONT(double4, 0.95) as p95_ms,
 *        MAX(double4) as max_ms
 * FROM calc_requests
 * GROUP BY blob1
 */
