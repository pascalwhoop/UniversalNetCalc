"use client"

import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import { Pin, Plus, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CountryColumn } from "./country-column"
import { ComparisonSummary } from "./comparison-summary"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Toggle } from "@/components/ui/toggle"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ShareButton } from "./share-button"
import { SaveDialog } from "./save-dialog"
import { DestinationWizard } from "./destination-wizard"
import { CountryColumnState, DEFAULT_COST_OF_LIVING } from "@/lib/types"
import { decodeState, updateURL } from "@/lib/url-state"
import { useSearchParams } from "next/navigation"
import { fetchExchangeRate } from "@/lib/api"
import { useIsMobile } from "@/hooks/use-mobile"
import { MobileCountrySelector } from "./mobile-country-selector"
import { UnsupportedCurrencyError } from "@/lib/errors"
import { calculateNetDelta, findBestCountryByNet } from "@/lib/comparison-utils"
import { detectUserCountry } from "@/lib/detect-country"

const MAX_COUNTRIES = 4

function createEmptyCountryState(index: number): CountryColumnState {
  return {
    id: crypto.randomUUID(),
    index,
    country: "",
    year: "",
    variant: "",
    gross_annual: "",
    formValues: {},
    currency: "EUR",
    result: null,
    isCalculating: false,
    calculationError: null,
    costOfLiving: { ...DEFAULT_COST_OF_LIVING },
  }
}

function createDefaultCountryState(index: number, country?: string): CountryColumnState {
  return {
    id: crypto.randomUUID(),
    index,
    country: country || "",
    year: "",
    variant: "",
    gross_annual: "100000",
    formValues: {},
    currency: "EUR",
    result: null,
    isCalculating: false,
    calculationError: null,
    costOfLiving: { ...DEFAULT_COST_OF_LIVING },
  }
}

export function ComparisonGrid() {
  const searchParams = useSearchParams()
  const isMobile = useIsMobile()
  const hasInitializedFromUrl = useRef(false)
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [countries, setCountries] = useState<CountryColumnState[]>([
    createEmptyCountryState(0),
  ])

  const [isInitialized, setIsInitialized] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [pinSalaryDialogOpen, setPinSalaryDialogOpen] = useState(false)
  const [activeTabIndex, setActiveTabIndex] = useState(0)
  const [salaryModeSynced, setSalaryModeSynced] = useState(true)

  // Wizard state: null = closed, '__new__' = adding, '<id>' = editing
  const [wizardTargetId, setWizardTargetId] = useState<string | null>(null)

  const wizardInitialState = useMemo<CountryColumnState>(() => {
    if (wizardTargetId === "__new__") {
      const newState = createEmptyCountryState(countries.length)
      // In synced mode, pre-fill gross from the leader (index 0)
      if (salaryModeSynced) {
        const leader = [...countries].sort((a, b) => a.index - b.index).find(c => c.index === 0)
        if (leader?.gross_annual) {
          newState.gross_annual = leader.gross_annual
          newState.currency = leader.currency
        }
      }
      return newState
    }
    return countries.find(c => c.id === wizardTargetId) ?? createEmptyCountryState(0)
  }, [wizardTargetId, countries, salaryModeSynced])

  const handleWizardSave = useCallback(
    (saved: CountryColumnState) => {
      if (wizardTargetId === "__new__") {
        const newEntry: CountryColumnState = {
          ...saved,
          id: crypto.randomUUID(),
          index: countries.length,
          result: null,
          isCalculating: false,
          calculationError: null,
        }
        setCountries(prev => [...prev, newEntry])
        if (isMobile) setActiveTabIndex(countries.length)
      } else {
        // Update existing, reset result so it recalculates
        setCountries(prev =>
          prev.map(c =>
            c.id === wizardTargetId
              ? { ...saved, id: c.id, index: c.index, result: null, isCalculating: false, calculationError: null }
              : c
          )
        )
      }
      setWizardTargetId(null)
    },
    [wizardTargetId, countries.length, isMobile]
  )

  // Initialize from URL on mount ONLY
  useEffect(() => {
    if (hasInitializedFromUrl.current) return

    const urlState = decodeState(searchParams)

    if (urlState && urlState.countries.length > 0) {
      const entries: CountryColumnState[] = urlState.countries.map((state, index) => ({
        id: crypto.randomUUID(),
        index,
        country: state.country,
        year: state.year,
        variant: state.variant || "",
        gross_annual: state.gross_annual || "",
        formValues: state.formValues || {},
        currency: state.currency || "EUR",
        result: null,
        isCalculating: false,
        calculationError: null,
        costOfLiving: { ...DEFAULT_COST_OF_LIVING },
      }))

      setCountries(entries)
    } else {
      const detectedCountry = detectUserCountry()
      const initial = createDefaultCountryState(0, detectedCountry)
      setCountries([initial])
      // Open wizard immediately for the first destination
      setWizardTargetId(initial.id)
    }

    hasInitializedFromUrl.current = true
    setIsInitialized(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync state to URL (debounced)
  useEffect(() => {
    if (!isInitialized) return

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }

    updateTimeoutRef.current = setTimeout(() => {
      const states = countries
        .sort((a, b) => a.index - b.index)
        .map(c => ({
          country: c.country,
          year: c.year,
          variant: c.variant || undefined,
          gross_annual: c.gross_annual,
          formValues: c.formValues,
          currency: c.currency,
        }))
        .filter(s => s.country && s.year)

      if (states.length > 0) {
        updateURL(
          {
            countries: states,
            timestamp: Date.now(),
          },
          true
        )
      }
    }, 500)

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [countries, isInitialized])

  // Update a single country's state
  const updateCountry = useCallback(
    (id: string, updates: Partial<CountryColumnState>) => {
      setCountries(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)))

      if (!salaryModeSynced) return

      // When a follower's currency loads: sync salary FROM the leader (index 0)
      if ("currency" in updates && updates.currency && !("gross_annual" in updates)) {
        const targetCurrency = updates.currency
        setCountries(prev => {
          const me = prev.find(c => c.id === id)
          if (!me || me.index === 0) return prev // Leader doesn't sync from anyone
          const leader = [...prev].sort((a, b) => a.index - b.index).find(c => c.index === 0)
          if (!leader?.gross_annual) return prev
          const amount = parseFloat(leader.gross_annual)
          if (isNaN(amount)) return prev
          const sourceCurrency = leader.currency || "EUR"
          if (sourceCurrency === targetCurrency) {
            return prev.map(c => (c.id === id ? { ...c, gross_annual: leader.gross_annual } : c))
          }
          fetchExchangeRate(sourceCurrency, targetCurrency)
            .then(rate => {
              const converted = String(Math.round(amount * rate))
              setCountries(cols =>
                cols.map(col => (col.id === id ? { ...col, gross_annual: converted } : col))
              )
            })
            .catch(() => {
              setCountries(cols =>
                cols.map(col =>
                  col.id === id ? { ...col, gross_annual: leader.gross_annual } : col
                )
              )
            })
          return prev
        })
      }

      // When the leader's salary changes: propagate to all followers
      if ("gross_annual" in updates) {
        setCountries(prev => {
          const leader = prev.find(c => c.id === id)
          if (!leader || leader.index !== 0) return prev // Only leader propagates
          const amount = parseFloat(updates.gross_annual ?? "")
          if (isNaN(amount)) return prev
          const sourceCurrency = leader.currency || "EUR"

          prev.forEach(c => {
            if (c.id === id) return
            const targetCurrency = c.currency || "EUR"
            if (targetCurrency === sourceCurrency) {
              setCountries(cols =>
                cols.map(col =>
                  col.id === c.id
                    ? { ...col, gross_annual: updates.gross_annual ?? col.gross_annual }
                    : col
                )
              )
            } else {
              fetchExchangeRate(sourceCurrency, targetCurrency)
                .then(rate => {
                  const converted = String(Math.round(amount * rate))
                  setCountries(cols =>
                    cols.map(col => (col.id === c.id ? { ...col, gross_annual: converted } : col))
                  )
                })
                .catch(() => {
                  setCountries(cols =>
                    cols.map(col =>
                      col.id === c.id
                        ? { ...col, gross_annual: updates.gross_annual ?? col.gross_annual }
                        : col
                    )
                  )
                })
            }
          })
          return prev
        })
      }
    },
    [salaryModeSynced]
  )

  const handleSalaryModeChange = useCallback((synced: boolean) => {
    setSalaryModeSynced(synced)
    if (synced) {
      setCountries(prev => {
        const sorted = [...prev].sort((a, b) => a.index - b.index)
        const source = sorted.find(c => c.gross_annual)
        if (!source) return prev
        return prev.map(c => ({ ...c, gross_annual: source.gross_annual }))
      })
    }
  }, [])

  const addCountry = useCallback(() => {
    if (countries.length >= MAX_COUNTRIES) return
    setWizardTargetId("__new__")
  }, [countries.length])

  const removeCountry = useCallback(
    (id: string) => {
      if (countries.length > 1) {
        const filtered = countries.filter(c => c.id !== id)
        const renumbered = filtered.map((c, index) => ({ ...c, index }))
        setCountries(renumbered)

        if (isMobile && activeTabIndex >= renumbered.length) {
          setActiveTabIndex(Math.max(0, renumbered.length - 1))
        }
      }
    },
    [countries, isMobile, activeTabIndex]
  )

  const [normalizedNetValues, setNormalizedNetValues] = useState<Map<string, number>>(new Map())
  const BASE_CURRENCY = "EUR"

  const anyColHasCostOfLiving = countries.some(c => {
    const col = c.costOfLiving
    return col && Object.values(col).some(v => v > 0)
  })

  useEffect(() => {
    const normalize = async () => {
      const normalized = new Map<string, number>()

      for (const country of countries) {
        if (!country.result) continue

        const { net, currency } = country.result
        const cur = currency || "EUR"

        const monthlyCosts = anyColHasCostOfLiving
          ? Object.values(country.costOfLiving || {}).reduce((sum, v) => sum + v, 0)
          : 0
        const comparableNet = net - monthlyCosts * 12

        if (cur === BASE_CURRENCY) {
          normalized.set(country.id, comparableNet)
        } else {
          try {
            const rate = await fetchExchangeRate(cur, BASE_CURRENCY)
            normalized.set(country.id, comparableNet * rate)
          } catch (error) {
            if (error instanceof UnsupportedCurrencyError) {
              console.warn(
                `Exchange rate not available for ${error.currency}, using original value`
              )
            } else {
              console.error(`Failed to convert ${cur} to ${BASE_CURRENCY}:`, error)
            }
            normalized.set(country.id, comparableNet)
          }
        }
      }

      setNormalizedNetValues(normalized)
    }

    const hasResults = countries.some(c => c.result)
    if (hasResults) {
      normalize()
    } else {
      setNormalizedNetValues(new Map())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countries])

  const bestCountryId = findBestCountryByNet(normalizedNetValues)

  const getComparisonDelta = useCallback(
    (id: string): number | undefined => {
      if (!bestCountryId || bestCountryId === id) return undefined

      const bestNormalizedNet = normalizedNetValues.get(bestCountryId)
      const currentNormalizedNet = normalizedNetValues.get(id)
      const country = countries.find(c => c.id === id)

      if (!country?.result) {
        return undefined
      }

      const delta = calculateNetDelta(bestNormalizedNet, currentNormalizedNet, country.result)
      return delta ?? undefined
    },
    [bestCountryId, normalizedNetValues, countries]
  )

  const countriesWithState = countries.map(c => ({
    index: c.index,
    country: c.country,
  }))

  const visibleCountries = isMobile
    ? countries.filter(c => c.index === activeTabIndex)
    : countries

  const countryResults = new Map(
    countries
      .filter(c => c.result)
      .map(c => [c.id, { country: c.country, year: c.year, result: c.result! }])
  )

  return (
    <div className="flex flex-col h-full">
      {/* Desktop Header */}
      {!isMobile && (
        <div className="flex items-start justify-between gap-4 pb-4">
          <div>
            <h2 className="text-lg font-semibold">Compare Destinations</h2>
            <p className="text-sm text-muted-foreground">
              Add up to {MAX_COUNTRIES} destinations to compare side by side
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Toggle
                      variant="outline"
                      size="sm"
                      pressed={salaryModeSynced}
                      onPressedChange={handleSalaryModeChange}
                      aria-label={salaryModeSynced ? "Same salary for all (pinned)" : "Local salaries (unpinned)"}
                    >
                      <Pin className="h-3.5 w-3.5" />
                      Pin salary
                    </Toggle>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[200px]">
                  <p><strong>Pinned:</strong> One gross for all.</p>
                  <p className="mt-1"><strong>Unpinned:</strong> One gross per country.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              onClick={() => setSaveDialogOpen(true)}
              disabled={countryResults.size === 0}
              variant="outline"
              size="sm"
            >
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
            <ShareButton disabled={countries.length === 0} />
            <Button
              onClick={addCountry}
              disabled={countries.length >= MAX_COUNTRIES}
              variant="outline"
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Destination
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Header */}
      {isMobile && (
        <div className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold">Compare Destinations</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPinSalaryDialogOpen(true)}
                className={salaryModeSynced ? "bg-accent text-accent-foreground" : ""}
                aria-label={salaryModeSynced ? "Same salary for all (pinned)" : "Local salaries (unpinned)"}
              >
                <Pin className="h-3.5 w-3.5 mr-1.5" />
                Pin salary
              </Button>
              <Button
                onClick={() => setSaveDialogOpen(true)}
                disabled={countryResults.size === 0}
                variant="outline"
                size="sm"
              >
                <Save className="h-4 w-4" />
              </Button>
              <ShareButton disabled={countries.length === 0} />
            </div>
          </div>
        </div>
      )}

      {/* Mobile: Pin salary dialog (opened by Pin salary button) */}
      <Dialog open={pinSalaryDialogOpen} onOpenChange={setPinSalaryDialogOpen}>
        <DialogContent className="sm:max-w-[280px]">
          <DialogHeader>
            <DialogTitle>Pin salary</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 pt-1 text-left text-sm">
                <p><strong>Pinned:</strong> One gross for all.</p>
                <p><strong>Unpinned:</strong> One gross per country.</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant={salaryModeSynced ? "default" : "outline"}
              size="sm"
              onClick={() => {
                handleSalaryModeChange(true)
                setPinSalaryDialogOpen(false)
              }}
            >
              Same salary
            </Button>
            <Button
              variant={!salaryModeSynced ? "default" : "outline"}
              size="sm"
              onClick={() => {
                handleSalaryModeChange(false)
                setPinSalaryDialogOpen(false)
              }}
            >
              Local salaries
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile Country Tabs */}
      {isMobile && countries.length > 0 && (
        <MobileCountrySelector
          countries={countriesWithState}
          activeIndex={activeTabIndex}
          onTabChange={setActiveTabIndex}
          onAddCountry={addCountry}
          canAddMore={countries.length < MAX_COUNTRIES}
        />
      )}

      {/* Comparison Summary */}
      {countries.filter(c => c.country && c.year).length >= 2 && (
        <div className={isMobile ? "mb-4" : ""}>
          <ComparisonSummary
            results={countryResults}
            normalizedNetValues={normalizedNetValues}
            displayOrder={countries.sort((a, b) => a.index - b.index).map(c => c.id)}
          />
        </div>
      )}

      {/* Country Columns */}
      {isMobile ? (
        <div className="flex-1 overflow-y-auto">
          {visibleCountries.map(country => (
            <CountryColumn
              key={country.id}
              {...country}
              onUpdate={updates => updateCountry(country.id, updates)}
              onRemove={() => removeCountry(country.id)}
              onEdit={() => setWizardTargetId(country.id)}
              showRemove={countries.length > 1}
              isBest={bestCountryId === country.id}
              comparisonDelta={getComparisonDelta(country.id)}
            />
          ))}
        </div>
      ) : (
        <ScrollArea className="flex-1 -mx-4 px-4">
          <div
            className="grid gap-4 pb-4"
            style={{
              gridTemplateColumns: `repeat(${countries.length}, minmax(300px, 1fr))`,
            }}
          >
            {countries.map(country => (
              <CountryColumn
                key={country.id}
                {...country}
                onUpdate={updates => updateCountry(country.id, updates)}
                onRemove={() => removeCountry(country.id)}
                onEdit={() => setWizardTargetId(country.id)}
                showRemove={countries.length > 1}
                isBest={bestCountryId === country.id}
                comparisonDelta={getComparisonDelta(country.id)}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {/* Save Dialog */}
      <SaveDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        state={{
          countries: countries.map(c => ({
            country: c.country,
            year: c.year,
            variant: c.variant || undefined,
            gross_annual: c.gross_annual,
            formValues: c.formValues,
            currency: c.currency,
          })),
          timestamp: Date.now(),
        }}
        results={countryResults}
      />

      {/* Destination Wizard */}
      {wizardTargetId && (
        <DestinationWizard
          open={!!wizardTargetId}
          onClose={() => setWizardTargetId(null)}
          initialState={wizardInitialState}
          onSave={handleWizardSave}
          salaryModeSynced={salaryModeSynced}
          isLeader={
            wizardTargetId === "__new__"
              ? false
              : (countries.find(c => c.id === wizardTargetId)?.index ?? 1) === 0
          }
        />
      )}
    </div>
  )
}
