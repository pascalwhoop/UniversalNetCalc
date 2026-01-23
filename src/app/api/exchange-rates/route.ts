import { NextRequest, NextResponse } from "next/server"
import { getCloudflareContext } from "@opennextjs/cloudflare"

const FREECURRENCY_API_URL = "https://api.freecurrencyapi.com/v1/latest"
const CACHE_TTL_SECONDS = 30 * 24 * 60 * 60 // 30 days in seconds

interface ExchangeRateResponse {
  meta: {
    last_updated_at: string
  }
  data: Record<string, number>
}

interface CachedRate {
  rate: number
  fetchedAt: string
  expiresAt: string
}

function getCacheKey(from: string, to: string): string {
  return `exchange_rate:${from.toUpperCase()}:${to.toUpperCase()}`
}

function getKVNamespace(): KVNamespace | undefined {
  try {
    const ctx = getCloudflareContext()
    return (ctx.env as { EXCHANGE_RATES_CACHE?: KVNamespace }).EXCHANGE_RATES_CACHE
  } catch {
    // Running locally without Cloudflare context - caching disabled
    return undefined
  }
}

async function getFromCache(
  kv: KVNamespace | undefined,
  from: string,
  to: string
): Promise<CachedRate | null> {
  if (!kv) return null

  try {
    const key = getCacheKey(from, to)
    const cached = await kv.get(key, "json")
    return cached as CachedRate | null
  } catch {
    return null
  }
}

async function saveToCache(
  kv: KVNamespace | undefined,
  from: string,
  to: string,
  rate: number
): Promise<void> {
  if (!kv) return

  try {
    const key = getCacheKey(from, to)
    const now = new Date()
    const expiresAt = new Date(now.getTime() + CACHE_TTL_SECONDS * 1000)

    const cached: CachedRate = {
      rate,
      fetchedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    }

    await kv.put(key, JSON.stringify(cached), {
      expirationTtl: CACHE_TTL_SECONDS,
    })
  } catch (error) {
    console.error("Failed to save to cache:", error)
  }
}

async function fetchExchangeRate(
  apiKey: string,
  from: string,
  to: string
): Promise<number> {
  const url = new URL(FREECURRENCY_API_URL)
  url.searchParams.set("apikey", apiKey)
  url.searchParams.set("base_currency", from.toUpperCase())
  url.searchParams.set("currencies", to.toUpperCase())

  const response = await fetch(url.toString())

  if (!response.ok) {
    const errorText = await response.text()

    // Handle 422 validation errors (typically unsupported currency)
    if (response.status === 422) {
      try {
        const errorData = JSON.parse(errorText)
        const errors = errorData.errors || {}

        if (errors.base_currency) {
          throw new Error(
            `UNSUPPORTED_CURRENCY:${from.toUpperCase()}:${errors.base_currency[0]}`
          )
        }
        if (errors.currencies) {
          throw new Error(
            `UNSUPPORTED_CURRENCY:${to.toUpperCase()}:${errors.currencies[0]}`
          )
        }
      } catch {
        // If we can't parse the error, fall through to generic error
      }
      throw new Error(
        `UNSUPPORTED_CURRENCY:${from.toUpperCase()}_${to.toUpperCase()}:Invalid currency code`
      )
    }

    throw new Error(`FreeCurrencyAPI error: ${response.status} - ${errorText}`)
  }

  const data: ExchangeRateResponse = await response.json()
  const rate = data.data[to.toUpperCase()]

  if (rate === undefined) {
    throw new Error(`Currency ${to} not found in response`)
  }

  return rate
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  // Validate parameters
  if (!from || !to) {
    return NextResponse.json(
      { error: "Missing required parameters: from, to" },
      { status: 400 }
    )
  }

  // Get API key from environment
  const apiKey = process.env.FREECURRENCY_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "Exchange rate service not configured" },
      { status: 503 }
    )
  }

  // Try to get Cloudflare KV for caching
  const kv = getKVNamespace()

  // Check cache first
  const cached = await getFromCache(kv, from, to)
  if (cached) {
    return NextResponse.json({
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      rate: cached.rate,
      cached: true,
      fetchedAt: cached.fetchedAt,
      expiresAt: cached.expiresAt,
    })
  }

  // Fetch fresh rate
  try {
    const rate = await fetchExchangeRate(apiKey, from, to)

    // Save to cache
    await saveToCache(kv, from, to, rate)

    const now = new Date()
    const expiresAt = new Date(now.getTime() + CACHE_TTL_SECONDS * 1000)

    return NextResponse.json({
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      rate,
      cached: false,
      fetchedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    })
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"

    // Handle unsupported currency
    if (errorMessage.startsWith("UNSUPPORTED_CURRENCY:")) {
      const [, currency] = errorMessage.split(":")
      console.warn(`Unsupported currency requested: ${currency}`)
      return NextResponse.json(
        {
          error: `Currency not supported: ${currency}`,
          message: `The currency "${currency}" is not supported by the exchange rate service. Please check that you are using a valid ISO 4217 currency code (e.g., USD, EUR, GBP).`,
          unsupported_currency: currency,
        },
        { status: 400 }
      )
    }

    console.error("Exchange rate fetch error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch exchange rate",
        details: errorMessage,
      },
      { status: 502 }
    )
  }
}

// Batch endpoint for multiple currency pairs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pairs } = body as { pairs: Array<{ from: string; to: string }> }

    if (!pairs || !Array.isArray(pairs) || pairs.length === 0) {
      return NextResponse.json(
        { error: "Missing required field: pairs (array of {from, to})" },
        { status: 400 }
      )
    }

    if (pairs.length > 10) {
      return NextResponse.json(
        { error: "Maximum 10 currency pairs per request" },
        { status: 400 }
      )
    }

    const apiKey = process.env.FREECURRENCY_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "Exchange rate service not configured" },
        { status: 503 }
      )
    }

    const kv = getKVNamespace()

    const results: Record<
      string,
      {
        rate?: number
        cached?: boolean
        fetchedAt?: string
        expiresAt?: string
        error?: string
        unsupported_currency?: string
      }
    > = {}
    const unsupportedCurrencies = new Set<string>()

    // Process each pair
    for (const pair of pairs) {
      const { from, to } = pair
      if (!from || !to) continue

      const key = `${from.toUpperCase()}_${to.toUpperCase()}`

      // Check cache
      const cached = await getFromCache(kv, from, to)
      if (cached) {
        results[key] = {
          rate: cached.rate,
          cached: true,
          fetchedAt: cached.fetchedAt,
          expiresAt: cached.expiresAt,
        }
        continue
      }

      // Fetch fresh
      try {
        const rate = await fetchExchangeRate(apiKey, from, to)
        await saveToCache(kv, from, to, rate)

        const now = new Date()
        const expiresAt = new Date(now.getTime() + CACHE_TTL_SECONDS * 1000)

        results[key] = {
          rate,
          cached: false,
          fetchedAt: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error"

        if (errorMessage.startsWith("UNSUPPORTED_CURRENCY:")) {
          const [, currency] = errorMessage.split(":")
          unsupportedCurrencies.add(currency)
          results[key] = {
            error: `Currency not supported: ${currency}`,
            unsupported_currency: currency,
          }
          console.warn(`Unsupported currency in batch: ${currency}`)
        } else {
          results[key] = {
            error: "Failed to fetch exchange rate",
          }
          console.error(`Failed to fetch ${from} -> ${to}:`, error)
        }
      }
    }

    const response: {
      rates: typeof results
      unsupported_currencies?: string[]
      message?: string
    } = { rates: results }

    if (unsupportedCurrencies.size > 0) {
      response.unsupported_currencies = Array.from(unsupportedCurrencies)
      response.message = `Some currencies are not supported: ${response.unsupported_currencies.join(", ")}. Please use valid ISO 4217 currency codes.`
    }

    return NextResponse.json(response)
  } catch (error: unknown) {
    console.error("Batch exchange rate error:", error)
    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
