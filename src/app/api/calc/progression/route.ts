import { NextRequest, NextResponse } from "next/server"
import { CalculationEngine, ConfigLoader } from "../../../../../packages/engine/src"
import { join } from "path"

const configLoader = new ConfigLoader(join(process.cwd(), "configs"))

export interface CalcRequestWithId {
  id: string
  country: string
  year: string | number
  gross_annual: number
  variant?: string
  [key: string]: string | number | boolean | undefined | unknown // Allow dynamic inputs
}

const MAX_REQUESTS = 8
const MIN_STEP_SIZE = 5000
const MAX_RANGE = 1_000_000

interface ProgressionRequest {
  requests: CalcRequestWithId[]
  min_gross?: number
  max_gross?: number
  step_size?: number
}

export async function POST(request: NextRequest) {
  try {
    const body: ProgressionRequest = await request.json()
    const { requests, min_gross = 5000, max_gross = 900000, step_size = 17000 } = body

    if (!requests || !Array.isArray(requests)) {
      return NextResponse.json({ error: "Invalid request, expected requests array" }, { status: 400 })
    }

    if (requests.length > MAX_REQUESTS) {
      return NextResponse.json({ error: `Too many requests; maximum is ${MAX_REQUESTS}` }, { status: 400 })
    }

    const range = max_gross - min_gross
    if (range <= 0 || range > MAX_RANGE) {
      return NextResponse.json({ error: `Gross range must be between 1 and ${MAX_RANGE}` }, { status: 400 })
    }

    if (step_size < MIN_STEP_SIZE) {
      return NextResponse.json({ error: `step_size must be at least ${MIN_STEP_SIZE}` }, { status: 400 })
    }

    const results: Record<string, Array<{ gross: number, net: number, currency: string, effective_rate: number, marginal_rate?: number }>> = {}

    for (const req of requests) {
      if (!req.country || !req.year) continue

      try {
        const config = await configLoader.loadConfig(req.country, req.year, req.variant)
        const engine = new CalculationEngine(config)

        const dataPoints = []
        
        for (let testGross = min_gross; testGross <= max_gross; testGross += step_size) {
          // exclude 'id' and 'gross_annual' from the calculation inputs
          const { id: _id, gross_annual: _ga, ...engineInputs } = req
          
          const engineInputsForCalc = {
            ...engineInputs,
            gross_annual: testGross
          } as Record<string, string | number | boolean | Record<string, unknown> | undefined>

          const result = engine.calculate(engineInputsForCalc)
          const marginalRate = engine.calculateMarginalRate(engineInputsForCalc)
          
          dataPoints.push({
            gross: testGross,
            net: result.net,
            currency: config.meta.currency,
            effective_rate: result.effective_rate,
            marginal_rate: marginalRate
          })
        }
        
        results[req.id] = dataPoints
      } catch (err) {
        console.error(`Error calculating progression for ${req.country}:`, err)
        // Skip this country on error
      }
    }

    return NextResponse.json({ results })
  } catch (error: unknown) {
    console.error("Progression calculation error:", error)
    return NextResponse.json({ error: "Calculation failed" }, { status: 500 })
  }
}
