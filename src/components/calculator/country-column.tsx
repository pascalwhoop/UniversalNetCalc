"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import { X, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import {
  fetchCountries,
  fetchYears,
  fetchVariants,
  fetchInputs,
  calculateSalary,
  getCountryName,
  getCurrencySymbol,
  fetchExchangeRate,
  type CalculationResult,
  type InputDefinition,
} from "@/lib/api"

interface SharedGrossData {
  amount: string
  currency: string
}

interface CountryColumnProps {
  index: number
  onRemove?: () => void
  showRemove?: boolean
  showCopyToAll?: boolean
  onCopyGrossToAll?: (gross: string, currency: string) => void
  sharedGross?: SharedGrossData | null
  onCurrencyChange?: (currency: string) => void
}

export function CountryColumn({
  index,
  onRemove,
  showRemove = true,
  showCopyToAll = false,
  onCopyGrossToAll,
  sharedGross,
  onCurrencyChange,
}: CountryColumnProps) {
  // Available options from API
  const [countries, setCountries] = useState<string[]>([])
  const [years, setYears] = useState<string[]>([])
  const [variants, setVariants] = useState<string[]>([])
  const [inputDefs, setInputDefs] = useState<Record<string, InputDefinition>>({})

  // Form state
  const [country, setCountry] = useState<string>("")
  const [year, setYear] = useState<string>("")
  const [variant, setVariant] = useState<string>("")
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [currency, setCurrency] = useState<string>("EUR")

  // Result state
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Notify parent of currency changes
  useEffect(() => {
    if (onCurrencyChange) {
      onCurrencyChange(currency)
    }
  }, [currency, onCurrencyChange])

  // Handle shared gross from parent (with currency conversion)
  useEffect(() => {
    if (sharedGross && sharedGross.amount) {
      const convertAndSet = async () => {
        const sourceAmount = parseFloat(sharedGross.amount)
        if (isNaN(sourceAmount)) return

        if (sharedGross.currency === currency) {
          // Same currency, no conversion needed
          setFormValues(prev => ({ ...prev, gross_annual: sharedGross.amount }))
        } else {
          // Convert currency
          try {
            const rate = await fetchExchangeRate(sharedGross.currency, currency)
            const convertedAmount = Math.round(sourceAmount * rate)
            setFormValues(prev => ({ ...prev, gross_annual: String(convertedAmount) }))
          } catch (e) {
            console.error("Currency conversion failed:", e)
            // Fallback to original amount if conversion fails
            setFormValues(prev => ({ ...prev, gross_annual: sharedGross.amount }))
          }
        }
      }
      convertAndSet()
    }
  }, [sharedGross, currency])

  // Fetch countries on mount
  useEffect(() => {
    fetchCountries()
      .then((c) => setCountries(c.filter(Boolean)))
      .catch((e) => {
        console.error("Failed to fetch countries:", e)
        toast.error("Failed to load countries", {
          description: e.message,
        })
      })
  }, [])

  // Fetch years when country changes
  useEffect(() => {
    if (!country) {
      setYears([])
      setYear("")
      return
    }

    fetchYears(country)
      .then((yrs) => {
        const filtered = yrs.filter(Boolean).sort((a, b) => b.localeCompare(a)) // Sort descending (latest first)
        setYears(filtered)
        // Always select the latest year when country changes
        if (filtered.length > 0) {
          setYear(filtered[0])
        } else {
          setYear("")
        }
      })
      .catch((e) => {
        console.error("Failed to fetch years:", e)
        toast.error(`Failed to load years for ${getCountryName(country)}`, {
          description: e.message,
        })
        setYear("")
      })
  }, [country])

  // Fetch variants when country + year change
  useEffect(() => {
    if (!country || !year) {
      setVariants([])
      setVariant("")
      return
    }

    fetchVariants(country, year)
      .then((vars) => {
        setVariants(vars.filter(Boolean))
        setVariant("")
      })
      .catch(() => {
        // Variants are optional
      })
  }, [country, year])

  // Fetch input definitions when country + year change
  useEffect(() => {
    if (!country || !year) {
      setInputDefs({})
      return
    }

    fetchInputs(country, year, variant || undefined)
      .then((data) => {
        setInputDefs(data.inputs)
        // Update currency
        if (data.currency) {
          setCurrency(data.currency)
        }
        // Initialize form values with defaults, or first option for required enums
        const defaults: Record<string, string> = {}
        for (const [key, def] of Object.entries(data.inputs)) {
          if (def.default !== undefined) {
            defaults[key] = String(def.default)
          } else if (def.type === "enum" && def.options) {
            // Pre-fill with first option for enum fields to avoid incomplete form errors
            const firstOption = Object.keys(def.options)[0]
            if (firstOption) {
              defaults[key] = firstOption
            }
          }
        }
        // Preserve gross_annual if already set, but apply all other defaults
        setFormValues(prev => {
          const newValues = { ...defaults }
          if (prev.gross_annual) {
            newValues.gross_annual = prev.gross_annual
          }
          return newValues
        })
      })
      .catch((e) => {
        console.error("Failed to fetch inputs:", e)
      })
  }, [country, year, variant])

  // Calculate when inputs change
  const calculate = useCallback(async () => {
    const gross = formValues.gross_annual
    if (!country || !year || !gross) {
      setResult(null)
      return
    }

    const grossNum = parseFloat(gross)
    if (isNaN(grossNum) || grossNum <= 0) {
      setResult(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Build request with all form values
      const request: Record<string, any> = {
        country,
        year,
        gross_annual: grossNum,
      }

      if (variant) {
        request.variant = variant
      }

      // Add all other form values
      for (const [key, value] of Object.entries(formValues)) {
        if (key !== "gross_annual" && value) {
          request[key] = value
        }
      }

      const res = await calculateSalary(request as any)
      setResult(res)
    } catch (e: any) {
      const errorMessage = e.message || "Calculation failed"
      setError(errorMessage)
      setResult(null)
      toast.error(`Calculation failed for ${getCountryName(country)}`, {
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }, [country, year, variant, formValues])

  // Debounced calculation on input change
  useEffect(() => {
    const timer = setTimeout(() => {
      calculate()
    }, 500)

    return () => clearTimeout(timer)
  }, [calculate])

  const handleCopyToAll = () => {
    const gross = formValues.gross_annual
    if (gross && onCopyGrossToAll) {
      onCopyGrossToAll(gross, currency)
    }
  }

  const updateFormValue = (key: string, value: string) => {
    setFormValues(prev => ({ ...prev, [key]: value }))
  }

  // Get dynamic inputs (excluding gross_annual which we render specially)
  const dynamicInputs = Object.entries(inputDefs).filter(
    ([key]) => key !== "gross_annual"
  )

  // Group inputs by type for better layout
  const enumInputs = dynamicInputs.filter(([, def]) => def.type === "enum")

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
            {country ? getCountryName(country) : `Country ${index + 1}`}
          </CardTitle>
          {showRemove && onRemove && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={onRemove}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Remove</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 px-4 pb-4">
        {/* Country & Year Row */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor={`country-${index}`} className="text-xs text-muted-foreground">
              Country
            </Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger id={`country-${index}`} className="h-9">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((code) => (
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
              onValueChange={setYear}
              disabled={!country || years.length === 0}
            >
              <SelectTrigger id={`year-${index}`} className="h-9">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((yr) => (
                  <SelectItem key={yr} value={yr}>
                    {yr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Gross Salary Input */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor={`gross-${index}`} className="text-xs text-muted-foreground">
              {inputDefs.gross_annual?.label || "Gross Annual Salary"} ({getCurrencySymbol(currency)})
            </Label>
            {showCopyToAll && formValues.gross_annual && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1.5 text-xs text-muted-foreground hover:text-foreground"
                      onClick={handleCopyToAll}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy all
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy salary to all countries (converts currency)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              {getCurrencySymbol(currency)}
            </span>
            <Input
              id={`gross-${index}`}
              type="number"
              placeholder="100000"
              className="h-9 pl-10"
              value={formValues.gross_annual || ""}
              onChange={(e) => updateFormValue("gross_annual", e.target.value)}
            />
          </div>
        </div>

        {/* Dynamic Enum Inputs (filing status, regions, etc.) */}
        {enumInputs.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {enumInputs.map(([key, def]) => (
              <div key={key} className="space-y-1">
                <Label htmlFor={`${key}-${index}`} className="text-xs text-muted-foreground">
                  {def.label || key}
                </Label>
                <Select
                  value={formValues[key] || (def.default ? String(def.default) : "__none__")}
                  onValueChange={(v) => updateFormValue(key, v === "__none__" ? "" : v)}
                >
                  <SelectTrigger id={`${key}-${index}`} className="h-9">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {!def.required && (
                      <SelectItem value="__none__">
                        <span className="text-muted-foreground">None</span>
                      </SelectItem>
                    )}
                    {def.options && Object.entries(def.options).map(([optKey, opt]) => (
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

        {/* Variant Selection (if available) */}
        {variants.length > 0 && (
          <div className="space-y-1">
            <Label htmlFor={`variant-${index}`} className="text-xs text-muted-foreground">
              Tax Variant
            </Label>
            <Select value={variant || "default"} onValueChange={(v) => setVariant(v === "default" ? "" : v)}>
              <SelectTrigger id={`variant-${index}`} className="h-9">
                <SelectValue placeholder="Default" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                {variants.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Results Section */}
        <div className="pt-2 border-t">
          <ResultBreakdown
            isLoading={isLoading}
            result={result}
            error={error}
          />
        </div>
      </CardContent>
    </Card>
  )
}
