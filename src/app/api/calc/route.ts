import { NextRequest, NextResponse } from "next/server"
import { CalculationEngine, ConfigLoader } from "../../../../packages/engine/src"
import { join } from "path"

interface CalcRequest {
  country: string
  year: string | number
  variant?: string
  region_level_1?: string
  region_level_2?: string
  gross_annual: number
  filing_status?: string
  [key: string]: unknown // Allow additional inputs
}

/**
 * Singleton ConfigLoader instance
 *
 * This is intentional and safe:
 * - In Cloudflare Workers: Each request runs in an isolate, but modules are shared
 *   within that isolate. The cache is beneficial for performance when handling
 *   multiple related requests within the same isolate lifecycle.
 * - In local dev: Node.js module caching provides similar behavior.
 * - The ConfigLoader's internal cache is purely for performance; configs are immutable
 *   once loaded and validated.
 *
 * Security: Input validation is performed in ConfigLoader.loadConfig() to prevent
 * path traversal attacks before any file operations occur.
 */
const isCloudflareWorkers = typeof caches !== 'undefined' && 'default' in caches
const configsPath = isCloudflareWorkers ? "configs" : join(process.cwd(), "configs")
const configLoader = new ConfigLoader(configsPath)

export async function POST(request: NextRequest) {
  try {
    const body: CalcRequest = await request.json()

    // Validate required fields
    if (!body.country || !body.year || body.gross_annual === undefined) {
      return NextResponse.json(
        {
          error: "Missing required fields: country, year, gross_annual",
        },
        { status: 400 }
      )
    }

    // Load configuration (input validation happens inside loadConfig)
    const config = await configLoader.loadConfig(
      body.country,
      body.year,
      body.variant
    )

    // Prepare inputs for engine
    const inputs: Record<string, unknown> = {
      gross_annual: body.gross_annual,
    }

    // Add all other inputs from request
    for (const [key, value] of Object.entries(body)) {
      if (key !== "country" && key !== "year" && key !== "variant") {
        inputs[key] = value
      }
    }

    // Execute calculation
    const engine = new CalculationEngine(config)
    const result = engine.calculate(inputs as Record<string, string | number | boolean | Record<string, unknown> | undefined>)

    // Calculate marginal rate
    const marginal_rate = engine.calculateMarginalRate(inputs as Record<string, string | number | boolean | Record<string, unknown> | undefined>)

    return NextResponse.json({ ...result, marginal_rate })
  } catch (error: unknown) {
    console.error("Calculation error:", error)

    const err = error as { code?: string; name?: string; message?: string }

    // Handle input validation errors (path traversal prevention)
    if (err.message?.includes("Invalid country") ||
        err.message?.includes("Invalid year") ||
        err.message?.includes("Invalid variant")) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: err.message,
        },
        { status: 400 }
      )
    }

    if (err.code === "ENOENT") {
      return NextResponse.json(
        {
          error: "Configuration not found",
          details: `No config found for the selected country/year`,
        },
        { status: 404 }
      )
    }

    // Handle YAML parsing errors
    if (err.name === "YAMLException" || err.message?.includes("YAML")) {
      return NextResponse.json(
        {
          error: "Invalid configuration",
          details: `The tax configuration for this country has errors: ${err.message}`,
        },
        { status: 500 }
      )
    }

    // Handle calculation engine errors
    if (err.message?.includes("not found") || err.message?.includes("undefined")) {
      return NextResponse.json(
        {
          error: "Configuration error",
          details: `The tax configuration is incomplete or invalid: ${err.message}`,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        error: "Calculation failed",
        details: err.message || "An unexpected error occurred",
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action")

  try {
    if (action === "countries") {
      const countries = await configLoader.listCountries()
      return NextResponse.json({ countries })
    }

    if (action === "years") {
      const country = searchParams.get("country")
      if (!country) {
        return NextResponse.json(
          { error: "country parameter required" },
          { status: 400 }
        )
      }
      const years = await configLoader.listYears(country)
      return NextResponse.json({ years })
    }

    if (action === "variants") {
      const country = searchParams.get("country")
      const year = searchParams.get("year")
      if (!country || !year) {
        return NextResponse.json(
          { error: "country and year parameters required" },
          { status: 400 }
        )
      }
      const variants = await configLoader.listVariants(country, year)
      return NextResponse.json({ variants })
    }

    if (action === "inputs") {
      const country = searchParams.get("country")
      const year = searchParams.get("year")
      const variant = searchParams.get("variant")
      if (!country || !year) {
        return NextResponse.json(
          { error: "country and year parameters required" },
          { status: 400 }
        )
      }
      const config = await configLoader.loadConfig(country, year, variant || undefined)
      return NextResponse.json({
        inputs: config.inputs,
        currency: config.meta.currency,
        notices: config.notices || [],
      })
    }

    // Default: return API documentation
    return NextResponse.json({
      message:
        "Universal Salary Calculator API",
      endpoints: {
        "POST /api/calc": {
          description: "Calculate net salary",
          body: {
            country: "ISO 3166-1 alpha-2 code (e.g. 'nl', 'de', 'ch')",
            year: "Tax year (e.g. 2024)",
            gross_annual: "Annual gross salary (required)",
            variant: "Optional variant (e.g. '30-ruling')",
            filing_status: "Optional filing status",
            region_level_1: "Optional region (e.g. canton)",
            region_level_2: "Optional sub-region (e.g. municipality)",
          },
          example: {
            country: "nl",
            year: 2024,
            gross_annual: 60000,
            filing_status: "single",
          },
        },
        "GET /api/calc?action=countries": {
          description: "List available countries",
        },
        "GET /api/calc?action=years&country=nl": {
          description: "List available years for a country",
        },
        "GET /api/calc?action=variants&country=nl&year=2024": {
          description: "List available variants for a country/year",
        },
      },
    })
  } catch (error: unknown) {
    console.error("API error:", error)
    const err = error as { message?: string }

    // Handle input validation errors
    if (err.message?.includes("Invalid country") ||
        err.message?.includes("Invalid year") ||
        err.message?.includes("Invalid variant")) {
      return NextResponse.json(
        { error: "Invalid input", details: err.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    )
  }
}
