"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Check, Info, ChevronDown, FileText, Link2 } from "lucide-react"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { DeductionManager } from "./deduction-manager"
import { CostOfLivingSection } from "./cost-of-living-section"
import { NoticeIcon, filterNoticesForVariant, NoticeRow, getSeverityIcon, getSeverityColor } from "./notices"
import { CountryColumnState, type CostOfLiving } from "@/lib/types"
import { getCountryName, getCurrencySymbol, getExchangeRate, calculateSalary, type CalculationResult } from "@/lib/api"
import { getCountryFlag } from "@/lib/country-metadata"
import { useMediaQuery } from "@/lib/hooks"
import { useCountries, useYears, useVariants, useInputs } from "@/lib/queries"
import { buildCalcRequest } from "@/lib/calc-utils"
import { formatCurrency } from "@/lib/formatters"
import ReactMarkdown from "react-markdown"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

/**
 * Destination wizard layout:
 * - Desktop (md+): Sheet (right-side panel). Mobile: Drawer (right) for better keyboard behavior.
 * - Content is an Accordion of 3 sections: Basics, Deductions, Expenses.
 * - Within accordion sections we use Collapsibles for documentation/info (e.g. Notes & Sources in Basics).
 */

interface DestinationWizardProps {
  open: boolean
  onClose: () => void
  initialState: CountryColumnState
  onSave: (state: CountryColumnState) => void
  salaryModeSynced?: boolean
  isLeader?: boolean
  /** When editing a follower column, pass leader's gross/currency so conversion uses the right source */
  leaderGrossAnnual?: string
  leaderCurrency?: string
}

export function DestinationWizard({
  open,
  onClose,
  initialState,
  onSave,
  salaryModeSynced = false,
  isLeader = true,
  leaderGrossAnnual,
  leaderCurrency: leaderCurrencyProp,
}: DestinationWizardProps) {
  const [draft, setDraft] = useState<CountryColumnState>(initialState)

  const leaderGrossRef = useRef<string>(initialState.gross_annual)
  const leaderCurrencyRef = useRef<string>(initialState.currency || "EUR")

  useEffect(() => {
    if (open) {
      setDraft(initialState)
      leaderGrossRef.current = isLeader ? initialState.gross_annual : (leaderGrossAnnual ?? initialState.gross_annual)
      leaderCurrencyRef.current = isLeader ? (initialState.currency || "EUR") : (leaderCurrencyProp ?? initialState.currency ?? "EUR")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isLeader, leaderGrossAnnual, leaderCurrencyProp])

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
    } else if (inputsData.currency && !isLeader && inputsData.currency === leaderCurrencyRef.current) {
      updates.gross_annual = leaderGrossRef.current
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
  const filteredNotices = useMemo(() => {
    const list = filterNoticesForVariant(inputsData?.notices ?? [], variant)
    const severityRank = { error: 0, warning: 1, info: 2 } as const
    return [...list].sort((a, b) => {
      const ra = severityRank[a.severity ?? "info"] ?? 2
      const rb = severityRank[b.severity ?? "info"] ?? 2
      return ra - rb
    })
  }, [inputsData?.notices, variant])
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

  const isDesktop = useMediaQuery("(min-width: 768px)")

  const scrollContent = (
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Notices, Notes, Sources (collapsed by default, above Accordion) */}
          <div className="px-6 space-y-2">
          {filteredNotices.length > 0 && (
            <Collapsible className="rounded-lg border bg-background/50 dark:bg-muted/20">
              <CollapsibleTrigger className="group flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-medium hover:bg-muted/30 rounded-md transition-colors data-[state=open]:rounded-b-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <span className="flex items-center gap-2">
                  <span className={getSeverityColor(filteredNotices[0]?.severity)}>
                    {getSeverityIcon(filteredNotices[0]?.severity, "h-4 w-4 shrink-0")}
                  </span>
                  Notices
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-3 pb-3 pt-1 border-t border-border/50 space-y-3 text-muted-foreground">
                  <ul className="space-y-3 list-none pl-0">
                    {filteredNotices.map(n => (
                      <li key={n.id}>
                        <NoticeRow notice={n} />
                      </li>
                    ))}
                  </ul>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
          {inputsData?.notes?.trim() && (
            <Collapsible className="rounded-lg border bg-background/50 dark:bg-muted/20">
              <CollapsibleTrigger className="group flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-medium hover:bg-muted/30 rounded-md transition-colors data-[state=open]:rounded-b-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  Notes
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-3 pb-3 pt-1 border-t border-border/50 text-muted-foreground">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{inputsData.notes.trim()}</ReactMarkdown>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
          {inputsData?.sources && inputsData.sources.length > 0 && (
            <Collapsible className="rounded-lg border bg-background/50 dark:bg-muted/20">
              <CollapsibleTrigger className="group flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-medium hover:bg-muted/30 rounded-md transition-colors data-[state=open]:rounded-b-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <span className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  Sources
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-3 pb-3 pt-1 border-t border-border/50 text-muted-foreground">
                  <ul className="space-y-1 list-disc pl-4 prose prose-sm dark:prose-invert max-w-none">
                    {inputsData.sources.map((s, i) => (
                      <li key={i}>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {s.description || s.url}
                        </a>
                        {s.retrieved_at && (
                          <span className="ml-1.5">(retrieved {s.retrieved_at})</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
          </div>

          {/* Accordion: Basics, Deductions, Expenses */}
          <div className="px-6 pt-4 pb-4">
            <Accordion type="single" defaultValue="basics" collapsible>
            <AccordionItem value="basics">
              <AccordionTrigger>Basics</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
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
                <HoverCard openDelay={200} closeDelay={100}>
                  <HoverCardTrigger asChild>
                    <InputGroup data-disabled>
                      <InputGroupInput
                        type="text"
                        inputMode="decimal"
                        placeholder="100000"
                        value={gross_annual}
                        disabled
                        readOnly
                      />
                      <InputGroupAddon align="inline-start">
                        <InputGroupText>{currencySymbol}</InputGroupText>
                      </InputGroupAddon>
                    </InputGroup>
                  </HoverCardTrigger>
                  <HoverCardContent side="top" className="max-w-xs">
                    <p className="text-xs">
                      Salary is synced from the primary destination. Switch to{" "}
                      <strong>Local salaries</strong> mode to set each country independently.
                    </p>
                  </HoverCardContent>
                </HoverCard>
              ) : (
                <InputGroup>
                  <InputGroupInput
                    type="text"
                    inputMode="decimal"
                    placeholder="100000"
                    value={gross_annual}
                    onChange={e => updateFormValue("gross_annual", e.target.value)}
                  />
                  <InputGroupAddon align="inline-start">
                    <InputGroupText>{currencySymbol}</InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
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
                        <HoverCard openDelay={200} closeDelay={100}>
                          <HoverCardTrigger asChild>
                            <span className="inline-flex cursor-help">
                              <Info className="h-3 w-3 text-muted-foreground" />
                            </span>
                          </HoverCardTrigger>
                          <HoverCardContent side="top" className="max-w-xs">
                            <p className="text-xs">{def.description}</p>
                          </HoverCardContent>
                        </HoverCard>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

                </div>
              </AccordionContent>
            </AccordionItem>

            {country && year && Object.keys(inputDefs).length > 0 && (
              <AccordionItem value="deductions">
                <AccordionTrigger>Tax Deductions ({activeDeductionCount} active)</AccordionTrigger>
                <AccordionContent>
                  <DeductionManager
                    inputDefs={inputDefs}
                    formValues={formValues}
                    onUpdateFormValue={updateFormValue}
                    columnIndex={draft.index}
                    previewResult={previewResult}
                    calcRequest={previewCalcRequest}
                  />
                </AccordionContent>
              </AccordionItem>
            )}

            <AccordionItem value="expenses">
              <AccordionTrigger>
                Expenses ({totalMonthlyCosts > 0 ? `${currencySymbol}${totalMonthlyCosts.toLocaleString()}/mo` : "none"})
              </AccordionTrigger>
              <AccordionContent>
                <CostOfLivingSection
                  value={costOfLiving}
                  currencySymbol={currencySymbol}
                  onChange={(col: CostOfLiving) => setDraft(prev => ({ ...prev, costOfLiving: col }))}
                  alwaysOpen
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          </div>
        </div>
  )

  const mobileFooter = (
    <>
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
        <DrawerClose asChild>
          <Button variant="outline">Cancel</Button>
        </DrawerClose>
        <Button onClick={handleSave} disabled={!canSave}>
          <Check className="h-4 w-4 mr-1" />
          Apply
        </Button>
      </div>
    </>
  )

  if (isDesktop) {
    return (
      <Sheet open={open} onOpenChange={v => !v && onClose()}>
        <SheetContent side="right" className="flex flex-col gap-0 p-0 w-full max-w-[500px] sm:max-w-[500px] h-full">
          <SheetHeader className="px-6 pt-6 pb-4 shrink-0">
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          {scrollContent}
          <SheetFooter className="flex-row justify-between border-t shrink-0 px-6 py-4">
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
              <SheetClose asChild>
                <Button variant="outline">Cancel</Button>
              </SheetClose>
              <Button onClick={handleSave} disabled={!canSave}>
                <Check className="h-4 w-4 mr-1" />
                Apply
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Drawer open={open} onOpenChange={v => !v && onClose()} direction="right">
      <DrawerContent className="flex flex-col gap-0 p-0 inset-0 w-full min-h-dvh h-full max-w-none border-0 [&>.bg-muted]:hidden data-[vaul-drawer-direction=right]:w-full! data-[vaul-drawer-direction=right]:max-w-none! data-[vaul-drawer-direction=right]:left-0!">
        <DrawerHeader className="px-6 pt-6 pb-4 shrink-0">
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>
        {scrollContent}
        <DrawerFooter className="flex-row justify-between border-t shrink-0 px-6 py-4">
          {mobileFooter}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
