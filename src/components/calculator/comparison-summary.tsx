"use client"

import { Card } from "@/components/ui/card"
import { getCountryFlag } from "@/lib/country-metadata"
import { type CalculationResult } from "@/lib/api"
import { useMemo, useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ComparisonSummaryProps {
  results: Map<string, {
    country: string
    year: string
    result: CalculationResult
  }>
  normalizedNetValues: Map<string, number>
  displayOrder?: string[]  // Optional array of IDs in display order
}

function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

export function ComparisonSummary({ results, normalizedNetValues, displayOrder }: ComparisonSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Find best values for highlighting
  const { bestNetId, bestEffectiveRateId } = useMemo(() => {
    if (normalizedNetValues.size < 2) {
      return { bestNetId: null, bestEffectiveRateId: null }
    }

    let maxNet = -Infinity
    let minRate = Infinity
    let netId: string | null = null
    let rateId: string | null = null

    for (const [id, normalizedNet] of normalizedNetValues.entries()) {
      const result = results.get(id)
      if (!result) continue

      if (normalizedNet > maxNet) {
        maxNet = normalizedNet
        netId = id
      }

      if (result.result.effective_rate < minRate) {
        minRate = result.result.effective_rate
        rateId = id
      }
    }

    return { bestNetId: netId, bestEffectiveRateId: rateId }
  }, [normalizedNetValues, results])

  // Calculate deltas in original currencies
  const getNetDelta = (id: string): number | null => {
    if (bestNetId === null || bestNetId === id) return null

    const bestNormalizedNet = normalizedNetValues.get(bestNetId)
    const currentNormalizedNet = normalizedNetValues.get(id)
    const currentResult = results.get(id)

    if (bestNormalizedNet === undefined || currentNormalizedNet === undefined || !currentResult) {
      return null
    }

    // Calculate delta in EUR
    const deltaInEur = currentNormalizedNet - bestNormalizedNet

    // Convert delta back to current country's currency
    const currentCurrency = currentResult.result.currency
    if (currentCurrency === "EUR") {
      return deltaInEur
    }

    // Approximate conversion using the ratio
    const originalNet = currentResult.result.net
    const ratio = originalNet / currentNormalizedNet
    return deltaInEur * ratio
  }

  // Calculate total deductions for each country
  const getTotalDeductions = (result: CalculationResult): number => {
    return result.breakdown
      .filter(item => item.category === "income_tax" || item.category === "contribution" || item.category === "surtax")
      .reduce((sum, item) => sum + item.amount, 0)
  }

  if (results.size < 2) {
    return null
  }

  // Use displayOrder if provided, otherwise use insertion order
  const sortedResults = displayOrder
    ? displayOrder.map(id => [id, results.get(id)]).filter(([, data]) => data !== undefined) as [string, {
        country: string;
        year: string;
        result: CalculationResult;
      }][]
    : Array.from(results.entries())

  return (
    <Card className="mb-4 md:mb-6">
      <div className="p-3 md:p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Comparison Summary</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 px-2"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {isExpanded && (
          <div className="overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0">
          <table className="w-full text-xs md:text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-2 md:pr-4 font-medium text-muted-foreground whitespace-nowrap">Metric</th>
                {sortedResults.map(([id, data]) => (
                  <th key={id} className="text-right py-2 px-2 md:px-3 font-medium">
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-base md:text-base">{getCountryFlag(data.country)}</span>
                      <span className="text-xs whitespace-nowrap">
                        {data.country.toUpperCase()} {data.year}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Gross Annual */}
              <tr className="border-b">
                <td className="py-2 pr-2 md:pr-4 text-muted-foreground whitespace-nowrap">Gross Annual</td>
                {sortedResults.map(([id, data]) => (
                  <td key={id} className="text-right py-2 px-2 md:px-3 font-mono whitespace-nowrap">
                    {formatCurrency(data.result.gross, data.result.currency)}
                  </td>
                ))}
              </tr>

              {/* Net Annual */}
              <tr className="border-b">
                <td className="py-2 pr-2 md:pr-4 text-muted-foreground whitespace-nowrap">Net Annual</td>
                {sortedResults.map(([id, data]) => {
                  const isBest = bestNetId === id
                  const delta = getNetDelta(id)
                  return (
                    <td key={id} className="text-right py-2 px-2 md:px-3">
                      <div className={`font-mono whitespace-nowrap ${isBest ? "text-green-600 font-bold" : ""}`}>
                        {formatCurrency(data.result.net, data.result.currency)}
                      </div>
                      {delta !== null && delta < 0 && (
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatCurrency(delta, data.result.currency)}
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>

              {/* Effective Rate */}
              <tr className="border-b">
                <td className="py-2 pr-2 md:pr-4 text-muted-foreground whitespace-nowrap">Effective Rate</td>
                {sortedResults.map(([id, data]) => {
                  const isBest = bestEffectiveRateId === id
                  return (
                    <td key={id} className={`text-right py-2 px-2 md:px-3 font-mono whitespace-nowrap ${isBest ? "text-green-600 font-bold" : ""}`}>
                      {formatPercent(data.result.effective_rate)}
                    </td>
                  )
                })}
              </tr>

              {/* Monthly Net */}
              <tr className="border-b">
                <td className="py-2 pr-2 md:pr-4 text-muted-foreground whitespace-nowrap">Monthly Net</td>
                {sortedResults.map(([id, data]) => {
                  const monthlyNet = data.result.net / 12
                  const isBest = bestNetId === id
                  return (
                    <td key={id} className={`text-right py-2 px-2 md:px-3 font-mono whitespace-nowrap ${isBest ? "text-green-600 font-bold" : ""}`}>
                      {formatCurrency(monthlyNet, data.result.currency)}
                    </td>
                  )
                })}
              </tr>

              {/* Total Deductions */}
              <tr>
                <td className="py-2 pr-2 md:pr-4 text-muted-foreground whitespace-nowrap">Total Deductions</td>
                {sortedResults.map(([id, data]) => {
                  const totalDeductions = getTotalDeductions(data.result)
                  return (
                    <td key={id} className="text-right py-2 px-2 md:px-3 font-mono text-destructive whitespace-nowrap">
                      {formatCurrency(totalDeductions, data.result.currency)}
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
        )}
      </div>
    </Card>
  )
}
