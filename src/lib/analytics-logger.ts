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
  breakdown?: Record<string, number>
  config_version_hash?: string
  [key: string]: unknown
}

interface LogAPIRequestParams {
  request: NextRequest
  endpoint: string
  method: string
  requestData: CalcRequest
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

/**
 * Extract geographic region from Cloudflare headers
 */
function getGeoRegion(request: NextRequest): string {
  try {
    const cfCountry = request.headers.get("cf-ipcountry")
    return cfCountry || ""
  } catch {
    return ""
  }
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
    const originCountry = getGeoRegion(request)
    const regionLevel1 = (requestData.region_level_1 || "").toLowerCase()
    const regionLevel2 = (requestData.region_level_2 || "").toLowerCase()
    const configVersionHash = (result?.config_version_hash || "") as string

    // Build indexes array (strings, max 20 for querying)
    // Index positions matter - document them for SQL queries
    const indexes = [
      endpoint, // 0: "/api/calc"
      country, // 1: "nl", "ch", etc
      year, // 2: "2025"
      variant, // 3: "30-ruling" or ""
      String(status), // 4: "200", "400", "500"
      errorType, // 5: error category or ""
      originCountry, // 6: "US", "NL", "DE"
      method, // 7: "POST", "GET"
    ]

    // Build blobs array (additional string dimensions)
    const blobs = [
      regionLevel1, // 0: canton, state, or ""
      regionLevel2, // 1: municipality or ""
      configVersionHash, // 2: for debugging config versions
    ]

    // Build doubles array (numeric metrics)
    const doubles = [
      gross, // 0: gross salary
      net, // 1: net salary
      effectiveRate, // 2: effective tax rate
      responseTime, // 3: response time in ms
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
 * SQL query examples for Analytics Engine:
 *
 * List all requests to /api/calc:
 * SELECT COUNT(*) as total_requests
 * FROM calc
 * WHERE indexes[0] = '/api/calc'
 * AND timestamp > NOW() - INTERVAL '24' HOUR
 *
 * Top calculation countries:
 * SELECT indexes[1] as country, COUNT(*) as requests
 * FROM calc
 * WHERE indexes[0] = '/api/calc' AND indexes[4] = '200'
 * GROUP BY indexes[1]
 * ORDER BY requests DESC
 *
 * Geographic distribution:
 * SELECT indexes[6] as origin_country, COUNT(*) as total_requests
 * FROM calc
 * WHERE indexes[0] = '/api/calc'
 * GROUP BY indexes[6]
 * ORDER BY total_requests DESC
 *
 * Average salary by country:
 * SELECT indexes[1] as country,
 *        AVG(doubles[0]) as avg_gross,
 *        AVG(doubles[1]) as avg_net,
 *        AVG(doubles[2]) as avg_effective_rate
 * FROM calc
 * WHERE indexes[0] = '/api/calc' AND indexes[4] = '200'
 * GROUP BY indexes[1]
 *
 * Error analysis:
 * SELECT indexes[5] as error_type, COUNT(*) as error_count
 * FROM calc
 * WHERE indexes[5] != ''
 * GROUP BY indexes[5]
 * ORDER BY error_count DESC
 *
 * Response time analysis:
 * SELECT indexes[1] as country,
 *        PERCENTILE_CONT(doubles[3], 0.5) as p50_ms,
 *        PERCENTILE_CONT(doubles[3], 0.95) as p95_ms,
 *        MAX(doubles[3]) as max_ms
 * FROM calc
 * WHERE indexes[0] = '/api/calc'
 * GROUP BY indexes[1]
 */
