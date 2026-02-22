"use client"

import { useEffect, useCallback, useRef, useMemo } from "react"
import { toast } from "sonner"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ResultBreakdown } from "./result-breakdown"
import { SalaryRangeChart } from "./salary-range-chart"
import { NoticeIcon } from "./notices"
import { getCountryName, getCurrencySymbol, type CalcRequest, type InputDefinition } from "@/lib/api"
import { DeductionManager } from "./deduction-manager"
import { CostOfLivingSection } from "./cost-of-living-section"
import { CountryColumnState, CostOfLiving, DEFAULT_COST_OF_LIVING } from "@/lib/types"
import { getCountryFlag } from "@/lib/country-metadata"
import { Crown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Info } from "lucide-react"
import {
  useCountries,
  useYears,
  useVariants,
  useInputs,
  useCalculateSalary,
} from "@/lib/queries"

interface CountryColumnProps extends CountryColumnState {
  onUpdate: (updates: Partial<CountryColumnState>) => void
  onRemove: () => void
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
  costOfLiving = DEFAULT_COST_OF_LIVING,
  onUpdate,
  onRemove,
  showRemove = true,
  isBest = false,
  comparisonDelta,
}: CountryColumnProps) {
  // Queries for dropdowns
  const { data: countries = [] } = useCountries()
  const { data: years = [] } = useYears(country)
  const { data: variants = [] } = useVariants(country, year)
  const { data: inputsData } = useInputs(country, year, variant || undefined)

  // Mutation for calculations
  const calculateMutation = useCalculateSalary()

  // Track if we've initialized defaults
  const hasInitializedYearRef = useRef<string | null>(null)

  // Auto-select latest year when years load
  useEffect(() => {
    if (years.length > 0 && !year && hasInitializedYearRef.current !== country) {
      const sorted = [...years].sort((a, b) => b.localeCompare(a))
      onUpdate({ year: sorted[0] })
      hasInitializedYearRef.current = country
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [years, year, country])
  // Only auto-select year once per country

  // Update currency and form defaults when inputs load
  useEffect(() => {
    if (!inputsData) return

    const updates: Partial<CountryColumnState> = {}

    // Update currency if changed
    if (inputsData.currency && inputsData.currency !== currency) {
      updates.currency = inputsData.currency
    }

    // Initialize form defaults for new inputs ONLY if they don't exist
    const newFormValues = { ...formValues }
    let hasNewDefaults = false

    for (const [key, def] of Object.entries(inputsData.inputs)) {
      // Only set defaults if the key doesn't exist in formValues
      if (!(key in formValues)) {
        hasNewDefaults = true
        if (def.default !== undefined) {
          newFormValues[key] = String(def.default)
        } else if (def.type === "enum" && def.options) {
          const firstOption = Object.keys(def.options)[0]
          if (firstOption) {
            newFormValues[key] = firstOption
          }
        } else if (def.type === "boolean") {
          newFormValues[key] = "false"
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
  // Only run when country/year/variant changes, not on every formValues change

  // Build the current calc request (shared by calculate() and DeductionManager)
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

  // Trigger calculation when inputs change
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

  // Debounced calculation
  useEffect(() => {
    const timer = setTimeout(calculate, 500)
    return () => clearTimeout(timer)
  }, [calculate])

  const updateFormValue = (key: string, value: string) => {
    onUpdate({
      formValues: { ...formValues, [key]: value },
      ...(key === "gross_annual" && { gross_annual: value }),
    })
  }

  const inputDefs = inputsData?.inputs || {}
  const dynamicInputs = Object.entries(inputDefs).filter(
    ([key]) => key !== "gross_annual"
  )
  const enumInputs = dynamicInputs.filter(([, def]) => def.type === "enum")
  const booleanInputs = dynamicInputs.filter(([, def]) => def.type === "boolean")

  const countryFlag = country ? getCountryFlag(country) : ""

  return (
    <Card className={`flex flex-col animate-fade-in ${isBest ? "border-green-500 border-2" : ""}`}>
      <CardHeader className="pb-2 pt-4 px-4 md:px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base md:text-base font-medium">
              {country ? `${countryFlag} ${getCountryName(country)}` : `Country ${index + 1}`}
            </CardTitle>
            {isBest && (
              <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                <Crown className="h-3 w-3 mr-1" />
                Best
              </Badge>
            )}
          </div>
          {showRemove && onRemove && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 md:h-7 md:w-7 text-muted-foreground hover:text-destructive"
              onClick={onRemove}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Remove</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 space-y-3 px-4 pb-4 md:px-4 md:pb-4">
        <div className="space-y-3" style={{ minHeight: "320px" }}>
          {/* Section: Income Parameters */}
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Income Parameters</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor={`country-${index}`} className="text-xs text-muted-foreground">
                Country
              </Label>
              <Select
                value={country}
                onValueChange={value => onUpdate({ country: value, year: "", variant: "" })}
              >
                <SelectTrigger id={`country-${index}`} className="h-10 md:h-9">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {countries
                    .sort((a, b) => getCountryName(a).localeCompare(getCountryName(b)))
                    .map(code => (
                      <SelectItem key={code} value={code}>
                        {getCountryName(code)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor={`year-${index}`} className="text-xs text-muted-foreground">
                Year
              </Label>
              <Select
                value={year}
                onValueChange={value => onUpdate({ year: value })}
                disabled={!country || years.length === 0}
              >
                <SelectTrigger id={`year-${index}`} className="h-10 md:h-9">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(yr => (
                    <SelectItem key={yr} value={yr}>
                      {yr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Gross Salary */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Label htmlFor={`gross-${index}`} className="text-xs text-muted-foreground">
                  {inputDefs.gross_annual?.label || "Gross Annual Salary"} (
                  {getCurrencySymbol(currency || "EUR")})
                </Label>
                {inputsData?.notices && (
                  <NoticeIcon
                    notices={inputsData.notices}
                    noticeId="salary_input"
                    variant={variant}
                  />
                )}
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                {getCurrencySymbol(currency || "EUR")}
              </span>
              <Input
                id={`gross-${index}`}
                type="number"
                placeholder="100000"
                className="h-10 md:h-9 pl-10"
                value={gross_annual}
                onChange={e => updateFormValue("gross_annual", e.target.value)}
              />
            </div>
          </div>

          {/* Dynamic Enum Inputs - single column so long labels/options fit */}
          {enumInputs.length > 0 && (
            <div className="space-y-2">
              {enumInputs.map(([key, def]) => (
                <div key={key} className="space-y-1 min-w-0">
                  <Label htmlFor={`${key}-${index}`} className="text-xs text-muted-foreground">
                    {def.label || key}
                  </Label>
                  <Select
                    value={formValues[key] || (def.default ? String(def.default) : "__none__")}
                    onValueChange={v => updateFormValue(key, v === "__none__" ? "" : v)}
                  >
                    <SelectTrigger id={`${key}-${index}`} className="h-10 md:h-9 w-full">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {!def.required && (
                        <SelectItem value="__none__">
                          <span className="text-muted-foreground">None</span>
                        </SelectItem>
                      )}
                      {def.options &&
                        Object.entries(def.options).map(([optKey, opt]) => (
                          <SelectItem key={optKey} value={optKey}>
                            {opt.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}

          {/* Boolean Inputs */}
          {booleanInputs.length > 0 && (
            <div className="space-y-2">
              {booleanInputs.map(([key, def]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${key}-${index}`}
                    checked={formValues[key] === "true"}
                    onCheckedChange={checked => updateFormValue(key, String(checked))}
                  />
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor={`${key}-${index}`} className="text-sm font-normal cursor-pointer">
                      {def.label || key}
                    </Label>
                    {def.description && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs text-xs">{def.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Section: Tax Deductions */}
          <div className="pt-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Tax Deductions</p>
            <DeductionManager
              inputDefs={inputDefs}
              formValues={formValues}
              onUpdateFormValue={updateFormValue}
              columnIndex={index}
              result={result}
              calcRequest={calcRequest}
            />
          </div>

          {/* Section: Living Costs */}
          <div className="pt-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Living Costs</p>
            <CostOfLivingSection
              value={costOfLiving}
              currencySymbol={getCurrencySymbol(currency || "EUR")}
              onChange={(col: CostOfLiving) => onUpdate({ costOfLiving: col })}
            />
          </div>

          {/* Variant Selection */}
          {variants.length > 0 && (
            <div className="space-y-1">
              <Label htmlFor={`variant-${index}`} className="text-xs text-muted-foreground">
                Tax Variant
              </Label>
              <Select
                value={variant || "default"}
                onValueChange={v => onUpdate({ variant: v === "default" ? "" : v })}
              >
                <SelectTrigger id={`variant-${index}`} className="h-10 md:h-9">
                  <SelectValue placeholder="Default" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  {variants.map(v => (
                    <SelectItem key={v} value={v}>
                      {v.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Section: Results */}
        <div className="flex-1 pt-2 border-t">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Results</p>
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
        </div>

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
      </CardContent>
    </Card>
  )
}
