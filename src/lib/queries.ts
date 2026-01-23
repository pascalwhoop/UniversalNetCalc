import { useQuery, useMutation } from '@tanstack/react-query'
import * as api from './api'

// Query keys for cache management
export const queryKeys = {
  countries: ['countries'] as const,
  years: (country: string) => ['years', country] as const,
  variants: (country: string, year: string) => ['variants', country, year] as const,
  inputs: (country: string, year: string, variant?: string) =>
    ['inputs', country, year, variant] as const,
  exchangeRate: (from: string, to: string) => ['exchangeRate', from, to] as const,
}

// Query hooks
export function useCountries() {
  return useQuery({
    queryKey: queryKeys.countries,
    queryFn: ({ signal }) => api.fetchCountries(signal),
    staleTime: Infinity, // Countries rarely change
  })
}

export function useYears(country: string | undefined) {
  return useQuery({
    queryKey: queryKeys.years(country || ''),
    queryFn: ({ signal }) => api.fetchYears(country!, signal),
    enabled: !!country,
    staleTime: Infinity,
  })
}

export function useVariants(country: string | undefined, year: string | undefined) {
  return useQuery({
    queryKey: queryKeys.variants(country || '', year || ''),
    queryFn: ({ signal }) => api.fetchVariants(country!, year!, signal),
    enabled: !!country && !!year,
    staleTime: Infinity,
  })
}

export function useInputs(
  country: string | undefined,
  year: string | undefined,
  variant?: string
) {
  return useQuery({
    queryKey: queryKeys.inputs(country || '', year || '', variant),
    queryFn: ({ signal }) => api.fetchInputs(country!, year!, variant, signal),
    enabled: !!country && !!year,
    staleTime: Infinity,
  })
}

export function useExchangeRate(from: string, to: string) {
  return useQuery({
    queryKey: queryKeys.exchangeRate(from, to),
    queryFn: ({ signal }) => api.fetchExchangeRate(from, to, signal),
    enabled: from !== to,
    staleTime: 60 * 60 * 1000, // 1 hour cache for exchange rates
  })
}

// Mutation hooks
export function useCalculateSalary() {
  return useMutation({
    mutationFn: (request: api.CalcRequest) => api.calculateSalary(request),
  })
}

interface RangeDataPoint {
  gross: number
  net: number
  tax: number
  social: number
  netPercent: number
  taxPercent: number
  socialPercent: number
}

interface ChartDataResponse {
  dataPoints: RangeDataPoint[]
}

export function useChartData() {
  return useMutation<ChartDataResponse, Error, {
    country: string
    year: string
    variant?: string
    formValues: Record<string, string>
    maxSalary: number
    currentSalary?: number
  }>({
    mutationFn: async (params) => {
      const requestBody: Record<string, any> = {
        country: params.country,
        year: params.year,
        max_salary: params.maxSalary,
        current_salary: params.currentSalary || params.maxSalary,
      }

      if (params.variant) {
        requestBody.variant = params.variant
      }

      // Add all form values (filing_status, region_level_1, etc.)
      for (const [key, value] of Object.entries(params.formValues)) {
        if (key !== "gross_annual" && value) {
          requestBody[key] = value
        }
      }

      const response = await fetch("/api/calc/range", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData: { details?: string; error?: string } = await response.json()
        throw new Error(errorData.details || errorData.error || "Failed to fetch chart data")
      }

      const result: ChartDataResponse = await response.json()
      return result
    },
  })
}
