"use client"

import { useEffect, useCallback, useRef, useMemo } from "react"
import { toast } from "sonner"
import { getCountryName } from "@/lib/api"
import { CountryColumnState } from "@/lib/types"
import { useYears, useInputs, useCalculateSalary } from "@/lib/queries"
import { buildCalcRequest } from "@/lib/calc-utils"

/**
 * Headless hook that manages calculation lifecycle for a single country.
 * Extracted from CountryColumn — handles auto-year, currency/defaults sync,
 * and debounced calculation triggering.
 */
export function useCountryCalculation(
  state: CountryColumnState,
  onUpdate: (updates: Partial<CountryColumnState>) => void
) {
  const { country, year, variant, gross_annual, formValues, currency, result } = state

  const { data: years = [] } = useYears(country)
  const { data: inputsData } = useInputs(country, year, variant || undefined)

  const calculateMutation = useCalculateSalary()
  const hasInitializedYearRef = useRef<string | null>(null)
  const currencyEmittedForRef = useRef<string | null>(null)

  // Auto-select latest year when years load
  useEffect(() => {
    if (years.length > 0 && !year && hasInitializedYearRef.current !== country) {
      const sorted = [...years].sort((a, b) => b.localeCompare(a))
      onUpdate({ year: sorted[0] })
      hasInitializedYearRef.current = country
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [years, year, country])

  // Update currency and form defaults when inputs load
  useEffect(() => {
    if (!inputsData) return

    const key = `${country}:${year}:${variant}`
    const updates: Partial<CountryColumnState> = {}

    if (inputsData.currency) {
      const isFirstLoad = currencyEmittedForRef.current !== key
      if (isFirstLoad || inputsData.currency !== currency) {
        updates.currency = inputsData.currency
        currencyEmittedForRef.current = key
      }
    }

    const newFormValues = { ...formValues }
    let hasNewDefaults = false

    for (const [k, def] of Object.entries(inputsData.inputs)) {
      if (!(k in formValues)) {
        hasNewDefaults = true
        if (def.default !== undefined) {
          newFormValues[k] = String(def.default)
        } else if (def.type === "enum" && def.options) {
          const firstOption = Object.keys(def.options)[0]
          if (firstOption) {
            newFormValues[k] = firstOption
          }
        } else if (def.type === "boolean") {
          newFormValues[k] = "false"
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

  const calcRequest = useMemo(
    () => buildCalcRequest({ country, year, variant, gross_annual, formValues }, inputsData?.inputs),
    [country, year, gross_annual, variant, formValues, inputsData]
  )

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

  // Debounced auto-calculation
  useEffect(() => {
    const timer = setTimeout(calculate, 500)
    return () => clearTimeout(timer)
  }, [calculate])

  return { calcRequest, inputsData }
}
