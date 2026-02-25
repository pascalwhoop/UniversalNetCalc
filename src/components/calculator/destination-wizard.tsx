"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Check, Info, ChevronDown } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { DeductionManager } from "./deduction-manager"
import { CostOfLivingSection } from "./cost-of-living-section"
import { NoticeIcon } from "./notices"
import { CountryColumnState, type CostOfLiving } from "@/lib/types"
import { getCountryName, getCurrencySymbol, getExchangeRate, calculateSalary, type CalculationResult } from "@/lib/api"
import { getCountryFlag } from "@/lib/country-metadata"
import { useCountries, useYears, useVariants, useInputs } from "@/lib/queries"
import { buildCalcRequest } from "@/lib/calc-utils"
import { formatCurrency } from "@/lib/formatters"

function CurrencyInput({
  currencySymbol,
  value,
  disabled,
  onChange,
}: {
  currencySymbol: string
  value: string
  disabled?: boolean
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
        {currencySymbol}
      </span>
      <Input
        type="text"
        inputMode="decimal"
        placeholder="100000"
        className={`h-9 pl-10${disabled ? " opacity-60 cursor-not-allowed" : ""}`}
        value={value}
        disabled={disabled}
        readOnly={disabled}
        onChange={onChange}
      />
    </div>
  )
}

interface DestinationWizardProps {
  open: boolean
  onClose: () => void
  initialState: CountryColumnState
  onSave: (state: CountryColumnState) => void
  salaryModeSynced?: boolean
  isLeader?: boolean
}

export function DestinationWizard({
  open,
  onClose,
  initialState,
  onSave,
  salaryModeSynced = false,
  isLeader = true,
}: DestinationWizardProps) {
  const [draft, setDraft] = useState<CountryColumnState>(initialState)

  // Track the leader's gross/currency so we can convert when destination currency loads
  const leaderGrossRef = useRef<string>(initialState.gross_annual)
  const leaderCurrencyRef = useRef<string>(initialState.currency || "EUR")

  // Reset draft when wizard opens
  useEffect(() => {
    if (open) {
      setDraft(initialState)
      leaderGrossRef.current = initialState.gross_annual
      leaderCurrencyRef.current = initialState.currency || "EUR"
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const { country, year, variant, gross_annual, formValues, currency, costOfLiving } = draft

  const { data: countries = [] } = useCountries()
  const { data: years = [] } = useYears(country)
  const { data: variants = [] } = useVariants(country, year)
  const { data: inputsData } = useInputs(country, year, variant || undefined)

  // Auto-select latest year when country is set but year is empty
  useEffect(() => {
    if (country && years.length > 0 && !year) {
      const latest = [...years].sort((a, b) => b.localeCompare(a))[0]
      setDraft(prev => ({ ...prev, year: latest }))
    }
  }, [country, years, year])

  // Convert synced salary to destination currency when inputs load
  const convertSyncedSalary = useCallback(
    (destinationCurrency: string) => {
      if (!salaryModeSynced || isLeader) return
      const sourceCurrency = leaderCurrencyRef.current
      const sourceAmount = parseFloat(leaderGrossRef.current)
      if (isNaN(sourceAmount) || sourceAmount <= 0) return
      if (sourceCurrency === destinationCurrency) return
      getExchangeRate(sourceCurrency, destinationCurrency)
        .then(rate => {
          const converted = String(Math.round(sourceAmount * rate))
          setDraft(prev => ({ ...prev, gross_annual: converted }))
        })
        .catch(() => {})
    },
    [salaryModeSynced, isLeader]
  )

  // Update currency and initialize form defaults when inputs load
  useEffect(() => {
    if (!inputsData) return

    const updates: Partial<CountryColumnState> = {}

    if (inputsData.currency && inputsData.currency !== currency) {
      updates.currency = inputsData.currency
      convertSyncedSalary(inputsData.currency)
    }

    const newFormValues = { ...formValues }
    let hasNewDefaults = false

    for (const [key, def] of Object.entries(inputsData.inputs)) {
      if (!(key in formValues)) {
        hasNewDefaults = true
        if (def.default !== undefined) {
          newFormValues[key] = String(def.default)
        } else if (def.type === "enum" && def.options) {
          const firstOption = Object.keys(def.options)[0]
          if (firstOption) newFormValues[key] = firstOption
        } else if (def.type === "boolean") {
          newFormValues[key] = "false"
        }
      }
    }

    if (hasNewDefaults) updates.formValues = newFormValues
    if (Object.keys(updates).length > 0) setDraft(prev => ({ ...prev, ...updates }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputsData?.currency, country, year, variant])

  // Live preview calculation
  const [previewResult, setPreviewResult] = useState<CalculationResult | null>(null)
  const previewAbortRef = useRef<AbortController | null>(null)

  const previewCalcRequest = useMemo(
    () => buildCalcRequest(
      { country, year, variant, gross_annual, formValues },
      inputsData?.inputs
    ),
    [country, year, variant, gross_annual, formValues, inputsData]
  )

  useEffect(() => {
    if (!previewCalcRequest) {
      setPreviewResult(null)
      return
    }

    previewAbortRef.current?.abort()
    const controller = new AbortController()
    previewAbortRef.current = controller

    const timer = setTimeout(() => {
      calculateSalary(previewCalcRequest, controller.signal)
        .then(result => {
          if (!controller.signal.aborted) setPreviewResult(result)
        })
        .catch(() => {})
    }, 500)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [previewCalcRequest])

  const inputDefs = inputsData?.inputs || {}
  const dynamicInputs = Object.entries(inputDefs).filter(([key]) => key !== "gross_annual")
  const enumInputs = dynamicInputs.filter(([, def]) => def.type === "enum")
  const booleanInputs = dynamicInputs.filter(([, def]) => def.type === "boolean")

  const updateFormValue = (key: string, value: string) => {
    setDraft(prev => ({
      ...prev,
      formValues: { ...prev.formValues, [key]: value },
      ...(key === "gross_annual" && { gross_annual: value }),
    }))
  }

  const canSave = !!(country && year && gross_annual)
  const currencySymbol = getCurrencySymbol(currency || "EUR")

  const handleSave = () => {
    onSave(draft)
    onClose()
  }

  const title = country
    ? `${getCountryFlag(country)} ${getCountryName(country)}`
    : "New Destination"

  // Count active deductions for collapsible label
  const activeDeductionCount = Object.entries(inputDefs)
    .filter(([key, def]) => def.type === "number" && !def.group && key !== "gross_annual")
    .filter(([key]) => {
      const val = parseFloat(formValues[key] || "0")
      return !isNaN(val) && val > 0
    }).length

  const totalMonthlyCosts = costOfLiving
    ? Object.values(costOfLiving).reduce((sum, v) => sum + v, 0)
    : 0

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* Single-step content */}
        <div className="flex-1 overflow-y-auto px-6 min-h-0">
          <div className="space-y-4 pb-2">
            {/* Country & Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Country</Label>
                <Select
                  value={country}
                  onValueChange={value =>
                    setDraft(prev => ({ ...prev, country: value, year: "", variant: "" }))
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries
                      .sort((a, b) => getCountryName(a).localeCompare(getCountryName(b)))
                      .map(code => (
                        <SelectItem key={code} value={code}>
                          {getCountryFlag(code)} {getCountryName(code)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Year</Label>
                <Select
                  value={year}
                  onValueChange={value => setDraft(prev => ({ ...prev, year: value }))}
                  disabled={!country || years.length === 0}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {[...years].sort((a, b) => b.localeCompare(a)).map(yr => (
                      <SelectItem key={yr} value={yr}>
                        {yr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Gross Salary */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Label className="text-xs text-muted-foreground">
                  {inputDefs.gross_annual?.label || "Gross Annual Salary"} ({currencySymbol})
                </Label>
                {inputsData?.notices && (
                  <NoticeIcon
                    notices={inputsData.notices}
                    noticeId="salary_input"
                    variant={variant}
                  />
                )}
              </div>
              {salaryModeSynced && !isLeader ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CurrencyInput currencySymbol={currencySymbol} value={gross_annual} disabled />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">
                        Salary is synced from the primary destination. Switch to{" "}
                        <strong>Local salaries</strong> mode to set each country independently.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <CurrencyInput
                  currencySymbol={currencySymbol}
                  value={gross_annual}
                  onChange={e => updateFormValue("gross_annual", e.target.value)}
                />
              )}
            </div>

            {/* Tax variant */}
            {variants.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Tax Variant</Label>
                <Select
                  value={variant || "default"}
                  onValueChange={v =>
                    setDraft(prev => ({ ...prev, variant: v === "default" ? "" : v }))
                  }
                >
                  <SelectTrigger className="h-9">
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

            {/* Enum inputs */}
            {enumInputs.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {enumInputs.map(([key, def]) => (
                  <div key={key} className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{def.label || key}</Label>
                    <Select
                      value={formValues[key] || (def.default ? String(def.default) : "__none__")}
                      onValueChange={v => updateFormValue(key, v === "__none__" ? "" : v)}
                    >
                      <SelectTrigger className="h-9">
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
                              {(opt as { label: string }).label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            )}

            {/* Boolean inputs */}
            {booleanInputs.length > 0 && (
              <div className="space-y-2">
                {booleanInputs.map(([key, def]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`wizard-${key}`}
                      checked={formValues[key] === "true"}
                      onCheckedChange={checked => updateFormValue(key, String(checked))}
                    />
                    <div className="flex items-center gap-1.5">
                      <Label
                        htmlFor={`wizard-${key}`}
                        className="text-sm font-normal cursor-pointer"
                      >
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

            {/* Collapsible: Deductions */}
            {country && year && Object.keys(inputDefs).length > 0 && (
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-normal">
                    <span>
                      Tax Deductions
                      <span className="text-muted-foreground ml-1.5">
                        ({activeDeductionCount} active)
                      </span>
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <DeductionManager
                    inputDefs={inputDefs}
                    formValues={formValues}
                    onUpdateFormValue={updateFormValue}
                    columnIndex={draft.index}
                    previewResult={previewResult}
                    calcRequest={previewCalcRequest}
                  />
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Collapsible: Living Costs */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between font-normal">
                  <span>
                    Monthly Living Costs
                    <span className="text-muted-foreground ml-1.5">
                      ({totalMonthlyCosts > 0 ? `${currencySymbol}${totalMonthlyCosts.toLocaleString()}/mo` : "none"})
                    </span>
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3">
                <CostOfLivingSection
                  value={costOfLiving}
                  currencySymbol={currencySymbol}
                  onChange={(col: CostOfLiving) => setDraft(prev => ({ ...prev, costOfLiving: col }))}
                  alwaysOpen
                />
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        {/* Footer with live net preview */}
        <div className="flex items-center justify-between px-6 py-4 border-t shrink-0 mt-4">
          {previewResult ? (
            <div>
              <div className="text-xs text-muted-foreground">Net Annual</div>
              <div className="text-sm font-bold font-mono text-primary">
                {formatCurrency(previewResult.net, previewResult.currency)}
              </div>
            </div>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!canSave}>
              <Check className="h-4 w-4 mr-1" />
              Apply
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
