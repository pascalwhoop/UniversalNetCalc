"use client"

import { useState, useRef } from "react"
import { ChevronRight, ChevronDown, Crown, Pencil, X, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import type { CountryColumnState } from "@/lib/types"
import type { BreakdownItem } from "@/lib/api"
import { getCountryName } from "@/lib/api"
import { getCountryFlag } from "@/lib/country-metadata"
import { formatCurrency, formatPercent } from "@/lib/formatters"
import {
  groupByCategory,
  categoryTotal,
  CATEGORY_CONFIG,
  DISPLAY_CATEGORIES,
} from "@/lib/breakdown-utils"
import { useMediaQuery } from "@/lib/hooks"

interface ComparisonTableProps {
  countries: CountryColumnState[]
  onEdit: (id: string) => void
  onRemove: (id: string) => void
  onConfigure: (id: string) => void
  bestCountryId: string | null
  showRemove: boolean
  normalizedDisplay?: Map<string, { base: number; original: number; currency: string }>
  baseCurrency?: string
}

import { LIVING_COST_CATEGORIES } from "@/lib/types"

function MobileSummaryBar({
  countries,
  bestCountryId,
  onScrollToCard,
  normalizedDisplay,
  baseCurrency = "EUR",
}: {
  countries: CountryColumnState[]
  bestCountryId: string | null
  onScrollToCard: (id: string) => void
  normalizedDisplay?: Map<string, { base: number; original: number; currency: string }>
  baseCurrency?: string
}) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">TL;DR</div>
      {countries.map(c => {
        const norm = normalizedDisplay?.get(c.id)
        const needsConversion = norm && norm.currency !== baseCurrency

        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onScrollToCard(c.id)}
            className={`w-full grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 items-start sm:flex sm:items-center sm:justify-between sm:gap-2 py-2 px-3 rounded-md text-left transition-colors hover:bg-muted/50 ${bestCountryId === c.id ? "bg-green-500/10" : ""}`}
          >
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="shrink-0">
                {c.country ? `${getCountryFlag(c.country)} ${getCountryName(c.country)}` : `Destination ${c.index + 1}`}
              </span>
              {bestCountryId === c.id && (
                <Badge variant="default" className="bg-green-600 hover:bg-green-700 shrink-0 text-[10px] px-1.5 py-0 w-fit">
                  <Crown className="h-2.5 w-2.5 mr-0.5" />
                  Best
                </Badge>
              )}
            </div>
            {c.isCalculating ? (
              <Skeleton className="h-5 w-20 justify-self-end sm:justify-self-auto" />
            ) : c.result ? (
              <div className="font-mono text-right flex flex-col items-end gap-0.5 sm:flex-row sm:items-center sm:gap-1 sm:flex-nowrap">
                <div className="flex flex-col items-end sm:flex-row sm:items-center sm:gap-1">
                  <span className="font-semibold text-primary">
                    {needsConversion ? formatCurrency(norm!.base, baseCurrency) : formatCurrency(c.result.net, c.result.currency)}
                  </span>
                  {needsConversion && (
                    <span className="text-xs text-muted-foreground font-normal">
                      ({formatCurrency(norm!.original, norm!.currency)})
                    </span>
                  )}
                </div>
                <span className="text-muted-foreground font-normal">
                  {formatPercent(c.result.effective_rate)}
                </span>
              </div>
            ) : (
              <span className="text-muted-foreground text-sm justify-self-end sm:justify-self-auto">—</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function MobileCountryCard({
  cardRef,
  country,
  countryBreakdowns,
  countries,
  bestCountryId,
  expandedCategories,
  onToggleCategory,
  getUnionItems,
  anyHasLivingCosts,
  onEdit,
  onRemove,
  onConfigure,
  showRemove,
}: {
  cardRef: (el: HTMLDivElement | null) => void
  country: CountryColumnState
  countryBreakdowns: (Record<string, BreakdownItem[]> | null)[]
  countries: CountryColumnState[]
  bestCountryId: string | null
  expandedCategories: Set<string>
  onToggleCategory: (category: string) => void
  getUnionItems: (category: string) => { id: string; label: string }[]
  anyHasLivingCosts: boolean
  onEdit: (id: string) => void
  onRemove: (id: string) => void
  onConfigure: (id: string) => void
  showRemove: boolean
}) {
  const idx = countries.findIndex(x => x.id === country.id)
  const grouped = countryBreakdowns[idx] ?? null
  const isBest = bestCountryId === country.id

  return (
    <div
      ref={cardRef}
      className={`rounded-lg border divide-y ${isBest ? "ring-1 ring-green-500/30" : ""}`}
    >
      <div className={`flex items-center justify-between p-3 ${isBest ? "bg-green-500/5" : "bg-muted/20"}`}>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-medium">
              {country.country ? `${getCountryFlag(country.country)} ${getCountryName(country.country)}` : `Destination ${country.index + 1}`}
            </span>
            {isBest && (
              <Badge variant="default" className="bg-green-600 hover:bg-green-700 shrink-0 text-[10px] px-1.5 py-0">
                <Crown className="h-2.5 w-2.5 mr-0.5" />
                Best
              </Badge>
            )}
          </div>
          {country.country && country.year && (
            <div className="text-xs text-muted-foreground mt-0.5">
              {country.year}{country.variant ? ` · ${country.variant}` : ""}
            </div>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(country.id)}>
            <Pencil className="h-3 w-3" />
            <span className="sr-only">Edit</span>
          </Button>
          {showRemove && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onRemove(country.id)}>
              <X className="h-3.5 w-3.5" />
              <span className="sr-only">Remove</span>
            </Button>
          )}
        </div>
      </div>

      <div className="divide-y text-sm">
        <div className="flex justify-between items-center px-3 py-2">
          <span className="font-semibold">Gross Income</span>
          {country.isCalculating ? (
            <Skeleton className="h-5 w-24" />
          ) : country.result ? (
            <span className="font-mono font-semibold">{formatCurrency(country.result.gross, country.result.currency)}</span>
          ) : !country.country || !country.year || !country.gross_annual ? (
            <Button variant="outline" size="sm" className="text-xs" onClick={() => onConfigure(country.id)}>
              <Settings className="h-3 w-3 mr-1.5" />
              Configure
            </Button>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>

        {DISPLAY_CATEGORIES.map(category => {
          const config = CATEGORY_CONFIG[category]
          const catGrouped = grouped?.[category]
          if (!catGrouped || catGrouped.length === 0) return null
          const isExpanded = expandedCategories.has(category)
          const unionItems = isExpanded ? getUnionItems(category) : []
          const total = categoryTotal(catGrouped)

          return (
            <div key={category}>
              <button
                type="button"
                className="w-full flex justify-between items-center px-3 py-2 hover:bg-muted/20 text-left"
                onClick={() => onToggleCategory(category)}
              >
                <div className="flex items-center gap-1.5">
                  {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                  <span>{config.label}</span>
                </div>
                {country.result && (
                  <span className={`font-mono ${config.colorClass}`}>{config.signPrefix(total)}{formatCurrency(Math.abs(total), country.result.currency)}</span>
                )}
              </button>
              {isExpanded && unionItems.map(item => {
                const found = catGrouped.find((bi: BreakdownItem) => bi.id === item.id)
                if (!found || !country.result) return null
                return (
                  <div key={item.id} className="flex justify-between items-center pl-9 pr-3 py-1.5 text-xs">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className={`font-mono ${config.colorClass}`}>{config.signPrefix(found.amount)}{formatCurrency(Math.abs(found.amount), country.result!.currency)}</span>
                  </div>
                )
              })}
            </div>
          )
        })}

        <div className="h-0.5 bg-foreground/20" />

        <div className={`flex justify-between items-center px-3 py-2 ${isBest ? "bg-green-500/5" : ""}`}>
          <span className="font-semibold">Net Annual</span>
          {country.isCalculating ? <Skeleton className="h-6 w-24" /> : country.result ? (
            <span className="text-base font-bold text-primary">{formatCurrency(country.result.net, country.result.currency)}</span>
          ) : <span className="text-muted-foreground">—</span>}
        </div>
        {country.result && (
          <>
            <div className={`flex justify-between items-center px-3 py-2 ${isBest ? "bg-green-500/5" : ""}`}>
              <span>Net Monthly</span>
              <span className="font-mono">{formatCurrency(country.result.net / 12, country.result.currency)}</span>
            </div>
            <div className={`flex justify-between items-center px-3 py-2 ${isBest ? "bg-green-500/5" : ""}`}>
              <span>Eff. Rate</span>
              <span className="font-mono">{formatPercent(country.result.effective_rate)}</span>
            </div>
            {country.result.marginal_rate != null && (
              <div className={`flex justify-between items-center px-3 py-2 ${isBest ? "bg-green-500/5" : ""}`}>
                <span>Marginal Rate</span>
                <span className="font-mono">{formatPercent(country.result.marginal_rate)}</span>
              </div>
            )}
          </>
        )}

        {anyHasLivingCosts && (() => {
          const monthlyCosts = Object.values(country.costOfLiving || {}).reduce((s, v) => s + v, 0)
          const cur = country.result?.currency || country.currency || "EUR"
          return (
            <>
              {monthlyCosts > 0 && (
                <div className="flex justify-between items-center px-3 py-2">
                  <span>Living Costs /mo</span>
                  <span className="font-mono text-destructive">-{formatCurrency(monthlyCosts, cur)}</span>
                </div>
              )}
              {country.result && (
                <div className={`flex justify-between items-center px-3 py-2 font-semibold ${isBest ? "bg-green-500/5" : "bg-muted/30"}`}>
                  <span>Disposable /mo</span>
                  <span className="font-mono text-primary">
                    {formatCurrency(country.result.net / 12 - monthlyCosts, country.result.currency)}
                  </span>
                </div>
              )}
            </>
          )
        })()}

        {country.result && (
          <div className="px-3 py-2 text-xs text-muted-foreground">
            Config {country.result.config_version_hash} · {country.result.config_last_updated}
          </div>
        )}
      </div>
    </div>
  )
}

export function ComparisonTable({
  countries,
  onEdit,
  onRemove,
  onConfigure,
  bestCountryId,
  showRemove,
  normalizedDisplay,
  baseCurrency = "EUR",
}: ComparisonTableProps) {
  const isMd = useMediaQuery("(min-width: 768px)")
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  // Build grouped breakdowns for each country
  const countryBreakdowns = countries.map(c =>
    c.result ? groupByCategory(c.result.breakdown) : null
  )

  // For expanded categories, compute the union of all item IDs across countries
  const getUnionItems = (category: string): { id: string; label: string }[] => {
    const seen = new Map<string, string>() // id -> label
    for (const grouped of countryBreakdowns) {
      if (!grouped || !grouped[category]) continue
      for (const item of grouped[category]) {
        if (!seen.has(item.id)) {
          seen.set(item.id, item.label)
        }
      }
    }
    return Array.from(seen.entries()).map(([id, label]) => ({ id, label }))
  }

  // Check if any country has living costs
  const anyHasLivingCosts = countries.some(c =>
    c.costOfLiving && Object.values(c.costOfLiving).some(v => v > 0)
  )

  const stickyColClass = "sticky left-0 z-10 bg-background border-r border-border shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]"

  if (!isMd) {
    return (
      <div className="space-y-4">
        <MobileSummaryBar
          countries={countries}
          bestCountryId={bestCountryId}
          onScrollToCard={id => cardRefs.current[id]?.scrollIntoView({ behavior: "smooth" })}
          normalizedDisplay={normalizedDisplay}
          baseCurrency={baseCurrency}
        />
        <div className="space-y-4">
          {countries.map(c => (
            <MobileCountryCard
              key={c.id}
              cardRef={el => { cardRefs.current[c.id] = el }}
              country={c}
              countryBreakdowns={countryBreakdowns}
              countries={countries}
              bestCountryId={bestCountryId}
              expandedCategories={expandedCategories}
              onToggleCategory={toggleCategory}
              getUnionItems={getUnionItems}
              anyHasLivingCosts={anyHasLivingCosts}
              onEdit={onEdit}
              onRemove={onRemove}
              onConfigure={onConfigure}
              showRemove={showRemove}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-sm">
        {/* Header */}
        <thead>
          <tr className="border-b">
            <th className={`${stickyColClass} p-3 text-left font-normal text-muted-foreground min-w-[160px]`}>
              &nbsp;
            </th>
            {countries.map(c => (
              <th key={c.id} className={`p-3 text-left min-w-[180px] ${bestCountryId === c.id ? "bg-green-500/5" : ""}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium truncate">
                        {c.country ? `${getCountryFlag(c.country)} ${getCountryName(c.country)}` : `Destination ${c.index + 1}`}
                      </span>
                      {bestCountryId === c.id && (
                        <Badge variant="default" className="bg-green-600 hover:bg-green-700 shrink-0 text-[10px] px-1.5 py-0">
                          <Crown className="h-2.5 w-2.5 mr-0.5" />
                          Best
                        </Badge>
                      )}
                    </div>
                    {c.country && c.year && (
                      <div className="text-xs text-muted-foreground font-normal mt-0.5">
                        {c.year}{c.variant ? ` · ${c.variant}` : ""}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => onEdit(c.id)}
                    >
                      <Pencil className="h-3 w-3" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    {showRemove && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => onRemove(c.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    )}
                  </div>
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {/* GROSS INCOME */}
          <tr className="border-b bg-muted/30">
            <td className={`${stickyColClass} p-3 font-semibold bg-muted/30`}>Gross Income</td>
            {countries.map(c => (
              <td key={c.id} className={`p-3 font-mono font-semibold ${bestCountryId === c.id ? "bg-green-500/5" : ""}`}>
                {c.isCalculating ? (
                  <Skeleton className="h-5 w-24" />
                ) : c.result ? (
                  formatCurrency(c.result.gross, c.result.currency)
                ) : !c.country || !c.year || !c.gross_annual ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => onConfigure(c.id)}
                  >
                    <Settings className="h-3 w-3 mr-1.5" />
                    Configure
                  </Button>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
            ))}
          </tr>

          {/* CATEGORY ROWS */}
          {DISPLAY_CATEGORIES.map(category => {
            const config = CATEGORY_CONFIG[category]
            const hasItems = countryBreakdowns.some(
              g => g && g[category] && g[category].length > 0
            )
            if (!hasItems) return null

            const isExpanded = expandedCategories.has(category)
            const unionItems = isExpanded ? getUnionItems(category) : []

            return (
              <CategoryRows
                key={category}
                category={category}
                label={config.label}
                colorClass={config.colorClass}
                signPrefix={config.signPrefix}
                countries={countries}
                countryBreakdowns={countryBreakdowns}
                isExpanded={isExpanded}
                onToggle={() => toggleCategory(category)}
                unionItems={unionItems}
                bestCountryId={bestCountryId}
                stickyColClass={stickyColClass}
              />
            )
          })}

          {/* SEPARATOR */}
          <tr>
            <td colSpan={countries.length + 1} className="h-0 border-b-2 border-foreground/20" />
          </tr>

          {/* NET ANNUAL */}
          <SummaryRow
            label="Net Annual"
            countries={countries}
            bestCountryId={bestCountryId}
            stickyColClass={stickyColClass}
            render={c =>
              c.isCalculating ? (
                <Skeleton className="h-6 w-28" />
              ) : c.result ? (
                <span className="text-base font-bold text-primary">
                  {formatCurrency(c.result.net, c.result.currency)}
                </span>
              ) : null
            }
            highlight
          />

          {/* Net Monthly */}
          <SummaryRow
            label="Net Monthly"
            countries={countries}
            bestCountryId={bestCountryId}
            stickyColClass={stickyColClass}
            render={c =>
              c.result ? (
                <span className="font-mono">
                  {formatCurrency(c.result.net / 12, c.result.currency)}
                </span>
              ) : null
            }
          />

          {/* Effective Rate */}
          <SummaryRow
            label="Eff. Rate"
            countries={countries}
            bestCountryId={bestCountryId}
            stickyColClass={stickyColClass}
            render={c =>
              c.result ? (
                <span className="font-mono">{formatPercent(c.result.effective_rate)}</span>
              ) : null
            }
          />

          {/* Marginal Rate */}
          <SummaryRow
            label="Marginal Rate"
            countries={countries}
            bestCountryId={bestCountryId}
            stickyColClass={stickyColClass}
            render={c =>
              c.result?.marginal_rate != null ? (
                <span className="font-mono">{formatPercent(c.result.marginal_rate)}</span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )
            }
          />

          {/* LIVING COSTS SECTION */}
          {anyHasLivingCosts && (
            <>
              <tr>
                <td colSpan={countries.length + 1} className="h-0 border-b-2 border-foreground/20" />
              </tr>

              <LivingCostsRows
                countries={countries}
                bestCountryId={bestCountryId}
                stickyColClass={stickyColClass}
                isExpanded={expandedCategories.has("living_costs")}
                onToggle={() => toggleCategory("living_costs")}
              />

              {/* DISPOSABLE */}
              <tr className="bg-muted/30">
                <td className={`${stickyColClass} p-3 font-semibold bg-muted/30`}>
                  Disposable /mo
                </td>
                {countries.map(c => {
                  if (!c.result) return <td key={c.id} className={`p-3 ${bestCountryId === c.id ? "bg-green-500/5" : ""}`}><span className="text-muted-foreground">—</span></td>
                  const monthlyCosts = Object.values(c.costOfLiving || {}).reduce((s, v) => s + v, 0)
                  const disposable = c.result.net / 12 - monthlyCosts
                  return (
                    <td key={c.id} className={`p-3 ${bestCountryId === c.id ? "bg-green-500/5" : ""}`}>
                      <span className="text-base font-bold text-primary font-mono">
                        {formatCurrency(disposable, c.result.currency)}
                      </span>
                    </td>
                  )
                })}
              </tr>
            </>
          )}

          {/* Config versions footer */}
          <tr className="border-t">
            <td className={`${stickyColClass} p-2 text-xs text-muted-foreground`}>Config</td>
            {countries.map(c => (
              <td key={c.id} className="p-2 text-xs text-muted-foreground">
                {c.result ? (
                  <span>{c.result.config_version_hash} · {c.result.config_last_updated}</span>
                ) : null}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

// --- Sub-components ---

function CategoryRows({
  category,
  label,
  colorClass,
  signPrefix,
  countries,
  countryBreakdowns,
  isExpanded,
  onToggle,
  unionItems,
  bestCountryId,
  stickyColClass,
}: {
  category: string
  label: string
  colorClass: string
  signPrefix: (amount: number) => string
  countries: CountryColumnState[]
  countryBreakdowns: (Record<string, BreakdownItem[]> | null)[]
  isExpanded: boolean
  onToggle: () => void
  unionItems: { id: string; label: string }[]
  bestCountryId: string | null
  stickyColClass: string
}) {
  return (
    <>
      {/* Category summary row */}
      <tr className="border-b hover:bg-muted/20 cursor-pointer" onClick={onToggle}>
        <td className={`${stickyColClass} p-3`}>
          <div className="flex items-center gap-1.5">
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )}
            <span>{label}</span>
          </div>
        </td>
        {countries.map((c, i) => {
          const grouped = countryBreakdowns[i]
          if (!grouped || !grouped[category] || grouped[category].length === 0) {
            return (
              <td key={c.id} className={`p-3 ${bestCountryId === c.id ? "bg-green-500/5" : ""}`}>
                <span className="text-muted-foreground">—</span>
              </td>
            )
          }
          const total = categoryTotal(grouped[category])
          return (
            <td key={c.id} className={`p-3 font-mono ${colorClass} ${bestCountryId === c.id ? "bg-green-500/5" : ""}`}>
              {signPrefix(total)}{formatCurrency(Math.abs(total), c.result!.currency)}
            </td>
          )
        })}
      </tr>

      {/* Expanded detail rows */}
      {isExpanded && unionItems.map(item => (
        <tr key={item.id} className="border-b border-dashed">
          <td className={`${stickyColClass} pl-9 pr-3 py-1.5 text-xs text-muted-foreground`}>
            {item.label}
          </td>
          {countries.map((c, i) => {
            const grouped = countryBreakdowns[i]
            const found = grouped?.[category]?.find((bi: BreakdownItem) => bi.id === item.id)
            if (!found || !c.result) {
              return (
                <td key={c.id} className={`px-3 py-1.5 text-xs ${bestCountryId === c.id ? "bg-green-500/5" : ""}`}>
                  <span className="text-muted-foreground">—</span>
                </td>
              )
            }
            return (
              <td key={c.id} className={`px-3 py-1.5 text-xs font-mono ${colorClass} ${bestCountryId === c.id ? "bg-green-500/5" : ""}`}>
                {signPrefix(found.amount)}{formatCurrency(Math.abs(found.amount), c.result.currency)}
              </td>
            )
          })}
        </tr>
      ))}
    </>
  )
}

function SummaryRow({
  label,
  countries,
  bestCountryId,
  stickyColClass,
  render,
  highlight = false,
}: {
  label: string
  countries: CountryColumnState[]
  bestCountryId: string | null
  stickyColClass: string
  render: (c: CountryColumnState) => React.ReactNode
  highlight?: boolean
}) {
  return (
    <tr className={highlight ? "bg-muted/30" : ""}>
      <td className={`${stickyColClass} p-3 ${highlight ? "font-semibold bg-muted/30" : ""}`}>
        {label}
      </td>
      {countries.map(c => (
        <td key={c.id} className={`p-3 ${bestCountryId === c.id ? "bg-green-500/5" : ""}`}>
          {render(c) ?? <span className="text-muted-foreground">—</span>}
        </td>
      ))}
    </tr>
  )
}

function LivingCostsRows({
  countries,
  bestCountryId,
  stickyColClass,
  isExpanded,
  onToggle,
}: {
  countries: CountryColumnState[]
  bestCountryId: string | null
  stickyColClass: string
  isExpanded: boolean
  onToggle: () => void
}) {
  const activeFields = isExpanded
    ? LIVING_COST_CATEGORIES.filter(field =>
        countries.some(c => (c.costOfLiving?.[field.id] || 0) > 0)
      )
    : []

  return (
    <>
      {/* Living costs total row */}
      <tr className="border-b hover:bg-muted/20 cursor-pointer" onClick={onToggle}>
        <td className={`${stickyColClass} p-3`}>
          <div className="flex items-center gap-1.5">
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )}
            <span>Living Costs /mo</span>
          </div>
        </td>
        {countries.map(c => {
          const total = Object.values(c.costOfLiving || {}).reduce((s, v) => s + v, 0)
          const cur = c.result?.currency || c.currency || "EUR"
          return (
            <td key={c.id} className={`p-3 font-mono ${bestCountryId === c.id ? "bg-green-500/5" : ""}`}>
              {total > 0 ? (
                <span className="text-destructive">-{formatCurrency(total, cur)}</span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </td>
          )
        })}
      </tr>

      {/* Expanded living cost detail rows */}
      {activeFields.map(field => (
        <tr key={field.id} className="border-b border-dashed">
          <td className={`${stickyColClass} pl-9 pr-3 py-1.5 text-xs text-muted-foreground`}>
            {field.emoji} {field.label}
          </td>
          {countries.map(c => {
            const val = c.costOfLiving?.[field.id] || 0
            const cur = c.result?.currency || c.currency || "EUR"
            return (
              <td key={c.id} className={`px-3 py-1.5 text-xs font-mono ${bestCountryId === c.id ? "bg-green-500/5" : ""}`}>
                {val > 0 ? (
                  <span className="text-destructive">-{formatCurrency(val, cur)}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
            )
          })}
        </tr>
      ))}
    </>
  )
}
