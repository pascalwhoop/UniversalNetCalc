"use client"

import { useEffect, useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, PieChart, Pie, Label } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { getCurrencySymbol, type CalculationResult } from "@/lib/api"
import { useChartData } from "@/lib/queries"

interface RangeDataPoint {
  gross: number
  net: number
  tax: number
  social: number
  netPercent: number
  taxPercent: number
  socialPercent: number
  isAboveCurrent?: boolean
}

interface SalaryRangeChartProps {
  country: string
  year: string
  variant?: string
  currentGross: number
  currency: string
  formValues: Record<string, string>
  result: CalculationResult
}

const barChartConfig = {
  net: {
    label: "Net",
    color: "var(--chart-1)",
  },
  tax: {
    label: "Tax",
    color: "var(--chart-2)",
  },
  social: {
    label: "Social",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

const pieChartConfig = {
  amount: {
    label: "Amount",
    color: "var(--chart-4)",
  },
  net: {
    label: "Net",
    color: "var(--chart-1)",
  },
  tax: {
    label: "Tax",
    color: "var(--chart-2)",
  },
  social: {
    label: "Social",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

function formatCompactCurrency(value: number, currency: string): string {
  const symbol = getCurrencySymbol(currency)
  if (value >= 1000000) {
    return `${symbol}${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${symbol}${(value / 1000).toFixed(0)}k`
  }
  return `${symbol}${value}`
}

export function SalaryRangeChart({
  country,
  year,
  variant,
  currentGross,
  currency,
  formValues,
  result,
}: SalaryRangeChartProps) {
  const chartMutation = useChartData()

  const isLoading = chartMutation.isPending
  const error = chartMutation.error?.message ?? null
  const rawData = chartMutation.data

  // Filter out invalid data points and mark bars above current salary
  const data = useMemo(() => {
    if (!rawData?.dataPoints) return null

    const validData = rawData.dataPoints
      .filter(
        (point: RangeDataPoint) =>
          !isNaN(point.net) &&
          !isNaN(point.tax) &&
          !isNaN(point.social) &&
          !isNaN(point.gross) &&
          isFinite(point.net) &&
          isFinite(point.tax) &&
          isFinite(point.social) &&
          isFinite(point.gross) &&
          point.gross > 0
      )
      .map((point: RangeDataPoint) => ({
        ...point,
        isAboveCurrent: point.gross > currentGross,
      }))
      .sort((a, b) => a.gross - b.gross)

    return validData.length > 0 ? validData : null
  }, [rawData, currentGross])

  // Calculate pie chart data from result breakdown
  const pieData = useMemo(() => {
    let taxTotal = 0
    let socialTotal = 0

    for (const item of result.breakdown) {
      if (item.category === "income_tax" || item.category === "surtax") {
        taxTotal += item.amount
      } else if (item.category === "contribution") {
        socialTotal += item.amount
      }
    }

    // Credits reduce tax
    for (const item of result.breakdown) {
      if (item.category === "credit") {
        taxTotal = Math.max(0, taxTotal - item.amount)
      }
    }

    return [
      {
        name: "net",
        amount: result.net,
        fill: "var(--color-net)",
      },
      {
        name: "social",
        amount: socialTotal,
        fill: "var(--color-social)",
      },
      {
        name: "tax",
        amount: taxTotal,
        fill: "var(--color-tax)",
      },
    ].filter((item) => item.amount > 0) // Only show segments with values
  }, [result])

  const effectiveRate = useMemo(() => {
    return (result.effective_rate * 100).toFixed(1)
  }, [result])

  // Create stable dependency key from form values
  const formValuesKey = Object.entries(formValues)
    .filter(([key]) => key !== 'gross_annual')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join('|')

  // Auto-fetch chart data when parameters change
  useEffect(() => {
    if (!country || !year || currentGross <= 0) {
      chartMutation.reset()
      return
    }

      const timer = setTimeout(() => {
        chartMutation.mutate({
          country,
          year,
          variant,
          formValues,
          maxSalary: currentGross,
          currentSalary: currentGross,
        })
      }, 300)

    return () => {
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, year, variant, currentGross, formValuesKey])

  if (!country || !year || !currentGross) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Pie Chart - Current Salary Breakdown */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Current Salary Split</p>
        <ChartContainer config={pieChartConfig} className="mx-auto aspect-square max-h-[180px]">
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value) => formatCompactCurrency(Number(value), currency)}
                />
              }
            />
            <Pie
              data={pieData}
              dataKey="amount"
              nameKey="name"
              innerRadius={50}
              strokeWidth={5}
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-2xl font-bold"
                        >
                          {effectiveRate}%
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 20}
                          className="fill-muted-foreground text-xs"
                        >
                          Tax Rate
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="flex justify-center gap-4 mt-2">
          {pieData.map((item) => {
            const configItem = pieChartConfig[item.name as keyof typeof pieChartConfig]
            return (
              <div key={item.name} className="flex items-center gap-1.5">
                <div
                  className="h-2 w-2 rounded-sm"
                  style={{ backgroundColor: configItem.color }}
                />
                <span className="text-xs text-muted-foreground capitalize">
                  {configItem.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bar Chart - Range Breakdown */}
      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-[200px] w-full" />
        </div>
      )}

      {error && (
        <div className="text-xs text-destructive p-2 rounded bg-destructive/10">
          {error}
        </div>
      )}

      {!isLoading && data && data.length > 0 && (
        <>
          <div className="mb-2">
            <p className="text-xs font-medium text-muted-foreground">Salary Breakdown by Income Level</p>
          </div>
          <div>
            <ChartContainer config={barChartConfig} className="h-[200px] w-full">
              <BarChart
                accessibilityLayer
                data={data}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="gross"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => formatCompactCurrency(value, currency)}
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => formatCompactCurrency(value, currency)}
                  tick={{ fontSize: 10 }}
                  width={45}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(value, name) => {
                        const numValue = Number(value)
                        if (isNaN(numValue)) return null
                        return formatCompactCurrency(numValue, currency)
                      }}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                {/* Stacked bars - order matters: bottom to top */}
                <Bar
                  dataKey="net"
                  stackId="a"
                  radius={[0, 0, 4, 4]}
                  isAnimationActive={true}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {data.map((entry, index) => {
                    const baseColor = entry.isAboveCurrent 
                      ? "#e5e7eb" 
                      : "var(--color-net)"
                    return (
                      <Cell
                        key={`cell-net-${index}`}
                        fill={baseColor}
                      />
                    )
                  })}
                </Bar>
                <Bar
                  dataKey="social"
                  stackId="a"
                  radius={[0, 0, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {data.map((entry, index) => {
                    const baseColor = entry.isAboveCurrent 
                      ? "#d1d5db" 
                      : "var(--color-social)"
                    return (
                      <Cell
                        key={`cell-social-${index}`}
                        fill={baseColor}
                      />
                    )
                  })}
                </Bar>
                <Bar
                  dataKey="tax"
                  stackId="a"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {data.map((entry, index) => {
                    const baseColor = entry.isAboveCurrent 
                      ? "#9ca3af" 
                      : "var(--color-tax)"
                    return (
                      <Cell
                        key={`cell-tax-${index}`}
                        fill={baseColor}
                      />
                    )
                  })}
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
        </>
      )}
    </div>
  )
}
