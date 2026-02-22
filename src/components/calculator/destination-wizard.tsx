"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Check, Lock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { DeductionManager } from "./deduction-manager"
import { CostOfLivingSection } from "./cost-of-living-section"
import { CountryColumnState, CostOfLiving } from "@/lib/types"
import { getCountryName, getCurrencySymbol, type InputDefinition } from "@/lib/api"
import { useCountries, useYears, useVariants, useInputs } from "@/lib/queries"

const STEPS = ["Destination", "Tax Options", "Living Costs"]

interface DestinationWizardProps {
  open: boolean
  onClose: () => void
  initialState: CountryColumnState
  onSave: (state: CountryColumnState) => void
  isLeader?: boolean
  salaryModeSynced?: boolean
}

export function DestinationWizard({
  open,
  onClose,
  initialState,
  onSave,
  isLeader = true,
  salaryModeSynced = false,
}: DestinationWizardProps) {
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<CountryColumnState>(initialState)

  // Reset when opened with new initialState
  useEffect(() => {
    if (open) {
      setDraft(initialState)
      setStep(0)
    }
  }, [open, initialState])

  const { data: countries = [] } = useCountries()
  const { data: years = [] } = useYears(draft.country)
  const { data: variants = [] } = useVariants(draft.country, draft.year)
  const { data: inputsData } = useInputs(draft.country, draft.year, draft.variant || undefined)

  const country = draft.country
  const year = draft.year
  const currency = draft.currency || "EUR"
  const currencySymbol = getCurrencySymbol(currency)

  // When inputsData loads, pick up the currency and default form values
  useEffect(() => {
    if (!inputsData) return
    const updates: Partial<CountryColumnState> = {}

    if (inputsData.currency) {
      updates.currency = inputsData.currency
    }

    const newFormValues = { ...draft.formValues }
    let hasNew = false
    for (const [key, def] of Object.entries(inputsData.inputs)) {
      if (!(key in draft.formValues)) {
        hasNew = true
        if (def.default !== undefined) {
          newFormValues[key] = String(def.default)
        } else if (def.type === "enum" && def.options) {
          const first = Object.keys(def.options)[0]
          if (first) newFormValues[key] = first
        } else if (def.type === "boolean") {
          newFormValues[key] = "false"
        }
      }
    }
    if (hasNew) updates.formValues = newFormValues

    if (Object.keys(updates).length > 0) {
      setDraft(prev => ({ ...prev, ...updates }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputsData?.currency, country, year, draft.variant])

  const salaryEditable = isLeader || !salaryModeSynced

  // Step 0 requires country + year; salary required only when editable
  const canAdvance =
    step === 0
      ? !!(country && year && (salaryEditable ? draft.gross_annual : true))
      : true

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else handleSave()
  }

  const handleSave = () => {
    onSave(draft)
    onClose()
  }

  const updateDraftFormValue = (key: string, value: string) => {
    setDraft(prev => ({ ...prev, formValues: { ...prev.formValues, [key]: value } }))
  }

  const inputDefs = inputsData?.inputs || {}
  const dynamicInputs = Object.entries(inputDefs).filter(([key]) => key !== "gross_annual")
  const enumInputs = dynamicInputs.filter(([, def]) => def.type === "enum")
  const booleanInputs = dynamicInputs.filter(([, def]) => def.type === "boolean")

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {initialState.country ? `Edit ${getCountryName(initialState.country)}` : "Add Destination"}
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-4">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <button
                className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium transition-colors ${
                  i < step
                    ? "bg-primary text-primary-foreground"
                    : i === step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
                onClick={() => i < step && setStep(i)}
              >
                {i < step ? <Check className="h-3 w-3" /> : i + 1}
              </button>
              <span className={`text-xs ${i === step ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {label}
              </span>
              {i < STEPS.length - 1 && <div className="flex-1 h-px bg-border w-4" />}
            </div>
          ))}
        </div>

        {/* Step 0: Destination */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Country</Label>
                <Select
                  value={country}
                  onValueChange={value =>
                    setDraft(prev => ({ ...prev, country: value, year: "", variant: "", formValues: {} }))
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select country" />
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

            {/* Variant */}
            {variants.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Tax Variant</Label>
                <Select
                  value={draft.variant || "default"}
                  onValueChange={v => setDraft(prev => ({ ...prev, variant: v === "default" ? "" : v }))}
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

            {/* Gross Annual Salary */}
            {country && year && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Gross Annual Salary ({currencySymbol})
                </Label>
                {salaryEditable ? (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      {currencySymbol}
                    </span>
                    <Input
                      type="number"
                      placeholder="100000"
                      className="h-9 pl-10"
                      value={draft.gross_annual}
                      onChange={e =>
                        setDraft(prev => ({ ...prev, gross_annual: e.target.value }))
                      }
                    />
                  </div>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 h-9 text-sm cursor-default">
                          <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="font-medium tabular-nums text-muted-foreground">
                            {draft.gross_annual
                              ? `${currencySymbol}${parseInt(draft.gross_annual).toLocaleString()}`
                              : "Synced from first destination"}
                          </span>
                          <span className="text-xs text-muted-foreground ml-auto">synced</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[220px]">
                        <p className="text-xs">
                          Salary is synced from the first destination and converted to this
                          country&apos;s currency automatically. Switch to &quot;Local salaries&quot; to set
                          it independently.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 1: Tax Options */}
        {step === 1 && (
          <div className="space-y-4">
            {enumInputs.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {enumInputs.map(([key, def]) => (
                  <div key={key} className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{def.label || key}</Label>
                    <Select
                      value={draft.formValues[key] || (def.default ? String(def.default) : "__none__")}
                      onValueChange={v => updateDraftFormValue(key, v === "__none__" ? "" : v)}
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

            {booleanInputs.length > 0 && (
              <div className="space-y-2">
                {booleanInputs.map(([key, def]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`wizard-${key}`}
                      checked={draft.formValues[key] === "true"}
                      onCheckedChange={checked => updateDraftFormValue(key, String(checked))}
                    />
                    <Label htmlFor={`wizard-${key}`} className="text-sm font-normal cursor-pointer">
                      {def.label || key}
                    </Label>
                  </div>
                ))}
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Tax Deductions
              </p>
              <DeductionManager
                inputDefs={inputDefs as Record<string, InputDefinition>}
                formValues={draft.formValues}
                onUpdateFormValue={updateDraftFormValue}
                columnIndex={0}
                result={draft.result}
                calcRequest={
                  draft.country && draft.year && draft.gross_annual
                    ? {
                        country: draft.country,
                        year: draft.year,
                        gross_annual: parseFloat(draft.gross_annual),
                        ...(draft.variant && { variant: draft.variant }),
                        ...Object.fromEntries(
                          Object.entries(draft.formValues).filter(([k]) => k !== "gross_annual")
                        ),
                      }
                    : null
                }
              />
            </div>
          </div>
        )}

        {/* Step 2: Living Costs */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter your estimated monthly living costs in {currency} to see your disposable income.
            </p>
            <CostOfLivingSection
              value={draft.costOfLiving}
              currencySymbol={currencySymbol}
              onChange={(col: CostOfLiving) => setDraft(prev => ({ ...prev, costOfLiving: col }))}
            />
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={step === 0 ? onClose : () => setStep(s => s - 1)}
          >
            {step === 0 ? "Cancel" : <><ChevronLeft className="h-4 w-4 mr-1" />Back</>}
          </Button>
          <Button size="sm" onClick={handleNext} disabled={!canAdvance}>
            {step === STEPS.length - 1 ? (
              <><Check className="h-4 w-4 mr-1" />Save</>
            ) : (
              <>Next<ChevronRight className="h-4 w-4 ml-1" /></>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
