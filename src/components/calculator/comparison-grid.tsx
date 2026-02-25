"use client"

import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import { Pin, Plus, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ComparisonTable } from "./comparison-table"
import { CountryCalculator } from "./country-calculator"
import { Toggle } from "@/components/ui/toggle"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { ShareButton } from "./share-button"
import { SaveDialog } from "./save-dialog"
import { DestinationWizard } from "./destination-wizard"
import { CountryColumnState, DEFAULT_COST_OF_LIVING } from "@/lib/types"
import { decodeState, updateURL } from "@/lib/url-state"
import { useSearchParams } from "next/navigation"
import { getExchangeRate } from "@/lib/api"
import { UnsupportedCurrencyError } from "@/lib/errors"
import { findBestCountryByNet } from "@/lib/comparison-utils"
import { detectUserCountry } from "@/lib/detect-country"

const MAX_COUNTRIES = 4

function createCountryState(index: number, country = "", gross_annual = ""): CountryColumnState {
  return {
    id: crypto.randomUUID(),
    index,
    country,
    year: "",
    variant: "",
    gross_annual,
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
  const hasInitializedFromUrl = useRef(false)
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [countries, setCountries] = useState<CountryColumnState[]>([
    createCountryState(0),
  ])

  const [isInitialized, setIsInitialized] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [salaryModeSynced, setSalaryModeSynced] = useState(true)

  // Wizard state: null = closed, '__new__' = adding, '<id>' = editing
  const [wizardTargetId, setWizardTargetId] = useState<string | null>(null)

  const wizardInitialState = useMemo<CountryColumnState>(() => {
    if (wizardTargetId === "__new__") {
      const newState = createCountryState(countries.length)
      if (salaryModeSynced) {
        const leader = countries.find(c => c.index === 0)
        if (leader?.gross_annual) {
          newState.gross_annual = leader.gross_annual
          newState.currency = leader.currency
        }
      }
      return newState
    }
    return countries.find(c => c.id === wizardTargetId) ?? createCountryState(0)
  }, [wizardTargetId, countries, salaryModeSynced])

  // Stable ref so handleWizardSave (defined before updateCountry) can call it
  const updateCountryRef = useRef<(id: string, updates: Partial<CountryColumnState>) => void>(() => {})

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
      } else if (wizardTargetId) {
        updateCountryRef.current(wizardTargetId, {
          country: saved.country,
          year: saved.year,
          variant: saved.variant,
          gross_annual: saved.gross_annual,
          formValues: saved.formValues,
          currency: saved.currency,
          costOfLiving: saved.costOfLiving,
        })
      }
      setWizardTargetId(null)
    },
    [wizardTargetId, countries.length]
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
      const initial = createCountryState(0, detectedCountry, "100000")
      setCountries([initial])
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
          if (!me || me.index === 0) return prev
          const leader = prev.find(c => c.index === 0)
          if (!leader?.gross_annual) return prev
          const amount = parseFloat(leader.gross_annual)
          if (isNaN(amount)) return prev
          const sourceCurrency = leader.currency || "EUR"
          if (sourceCurrency === targetCurrency) {
            return prev.map(c => (c.id === id ? { ...c, gross_annual: leader.gross_annual } : c))
          }
          getExchangeRate(sourceCurrency, targetCurrency)
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

      // When the leader's salary changes: propagate to all followers (batch rates, single setState)
      if ("gross_annual" in updates) {
        setCountries(prev => {
          const leader = prev.find(c => c.id === id)
          if (!leader || leader.index !== 0) return prev
          const amount = parseFloat(updates.gross_annual ?? "")
          if (isNaN(amount)) return prev
          const sourceCurrency = leader.currency || "EUR"

          const followers = prev.filter(c => c.id !== id)
          const sameCurrency = followers.filter(c => (c.currency || "EUR") === sourceCurrency)
          const diffCurrency = followers.filter(c => (c.currency || "EUR") !== sourceCurrency)

          const next = prev.map(c => {
            if (c.id === id) return { ...c, gross_annual: updates.gross_annual ?? c.gross_annual }
            if (sameCurrency.some(f => f.id === c.id)) return { ...c, gross_annual: updates.gross_annual ?? c.gross_annual }
            return c
          })

          if (diffCurrency.length > 0) {
            Promise.all(
              diffCurrency.map(c => getExchangeRate(sourceCurrency, c.currency || "EUR"))
            )
              .then(rates =>
                setCountries(cols =>
                  cols.map(col => {
                    const i = diffCurrency.findIndex(f => f.id === col.id)
                    if (i === -1) return col
                    return { ...col, gross_annual: String(Math.round(amount * rates[i])) }
                  })
                )
              )
              .catch(() =>
                setCountries(cols =>
                  cols.map(col => {
                    const i = diffCurrency.findIndex(f => f.id === col.id)
                    if (i === -1) return col
                    return { ...col, gross_annual: leader.gross_annual }
                  })
                )
              )
          }

          return next
        })
      }
    },
    [salaryModeSynced]
  )

  // Keep ref in sync so handleWizardSave can call updateCountry
  updateCountryRef.current = updateCountry

  const handleSalaryModeChange = useCallback((synced: boolean) => {
    setSalaryModeSynced(synced)
    if (synced) {
      // Re-pinning: find leader and propagate via updateCountry (handles FX conversion)
      const sorted = [...countries].sort((a, b) => a.index - b.index)
      const leader = sorted.find(c => c.gross_annual)
      if (leader) {
        updateCountry(leader.id, { gross_annual: leader.gross_annual })
      }
    }
  }, [countries, updateCountry])

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
      }
    },
    [countries]
  )

  const [normalizedNetValues, setNormalizedNetValues] = useState<Map<string, number>>(new Map())
  const [normalizedDisplay, setNormalizedDisplay] = useState<Map<string, { base: number; original: number; currency: string }>>(new Map())
  const [baseCurrency, setBaseCurrency] = useState("EUR")

  const anyColHasCostOfLiving = countries.some(c => {
    const col = c.costOfLiving
    return col && Object.values(col).some(v => v > 0)
  })

  const normKey = useMemo(() => {
    const sorted = [...countries].sort((a, b) => a.index - b.index)
    return sorted
      .filter(c => c.result)
      .map(c => {
        const costSum = anyColHasCostOfLiving
          ? Object.values(c.costOfLiving || {}).reduce((s, v) => s + v, 0)
          : 0
        return `${c.id}:${c.result!.net}:${c.result!.currency}:${costSum}`
      })
      .join("|")
  }, [countries, anyColHasCostOfLiving])

  useEffect(() => {
    const normalize = async () => {
      const sorted = [...countries].sort((a, b) => a.index - b.index)
      const firstWithResult = sorted.find(c => c.result)
      const base = firstWithResult?.result?.currency || firstWithResult?.currency || "EUR"

      const normalized = new Map<string, number>()
      const display = new Map<string, { base: number; original: number; currency: string }>()

      for (const country of countries) {
        if (!country.result) continue

        const { net, currency } = country.result
        const cur = currency || "EUR"

        const monthlyCosts = anyColHasCostOfLiving
          ? Object.values(country.costOfLiving || {}).reduce((sum, v) => sum + v, 0)
          : 0
        const comparableNet = net - monthlyCosts * 12

        let rate = 1
        if (cur !== base) {
          try {
            rate = await getExchangeRate(cur, base)
          } catch (error) {
            if (error instanceof UnsupportedCurrencyError) {
              console.warn(
                `Exchange rate not available for ${error.currency}, using original value`
              )
            } else {
              console.error(`Failed to convert ${cur} to ${base}:`, error)
            }
          }
        }

        display.set(country.id, { base: net * rate, original: net, currency: cur })
        normalized.set(country.id, cur === base ? comparableNet : comparableNet * rate)
      }

      setBaseCurrency(base)
      setNormalizedNetValues(normalized)
      setNormalizedDisplay(display)
    }

    const hasResults = countries.some(c => c.result)
    if (hasResults) {
      normalize()
    } else {
      setBaseCurrency("EUR")
      setNormalizedNetValues(new Map())
      setNormalizedDisplay(new Map())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normKey])

  const bestCountryId = findBestCountryByNet(normalizedNetValues)

  const countryResults = new Map(
    countries
      .filter(c => c.result)
      .map(c => [c.id, { country: c.country, year: c.year, result: c.result! }])
  )

  const sortedCountries = [...countries].sort((a, b) => a.index - b.index)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 pb-4">
        <div>
          <h2 className="text-lg font-semibold">Compare Destinations</h2>
          <p className="text-sm text-muted-foreground">
            Add up to {MAX_COUNTRIES} destinations to compare side by side
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <HoverCard openDelay={300} closeDelay={100}>
            <HoverCardTrigger asChild>
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
            </HoverCardTrigger>
            <HoverCardContent side="bottom">
              <p className="text-sm">Pinned: one gross for all. Unpinned: one gross per country.</p>
            </HoverCardContent>
          </HoverCard>
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
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Destination
          </Button>
        </div>
      </div>

      {/* Renderless calculation triggers — one per country */}
      {sortedCountries.map(c => (
        <CountryCalculator
          key={c.id}
          state={c}
          onUpdate={updates => updateCountry(c.id, updates)}
        />
      ))}

      {/* Comparison Table */}
      <ComparisonTable
        countries={sortedCountries}
        onEdit={id => setWizardTargetId(id)}
        onRemove={removeCountry}
        onConfigure={id => setWizardTargetId(id)}
        bestCountryId={bestCountryId}
        showRemove={countries.length > 1}
        normalizedDisplay={normalizedDisplay}
        baseCurrency={baseCurrency}
      />

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
      {wizardTargetId && (() => {
        const target = countries.find(c => c.id === wizardTargetId)
        const leader = countries.find(c => c.index === 0)
        const isLeader = wizardTargetId === "__new__" ? false : (target?.index ?? 1) === 0
        return (
          <DestinationWizard
            open={!!wizardTargetId}
            onClose={() => setWizardTargetId(null)}
            initialState={wizardInitialState}
            onSave={handleWizardSave}
            salaryModeSynced={salaryModeSynced}
            isLeader={isLeader}
            leaderGrossAnnual={!isLeader ? leader?.gross_annual : undefined}
            leaderCurrency={!isLeader ? leader?.currency : undefined}
          />
        )
      })()}
    </div>
  )
}
