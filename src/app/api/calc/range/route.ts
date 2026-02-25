import { NextRequest, NextResponse } from "next/server"
import { CalculationEngine, ConfigLoader } from "../../../../../packages/engine/src"
import { join } from "path"

interface RangeCalcRequest {
  country: string
  year: string | number
  variant?: string
  max_salary: number
  current_salary?: number // Current salary to split bars around
  step?: number // Default 1000
  [key: string]: unknown // Allow additional inputs like filing_status, region_level_1, etc.
}

interface RangeDataPoint {
  gross: number
  net: number
  tax: number
  social: number
  netPercent: number
  taxPercent: number
  socialPercent: number
}

// Singleton config loader
const configLoader = new ConfigLoader(join(process.cwd(), "configs"))

function computeDataPoint(
  engine: InstanceType<typeof CalculationEngine>,
  baseInputs: Record<string, unknown>,
  gross: number
): RangeDataPoint | null {
  try {
    const result = engine.calculate({ ...baseInputs, gross_annual: gross })

    let taxTotal = 0
    let socialTotal = 0

    for (const item of result.breakdown) {
      if (item.category === "income_tax" || item.category === "surtax") {
        taxTotal += item.amount
      } else if (item.category === "contribution") {
        socialTotal += item.amount
      }
    }

    // Credits reduce tax (but don't go negative)
    for (const item of result.breakdown) {
      if (item.category === "credit") {
        taxTotal = Math.max(0, taxTotal - item.amount)
      }
    }

    const netAmount = result.net
    const grossAmount = result.gross

    if (grossAmount === 0) return null

    return {
      gross: grossAmount,
      net: netAmount,
      tax: taxTotal,
      social: socialTotal,
      netPercent: (netAmount / grossAmount) * 100,
      taxPercent: (taxTotal / grossAmount) * 100,
      socialPercent: (socialTotal / grossAmount) * 100,
    }
  } catch (e) {
    console.warn(`Skipping calculation for gross=${gross}:`, e)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: RangeCalcRequest = await request.json()

    // Validate required fields
    if (!body.country || !body.year || !body.max_salary) {
      return NextResponse.json(
        {
          error: "Missing required fields: country, year, max_salary",
        },
        { status: 400 }
      )
    }

    const currentSalary = body.current_salary || body.max_salary
    const barsBelow = 20
    const barsAbove = 3
    
    // Calculate step sizes
    const stepBelow = currentSalary / barsBelow
    const maxSalary = currentSalary * 1.3 // 30% above current salary
    const rangeAbove = maxSalary - currentSalary

    // Load configuration once
    const config = await configLoader.loadConfig(
      body.country,
      body.year,
      body.variant
    )

    const engine = new CalculationEngine(config)
    const dataPoints: RangeDataPoint[] = []

    // Prepare base inputs (excluding gross_annual which we'll iterate)
    const baseInputs: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(body)) {
      if (!["country", "year", "variant", "max_salary", "current_salary", "step"].includes(key)) {
        baseInputs[key] = value
      }
    }

    // Calculate bars below/at current salary (20 bars)
    for (let i = 1; i <= barsBelow; i++) {
      const gross = (currentSalary / barsBelow) * i
      const point = computeDataPoint(engine, baseInputs, gross)
      if (point) dataPoints.push(point)
    }

    // Calculate bars above current salary (3 bars)
    for (let i = 1; i <= barsAbove; i++) {
      const gross = currentSalary + (rangeAbove / barsAbove) * i
      const point = computeDataPoint(engine, baseInputs, gross)
      if (point) dataPoints.push(point)
    }

    return NextResponse.json({
      currency: config.meta.currency,
      maxSalary,
      currentSalary,
      step: stepBelow,
      dataPoints,
    })
  } catch (error: unknown) {
    console.error("Range calculation error:", error)

    const err = error as { code?: string; message?: string }

    if (err.code === "ENOENT") {
      return NextResponse.json(
        {
          error: "Configuration not found",
          details: `No config found for the selected country/year`,
        },
        { status: 404 }
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
