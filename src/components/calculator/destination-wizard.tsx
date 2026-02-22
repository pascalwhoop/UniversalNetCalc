"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, Check, Info } from "lucide-react"
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
import { DeductionManager } from "./deduction-manager"
import { CostOfLivingSection } from "./cost-of-living-section"
import { NoticeIcon } from "./notices"
import { CountryColumnState, CostOfLiving } from "@/lib/types"
import { getCountryName, getCurrencySymbol } from "@/lib/api"
import { getCountryFlag } from "@/lib/country-metadata"
import { useCountries, useYears, useVariants, useInputs } from "@/lib/queries"

const STEPS = ["Income", "Deductions", "Living Costs"]

interface DestinationWizardProps {
  open: boolean
  onClose: () => void
  initialState: CountryColumnState
  onSave: (state: CountryColumnState) => void
}

export function DestinationWizard({
  open,
  onClose,
  initialState,
  onSave,
}: DestinationWizardProps) {
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<CountryColumnState>(initialState)

  // Reset draft and step when wizard opens
  useEffect(() => {
    if (open) {
      setDraft(initialState)
      setStep(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const { country, year, variant, gross_annual, formValues, currency, costOfLiving } = draft

  const { data: countries = [] } = useCountries()
  const { data: years = [] } = useYears(country)
  const { data: variants = [] } = useVariants(country, year)
  const { data: inputsData } = useInputs(country, year, variant || undefined)

  const hasInitializedYearRef = useRef<string | null>(null)

  // Auto-select latest year when country changes
  useEffect(() => {
    if (years.length > 0 && !year && hasInitializedYearRef.current !== country) {
      const sorted = [...years].sort((a, b) => b.localeCompare(a))
      setDraft(prev => ({ ...prev, year: sorted[0] }))
      hasInitializedYearRef.current = country
    }
  }, [years, year, country])

  // Update currency and initialize form defaults when inputs load
  useEffect(() => {
    if (!inputsData) return

    const updates: Partial<CountryColumnState> = {}

    if (inputsData.currency && inputsData.currency !== currency) {
      updates.currency = inputsData.currency
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

  const canAdvance = step === 0 ? !!(country && year && gross_annual) : true
  const currencySymbol = getCurrencySymbol(currency || "EUR")

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      onSave(draft)
      onClose()
    }
  }

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1)
  }

  const title = country
    ? `${getCountryFlag(country)} ${getCountryName(country)}`
    : "New Destination"

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* Step indicator — div-based to avoid browser button hover/focus artifacts */}
        <div className="flex items-center px-6 pb-4 shrink-0">
          {STEPS.map((label, i) => {
            const isCompleted = i < step
            const isCurrent = i === step
            const isClickable = i < step // only allow going back

            return (
              <div key={i} className="flex items-center flex-1 min-w-0">
                <div
                  role={isClickable ? "button" : undefined}
                  tabIndex={isClickable ? 0 : undefined}
                  onClick={() => isClickable && setStep(i)}
                  onKeyDown={e => isClickable && e.key === "Enter" && setStep(i)}
                  className={[
                    "flex items-center gap-1.5 text-xs shrink-0 select-none outline-none",
                    isClickable ? "cursor-pointer" : "cursor-default",
                    isCompleted ? "text-primary" : isCurrent ? "text-foreground font-medium" : "text-muted-foreground",
                    isClickable ? "hover:opacity-70 transition-opacity" : "",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex h-5 w-5 items-center justify-center rounded-full text-[10px] border shrink-0 transition-colors",
                      isCompleted
                        ? "border-primary bg-primary text-primary-foreground"
                        : isCurrent
                          ? "border-foreground text-foreground"
                          : "border-muted-foreground/50 text-muted-foreground",
                    ].join(" ")}
                  >
                    {isCompleted ? <Check className="h-3 w-3" /> : i + 1}
                  </span>
                  <span className="hidden sm:inline">{label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={[
                      "flex-1 mx-2 h-px transition-colors",
                      isCompleted ? "bg-primary" : "bg-border",
                    ].join(" ")}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-6 min-h-0">
          {step === 0 && (
            <div className="space-y-4 pb-2">
              {/* Country & Year */}
              <div className="grid grid-cols-2 gap-3">
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
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    {currencySymbol}
                  </span>
                  <Input
                    type="number"
                    placeholder="100000"
                    className="h-9 pl-10"
                    value={gross_annual}
                    onChange={e => updateFormValue("gross_annual", e.target.value)}
                  />
                </div>
              </div>

              {/* Enum inputs */}
              {enumInputs.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
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
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3 pb-2">
              <p className="text-sm text-muted-foreground">
                Add tax deductions applicable in{" "}
                {country ? getCountryName(country) : "this country"}.
              </p>
              {Object.keys(inputDefs).length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    {country && year
                      ? "No deductions available for this configuration."
                      : "Select a country and year first."}
                  </p>
                </div>
              ) : (
                <DeductionManager
                  inputDefs={inputDefs}
                  formValues={formValues}
                  onUpdateFormValue={updateFormValue}
                  columnIndex={draft.index}
                  result={null}
                  calcRequest={null}
                />
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3 pb-2">
              <p className="text-sm text-muted-foreground">
                Enter estimated monthly living costs in {currencySymbol} to see disposable income.
              </p>
              <CostOfLivingSection
                value={costOfLiving}
                currencySymbol={currencySymbol}
                onChange={(col: CostOfLiving) => setDraft(prev => ({ ...prev, costOfLiving: col }))}
                alwaysOpen
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t shrink-0 mt-4">
          <Button variant="outline" onClick={step === 0 ? onClose : handleBack}>
            {step === 0 ? (
              "Cancel"
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </>
            )}
          </Button>
          <Button onClick={handleNext} disabled={!canAdvance}>
            {step === STEPS.length - 1 ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Done
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
