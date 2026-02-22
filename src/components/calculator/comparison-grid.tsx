"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Plus, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CountryColumn } from "./country-column"
import { ComparisonSummary } from "./comparison-summary"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ShareButton } from "./share-button"
import { SaveDialog } from "./save-dialog"
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

  // All country state in parent - start with empty country to avoid hydration mismatch
  const [countries, setCountries] = useState<CountryColumnState[]>([
    createEmptyCountryState(0),
  ])

  const [isInitialized, setIsInitialized] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [activeTabIndex, setActiveTabIndex] = useState(0)
  const [salaryModeSynced, setSalaryModeSynced] = useState(true)

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
      // No URL state, detect country client-side only
      const detectedCountry = detectUserCountry()
      setCountries([createDefaultCountryState(0, detectedCountry)])
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
  const updateCountry = useCallback((id: string, updates: Partial<CountryColumnState>) => {
    setCountries(prev => {
      const next = prev.map(c => (c.id === id ? { ...c, ...updates } : c))
      return next
    })

    // In synced mode, when a column's currency is set (country selected), convert its gross from a sibling
    if (salaryModeSynced && "currency" in updates && updates.currency && !("gross_annual" in updates)) {
      const targetCurrency = updates.currency
      setCountries(prev => {
        const source = prev.find(c => c.id !== id && c.gross_annual)
        if (!source) return prev
        const amount = parseFloat(source.gross_annual)
        if (isNaN(amount)) return prev
        const sourceCurrency = source.currency || "EUR"
        if (sourceCurrency === targetCurrency) {
          return prev.map(c => c.id === id ? { ...c, gross_annual: source.gross_annual } : c)
        }
        fetchExchangeRate(sourceCurrency, targetCurrency)
          .then(rate => {
            const converted = String(Math.round(amount * rate))
            setCountries(cols => cols.map(col => col.id === id ? { ...col, gross_annual: converted } : col))
          })
          .catch(() => {
            setCountries(cols => cols.map(col => col.id === id ? { ...col, gross_annual: source.gross_annual } : col))
          })
        return prev
      })
    }

    // In synced mode, propagate gross_annual changes to all other columns with currency conversion
    if (salaryModeSynced && "gross_annual" in updates) {
      const newGross = updates.gross_annual
      const amount = parseFloat(newGross ?? "")
      if (isNaN(amount)) return

      setCountries(prev => {
        const source = prev.find(c => c.id === id)
        if (!source) return prev
        const sourceCurrency = source.currency || "EUR"

        // Kick off async conversion for each other column
        prev.forEach(c => {
          if (c.id === id) return
          const targetCurrency = c.currency || "EUR"
          if (targetCurrency === sourceCurrency) {
            setCountries(cols => cols.map(col => col.id === c.id ? { ...col, gross_annual: newGross ?? col.gross_annual } : col))
          } else {
            fetchExchangeRate(sourceCurrency, targetCurrency)
              .then(rate => {
                const converted = String(Math.round(amount * rate))
                setCountries(cols => cols.map(col => col.id === c.id ? { ...col, gross_annual: converted } : col))
              })
              .catch(() => {
                // Fallback: copy raw value if conversion unavailable
                setCountries(cols => cols.map(col => col.id === c.id ? { ...col, gross_annual: newGross ?? col.gross_annual } : col))
              })
          }
        })
        return prev
      })
    }
  }, [salaryModeSynced])

  // Toggle salary mode
  const handleSalaryModeChange = useCallback((synced: boolean) => {
    setSalaryModeSynced(synced)
    if (synced) {
      // Sync all columns to the first column that has a gross value
      setCountries(prev => {
        const sorted = [...prev].sort((a, b) => a.index - b.index)
        const source = sorted.find(c => c.gross_annual)
        if (!source) return prev
        return prev.map(c => ({ ...c, gross_annual: source.gross_annual }))
      })
    }
  }, [])

  // Add new country
  const addCountry = useCallback(() => {
    if (countries.length >= MAX_COUNTRIES) return

    const newState = createEmptyCountryState(countries.length)

    // In synced mode, pre-fill gross from the first column that has a value
    if (salaryModeSynced) {
      const source = countries.find(c => c.gross_annual)
      if (source) {
        const amount = parseFloat(source.gross_annual)
        if (!isNaN(amount)) {
          // We don't know the new column's currency yet (no country selected),
          // so store the source amount; it will be re-converted when the user picks a country.
          newState.gross_annual = source.gross_annual
          newState.currency = source.currency
        }
      }
    }

    setCountries(prev => [...prev, newState])
    if (isMobile) {
      setActiveTabIndex(countries.length)
    }
  }, [countries, isMobile, salaryModeSynced])

  // Remove country
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

  // Calculate normalized net values for comparison
  const [normalizedNetValues, setNormalizedNetValues] = useState<Map<string, number>>(new Map())
  const BASE_CURRENCY = "EUR"

  // Check if any column has cost-of-living data
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

        // Use disposable income if any column has COL data
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
            // Unsupported currency errors are expected, don't log as error
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

  // Find best country
  const bestCountryId = findBestCountryByNet(normalizedNetValues)

  // Calculate delta for a country
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

  // Countries with state for mobile selector
  const countriesWithState = countries.map(c => ({
    index: c.index,
    country: c.country,
  }))

  // Visible countries based on mobile/desktop
  const visibleCountries = isMobile
    ? countries.filter(c => c.index === activeTabIndex)
    : countries

  // Results map for ComparisonSummary and SaveDialog
  const countryResults = new Map(
    countries
      .filter(c => c.result)
      .map(c => [c.id, { country: c.country, year: c.year, result: c.result! }])
  )

  return (
    <div className="flex flex-col h-full">
      {/* Desktop Header */}
      {!isMobile && (
        <div className="flex items-center justify-between pb-4">
          <div>
            <h2 className="text-lg font-semibold">Compare Destinations</h2>
            <p className="text-sm text-muted-foreground">
              Add up to {MAX_COUNTRIES} destinations to compare side by side
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Salary mode toggle */}
            <TooltipProvider delayDuration={300}>
              <Tabs
                value={salaryModeSynced ? "synced" : "independent"}
                onValueChange={v => handleSalaryModeChange(v === "synced")}
              >
                <TabsList>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <TabsTrigger value="synced">Same salary</TabsTrigger>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-[200px]">One gross salary applied to all destinations — compare nets across tax systems.</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <TabsTrigger value="independent">Local salaries</TabsTrigger>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-[200px]">Each destination has its own gross — for comparing real market-rate offers.</p>
                    </TooltipContent>
                  </Tooltip>
                </TabsList>
              </Tabs>
            </TooltipProvider>
            <div className="flex gap-2">
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
        </div>
      )}

      {/* Mobile Header */}
      {isMobile && (
        <div className="pb-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-semibold">Compare Destinations</h2>
            <div className="flex gap-2">
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
          {/* Salary mode toggle (mobile) */}
          <Tabs
            value={salaryModeSynced ? "synced" : "independent"}
            onValueChange={v => handleSalaryModeChange(v === "synced")}
          >
            <TabsList>
              <TabsTrigger value="synced">Same salary</TabsTrigger>
              <TabsTrigger value="independent">Local salaries</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

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
            displayOrder={countries
              .sort((a, b) => a.index - b.index)
              .map(c => c.id)}
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
    </div>
  )
}
