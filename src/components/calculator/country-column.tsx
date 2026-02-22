"use client"

import { useEffect, useCallback, useRef, useMemo } from "react"
import { toast } from "sonner"
import { X, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResultBreakdown } from "./result-breakdown"
import { SalaryRangeChart } from "./salary-range-chart"
import { getCountryName, getCurrencySymbol, type CalcRequest, type InputDefinition } from "@/lib/api"
import { CountryColumnState } from "@/lib/types"
import { getCountryFlag } from "@/lib/country-metadata"
import { Crown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  useYears,
  useInputs,
  useCalculateSalary,
} from "@/lib/queries"

interface CountryColumnProps extends CountryColumnState {
  onUpdate: (updates: Partial<CountryColumnState>) => void
  onRemove: () => void
  onEdit: () => void
  showRemove?: boolean
  isBest?: boolean
  comparisonDelta?: number
}

export function CountryColumn({
  id: _id,
  index,
  country,
  year,
  variant,
  gross_annual,
  formValues,
  currency,
  result,
  isCalculating,
  calculationError,
  costOfLiving,
  onUpdate,
  onRemove,
  onEdit,
  showRemove = true,
  isBest = false,
  comparisonDelta,
}: CountryColumnProps) {
  const { data: years = [] } = useYears(country)
  const { data: inputsData } = useInputs(country, year, variant || undefined)

  const calculateMutation = useCalculateSalary()
  const hasInitializedYearRef = useRef<string | null>(null)
  const currencyEmittedForRef = useRef<string | null>(null)

  // Auto-select latest year when years load (for URL-restored state with no year)
  useEffect(() => {
    if (years.length > 0 && !year && hasInitializedYearRef.current !== country) {
      const sorted = [...years].sort((a, b) => b.localeCompare(a))
      onUpdate({ year: sorted[0] })
      hasInitializedYearRef.current = country
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [years, year, country])

  // Update currency and form defaults when inputs load
  useEffect(() => {
    if (!inputsData) return

    const key = `${country}:${year}:${variant}`
    const updates: Partial<CountryColumnState> = {}

    // Always emit currency on first load for this country/year/variant — even if it matches
    // the default "EUR" — so synced followers can trigger salary conversion via updateCountry.
    if (inputsData.currency) {
      const isFirstLoad = currencyEmittedForRef.current !== key
      if (isFirstLoad || inputsData.currency !== currency) {
        updates.currency = inputsData.currency
        currencyEmittedForRef.current = key
      }
    }

    const newFormValues = { ...formValues }
    let hasNewDefaults = false

    for (const [k, def] of Object.entries(inputsData.inputs)) {
      if (!(k in formValues)) {
        hasNewDefaults = true
        if (def.default !== undefined) {
          newFormValues[k] = String(def.default)
        } else if (def.type === "enum" && def.options) {
          const firstOption = Object.keys(def.options)[0]
          if (firstOption) {
            newFormValues[k] = firstOption
          }
        } else if (def.type === "boolean") {
          newFormValues[k] = "false"
        }
      }
    }

    if (hasNewDefaults) {
      updates.formValues = newFormValues
    }

    if (Object.keys(updates).length > 0) {
      onUpdate(updates)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputsData?.currency, country, year, variant])

  const calcRequest: CalcRequest | null = useMemo(() => {
    if (!country || !year || !gross_annual) return null
    const grossNum = parseFloat(gross_annual)
    if (isNaN(grossNum) || grossNum <= 0) return null

    const request: CalcRequest = { country, year, gross_annual: grossNum }
    if (variant) request.variant = variant

    for (const [key, value] of Object.entries(formValues)) {
      if (key === "gross_annual") continue
      const inputDef = inputsData?.inputs[key] as InputDefinition | undefined
      if (inputDef?.type === "boolean") {
        request[key] = value === "true"
      } else if (inputDef?.type === "number") {
        const numValue = parseFloat(value || "0")
        if (!isNaN(numValue)) request[key] = numValue
      } else if (value) {
        request[key] = value
      }
    }
    return request
  }, [country, year, gross_annual, variant, formValues, inputsData])

  const calculate = useCallback(() => {
    if (!country || !year || !gross_annual) {
      if (result) {
        onUpdate({ result: null, isCalculating: false, calculationError: null })
      }
      return
    }

    const grossNum = parseFloat(gross_annual)
    if (isNaN(grossNum) || grossNum <= 0) {
      if (result) {
        onUpdate({ result: null, isCalculating: false, calculationError: null })
      }
      return
    }

    if (!calcRequest) return

    onUpdate({ isCalculating: true })

    calculateMutation.mutate(calcRequest, {
      onSuccess: data => {
        onUpdate({
          result: data,
          isCalculating: false,
          calculationError: null,
        })
      },
      onError: (e: Error) => {
        const errorMessage = e.message || "Calculation failed"
        onUpdate({
          result: null,
          isCalculating: false,
          calculationError: errorMessage,
        })
        toast.error(`Calculation failed for ${getCountryName(country)}`, {
          description: errorMessage,
        })
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, year, variant, gross_annual, formValues, inputsData])

  useEffect(() => {
    const timer = setTimeout(calculate, 500)
    return () => clearTimeout(timer)
  }, [calculate])

  const countryFlag = country ? getCountryFlag(country) : ""
  const currencySymbol = getCurrencySymbol(currency || "EUR")

  const subtitle =
    country && year && gross_annual
      ? `${currencySymbol}${parseInt(gross_annual).toLocaleString()} gross · ${year}${variant ? ` · ${variant}` : ""}`
      : null

  return (
    <Card className={`flex flex-col animate-fade-in ${isBest ? "border-green-500 border-2" : ""}`}>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <CardTitle className="text-base font-medium truncate">
              {country ? `${countryFlag} ${getCountryName(country)}` : `Destination ${index + 1}`}
            </CardTitle>
            {isBest && (
              <Badge variant="default" className="bg-green-600 hover:bg-green-700 shrink-0">
                <Crown className="h-3 w-3 mr-1" />
                Best
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={onEdit}
            >
              <Pencil className="h-3.5 w-3.5" />
              <span className="sr-only">Edit</span>
            </Button>
            {showRemove && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={onRemove}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Remove</span>
              </Button>
            )}
          </div>
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </CardHeader>

      <CardContent className="flex flex-col flex-1 space-y-3 px-4 pb-4">
        {/* Empty / unconfigured state */}
        {!country || !year || !gross_annual ? (
          <div className="rounded-lg border border-dashed p-8 text-center flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Configure this destination to see results
            </p>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </div>
        ) : (
          <>
            {/* Results */}
            <ResultBreakdown
              isLoading={isCalculating}
              result={result}
              error={calculationError}
              comparisonDelta={comparisonDelta}
              costOfLiving={costOfLiving}
              calculationRequest={
                result
                  ? {
                      country,
                      year,
                      gross_annual: parseFloat(gross_annual),
                      ...(variant && { variant }),
                      ...Object.fromEntries(
                        Object.entries(formValues)
                          .filter(([key]) => key !== "gross_annual")
                          .map(([key, value]) => {
                            const inputDef = inputsData?.inputs[key]
                            if (inputDef?.type === "boolean") {
                              return [key, value === "true"]
                            }
                            return [key, value]
                          })
                      ),
                    }
                  : undefined
              }
            />

            {/* Chart */}
            {result && (
              <div className="pt-2 border-t">
                <SalaryRangeChart
                  country={country}
                  year={year}
                  variant={variant || undefined}
                  currentGross={parseFloat(gross_annual) || 0}
                  currency={currency || "EUR"}
                  formValues={formValues}
                  result={result}
                />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
