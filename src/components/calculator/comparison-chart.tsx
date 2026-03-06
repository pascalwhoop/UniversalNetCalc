"use client"

import { useEffect, useState, useMemo } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { CountryColumnState } from "@/lib/types"
import { getCountryName } from "@/lib/api"
import { getExchangeRate } from "@/lib/api"
import { formatCurrency, formatPercent } from "@/lib/formatters"

interface ComparisonChartProps {
  countries: CountryColumnState[]
  baseCurrency: string
}

interface ChartDataPoint {
  gross: number
  label: string
  [key: string]: number | string | undefined
}

type MetricType = "net" | "effective" | "marginal"

const metrics: { id: MetricType; title: string; desc: string }[] = [
  { id: "net", title: "Net Salary", desc: "Absolute take-home pay across income levels" },
  { id: "effective", title: "Effective Tax Rate", desc: "Total tax as a percentage of gross income" },
  { id: "marginal", title: "Marginal Tax Rate", desc: "Tax rate on the next euro/dollar earned" },
]

export function ComparisonChart({ countries, baseCurrency }: ComparisonChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [metric, setMetric] = useState<MetricType>("marginal")

  const validCountries = useMemo(() => {
    return countries.filter(c => c.country && c.year)
  }, [countries])

  // Stable string key: only re-fetch when country selection or year changes.
  // Intentionally excludes formValues, gross_annual, result etc. to avoid
  // spurious fetches when unrelated state changes.
  const validCountriesDeps = useMemo(() => {
    return JSON.stringify(validCountries.map(c => ({ id: c.id, c: c.country, y: c.year, v: c.variant })))
  }, [validCountries])

  // Compute a clean range: half the min configured salary → 3× the max, with round step size
  const { minGross, maxGross, stepSize } = useMemo(() => {
    const salaries = validCountries
      .map(c => parseFloat(c.gross_annual))
      .filter(v => !isNaN(v) && v > 0)
    if (salaries.length === 0) return { minGross: 10000, maxGross: 300000, stepSize: 10000 }

    const lo = Math.min(...salaries)
    const hi = Math.max(...salaries)
    // Round down/up to nearest 10k for clean boundaries
    const rawMin = Math.floor((lo * 0.5) / 10000) * 10000
    const rawMax = Math.ceil((hi * 3) / 10000) * 10000
    const range = rawMax - rawMin
    // Pick the largest "nice" step that gives >= 50 data points
    const nice = [20000, 10000, 5000]
    const step = nice.find(s => range / s >= 50) ?? 10000
    return {
      minGross: Math.max(0, rawMin),
      maxGross: Math.ceil(rawMax / step) * step, // ensure max is a multiple of step
      stepSize: step,
    }
  }, [validCountries])

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {}
    validCountries.forEach((c, index) => {
      config[c.id] = {
        label: c.country ? getCountryName(c.country) : `Destination ${c.index + 1}`,
        color: `var(--chart-${(index % 5) + 1})`,
      }
    })
    return config
  }, [validCountries])

  useEffect(() => {
    let active = true

    async function fetchProgression() {
      if (validCountries.length === 0) {
        setChartData([])
        return
      }

      setLoading(true)
      try {
        const res = await fetch("/api/calc/progression", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requests: validCountries.map(c => ({
              id: c.id,
              country: c.country,
              year: c.year,
              variant: c.variant,
              gross_annual: c.gross_annual,
              ...c.formValues,
            })),
            min_gross: minGross,
            max_gross: maxGross,
            step_size: stepSize,
          }),
        })

        if (!res.ok) throw new Error("Failed to fetch progression")

        const data = await res.json()
        const results = (data as { results: Record<string, Array<{ gross: number, net: number, currency: string, effective_rate: number, marginal_rate?: number }>> }).results

        const rates: Record<string, number> = {}
        for (const c of validCountries) {
          const sourceCurrency = c.result?.currency || c.currency || "EUR"
          try {
            rates[c.id] = await getExchangeRate(sourceCurrency, baseCurrency)
          } catch {
            rates[c.id] = 1
          }
        }

        if (!active) return

        const steps = Math.round((maxGross - minGross) / stepSize)

        const mergedData: ChartDataPoint[] = []
        for (let i = 0; i <= steps; i++) {
          const currentGross = minGross + (i * stepSize)
          const point: ChartDataPoint = {
            gross: currentGross,
            label: formatCurrency(currentGross, baseCurrency),
          }

          validCountries.forEach(c => {
            const countryData = results[c.id]
            if (countryData && countryData[i]) {
              const netValue = countryData[i].net
              const rate = rates[c.id] || 1
              point[`${c.id}_net`] = netValue * rate
              point[`${c.id}_effective`] = countryData[i].effective_rate
              point[`${c.id}_marginal`] = countryData[i].marginal_rate ?? countryData[i].effective_rate
              point[`${c.id}_original_net`] = netValue
              point[`${c.id}_original_gross`] = countryData[i].gross
              point[`${c.id}_currency`] = countryData[i].currency
            }
          })

          mergedData.push(point)
        }

        setChartData(mergedData)
      } catch (err) {
        console.error(err)
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchProgression()

    return () => { active = false }
    // validCountriesDeps is the content-based dep; validCountries ref is intentionally
    // excluded to avoid re-fetching when unrelated country state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseCurrency, validCountriesDeps, minGross, maxGross, stepSize])

  if (validCountries.length === 0) return null

  const currentMetric = metrics.find(m => m.id === metric)!

  const yAxisFormatter = (value: number) => {
    if (metric === "net") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: baseCurrency,
        maximumFractionDigits: 0,
        notation: "compact",
      }).format(value)
    }
    return formatPercent(value)
  }

  return (
    <div className="mt-6">
      <Card className="flex flex-col">
        <CardHeader className="border-b pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="grid gap-1">
              <CardTitle className="text-base">{currentMetric.title}</CardTitle>
              <CardDescription className="text-xs">{currentMetric.desc}</CardDescription>
            </div>
            <Select value={metric} onValueChange={v => setMetric(v as MetricType)}>
              <SelectTrigger className="w-[175px] shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {metrics.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Country legend — always visible, important on mobile where hover is unavailable */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
            {validCountries.map((c, index) => (
              <div key={c.id} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <div
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: `var(--chart-${(index % 5) + 1})` }}
                />
                <span>{c.country ? getCountryName(c.country) : `Destination ${c.index + 1}`}</span>
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {loading && chartData.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
              Calculating...
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ left: 0, right: 12, top: 12, bottom: 12 }}
                >
                  <defs>
                    {validCountries.map((c, index) => {
                      const color = `var(--chart-${(index % 5) + 1})`
                      return (
                        <linearGradient key={`fill-${c.id}`} id={`fill-${c.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                          <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                        </linearGradient>
                      )
                    })}
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="gross"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={48}
                    tickFormatter={(value) =>
                      new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: baseCurrency,
                        maximumFractionDigits: 0,
                        notation: "compact",
                      }).format(value as number)
                    }
                  />
                  <YAxis
                    tickFormatter={yAxisFormatter}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    width={metric === "net" ? 55 : 45}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={({ active, payload, label }) => {
                      if (!active || !payload) return null
                      return (
                        <div className="rounded-lg border bg-background p-3 shadow-md min-w-[200px]">
                          <div className="mb-3 text-sm font-semibold text-foreground border-b pb-2">
                            Gross: {formatCurrency(label as number, baseCurrency)}
                          </div>
                          <div className="space-y-1">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {payload.map((entry: any) => {
                              const cId = (entry.dataKey as string).replace(/_(net|effective|marginal)$/, "")
                              const name = chartConfig[cId]?.label || cId
                              const originalNet = entry.payload[`${cId}_original_net`] as number
                              const currency = entry.payload[`${cId}_currency`] as string
                              const effRate = entry.payload[`${cId}_effective`] as number | undefined
                              const margRate = entry.payload[`${cId}_marginal`] as number | undefined
                              const netVal = entry.payload[`${cId}_net`] as number
                              const isRateMetric = metric === "effective" || metric === "marginal"
                              const primaryValue = isRateMetric ? (entry.value as number) : netVal

                              return (
                                <div key={cId} className="flex flex-col gap-1 text-sm border-b last:border-0 pb-2 mb-2 last:pb-0 last:mb-0">
                                  <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="h-2 w-2 rounded-full"
                                        style={{ backgroundColor: entry.color as string }}
                                      />
                                      <span className="text-muted-foreground font-medium">{name}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                      <span className="font-semibold text-foreground">
                                        {isRateMetric ? formatPercent(primaryValue) : formatCurrency(primaryValue, baseCurrency)}
                                      </span>
                                      {currency !== baseCurrency && metric === "net" && (
                                        <span className="text-[10px] text-muted-foreground leading-none">
                                          ({formatCurrency(originalNet, currency)})
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground ml-4">
                                    {metric !== "net" && (
                                      <span>Net: {formatCurrency(netVal, baseCurrency)}</span>
                                    )}
                                    {effRate !== undefined && metric !== "effective" && (
                                      <span>Eff: {formatPercent(effRate)}</span>
                                    )}
                                    {margRate !== undefined && metric !== "marginal" && (
                                      <span>Marg: {formatPercent(margRate)}</span>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    }}
                  />
                  {validCountries.map((c, index) => {
                    const color = `var(--chart-${(index % 5) + 1})`
                    return (
                      <Area
                        key={c.id}
                        type="natural"
                        dataKey={`${c.id}_${metric}`}
                        stroke={color}
                        fill={`url(#fill-${c.id})`}
                      />
                    )
                  })}
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
