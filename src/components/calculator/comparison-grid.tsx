"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Plus, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CountryColumn } from "./country-column"
import { ComparisonSummary } from "./comparison-summary"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { ShareButton } from "./share-button"
import { SaveDialog } from "./save-dialog"
import { CountryColumnState } from "@/lib/types"
import { decodeState, updateURL } from "@/lib/url-state"
import { useSearchParams } from "next/navigation"
import { CalculationResult, fetchExchangeRate } from "@/lib/api"
import { useIsMobile } from "@/hooks/use-mobile"
import { MobileCountrySelector } from "./mobile-country-selector"
import { useCalculateSalary } from "@/lib/queries"

const MAX_COUNTRIES = 4

export function ComparisonGrid() {
  const searchParams = useSearchParams()
  const isMobile = useIsMobile()
  const hasInitializedFromUrl = useRef(false)
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // All country state in parent
  const [countries, setCountries] = useState<CountryColumnState[]>([
    {
      id: crypto.randomUUID(),
      index: 0,
      country: "",
      year: "",
      variant: "",
      gross_annual: "",
      formValues: {},
      currency: "EUR",
      result: null,
      isCalculating: false,
      calculationError: null,
    },
  ])

  const [isInitialized, setIsInitialized] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [activeTabIndex, setActiveTabIndex] = useState(0)

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
      }))

      setCountries(entries)
    }

    hasInitializedFromUrl.current = true
    setIsInitialized(true)
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
    setCountries(prev =>
      prev.map(c => (c.id === id ? { ...c, ...updates } : c))
    )
  }, [])

  // Add new country
  const addCountry = useCallback(() => {
    if (countries.length < MAX_COUNTRIES) {
      const newCountry: CountryColumnState = {
        id: crypto.randomUUID(),
        index: countries.length,
        country: "",
        year: "",
        variant: "",
        gross_annual: "",
        formValues: {},
        currency: "EUR",
        result: null,
        isCalculating: false,
        calculationError: null,
      }
      setCountries(prev => [...prev, newCountry])
      if (isMobile) {
        setActiveTabIndex(countries.length)
      }
    }
  }, [countries.length, isMobile])

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
    [countries.length, isMobile, activeTabIndex]
  )

  // Copy gross to all countries with currency conversion
  const copyGrossToAll = useCallback(
    async (sourceId: string) => {
      const source = countries.find(c => c.id === sourceId)
      if (!source || !source.gross_annual) return

      const sourceAmount = parseFloat(source.gross_annual)
      if (isNaN(sourceAmount)) return

      // Convert to each country's currency
      const updates = await Promise.all(
        countries.map(async c => {
          if (c.id === sourceId) return c

          if (c.currency === source.currency) {
            return { ...c, gross_annual: source.gross_annual }
          } else {
            try {
              const sourceCurrency = source.currency || "EUR"
              const targetCurrency = c.currency || "EUR"
              const rate = await fetchExchangeRate(sourceCurrency, targetCurrency)
              const converted = Math.round(sourceAmount * rate)
              return { ...c, gross_annual: String(converted) }
            } catch (e) {
              console.error("Currency conversion failed:", e)
              return { ...c, gross_annual: source.gross_annual }
            }
          }
        })
      )

      setCountries(updates)
      toast.success("Salary copied to all countries")
    },
    [countries]
  )

  // Calculate normalized net values for comparison
  const [normalizedNetValues, setNormalizedNetValues] = useState<Map<string, number>>(new Map())
  const BASE_CURRENCY = "EUR"

  useEffect(() => {
    const normalize = async () => {
      const normalized = new Map<string, number>()

      for (const country of countries) {
        if (!country.result) continue

        const { net, currency } = country.result
        const cur = currency || "EUR"

        if (cur === BASE_CURRENCY) {
          normalized.set(country.id, net)
        } else {
          try {
            const rate = await fetchExchangeRate(cur, BASE_CURRENCY)
            normalized.set(country.id, net * rate)
          } catch (error) {
            console.error(`Failed to convert ${cur} to ${BASE_CURRENCY}:`, error)
            normalized.set(country.id, net)
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
  }, [countries])

  // Find best country
  const bestCountryId =
    normalizedNetValues.size >= 2
      ? Array.from(normalizedNetValues.entries()).reduce((best, [id, net]) =>
          net > (normalizedNetValues.get(best) || -Infinity) ? id : best
        , normalizedNetValues.keys().next().value as string)
      : null

  // Calculate delta for a country
  const getComparisonDelta = useCallback(
    (id: string): number | undefined => {
      if (!bestCountryId || bestCountryId === id) return undefined

      const bestNormalizedNet = normalizedNetValues.get(bestCountryId)
      const currentNormalizedNet = normalizedNetValues.get(id)
      const country = countries.find(c => c.id === id)

      if (
        bestNormalizedNet === undefined ||
        currentNormalizedNet === undefined ||
        !country?.result
      ) {
        return undefined
      }

      const deltaInEur = currentNormalizedNet - bestNormalizedNet

      if (country.result.currency === "EUR") {
        return deltaInEur
      }

      const ratio = country.result.net / currentNormalizedNet
      return deltaInEur * ratio
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
            <h2 className="text-lg font-semibold">Compare Countries</h2>
            <p className="text-sm text-muted-foreground">
              Add up to {MAX_COUNTRIES} countries to compare side by side
            </p>
          </div>
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
              Add Country
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Header */}
      {isMobile && (
        <div className="pb-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-semibold">Compare Countries</h2>
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
      {countryResults.size >= 2 && (
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
              showCopyToAll={countries.length > 1}
              onCopyGrossToAll={() => copyGrossToAll(country.id)}
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
                showCopyToAll={countries.length > 1}
                onCopyGrossToAll={() => copyGrossToAll(country.id)}
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
