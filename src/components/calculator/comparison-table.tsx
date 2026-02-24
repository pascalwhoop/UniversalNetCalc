"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown, Pencil, X, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Crown } from "lucide-react"
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

interface ComparisonTableProps {
  countries: CountryColumnState[]
  onEdit: (id: string) => void
  onRemove: (id: string) => void
  onConfigure: (id: string) => void
  bestCountryId: string | null
  showRemove: boolean
}

import { LIVING_COST_CATEGORIES } from "@/lib/types"

export function ComparisonTable({
  countries,
  onEdit,
  onRemove,
  onConfigure,
  bestCountryId,
  showRemove,
}: ComparisonTableProps) {
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

  const stickyColClass = "sticky left-0 z-10 bg-background"

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
      {isExpanded && (() => {
        // Collect all active category IDs across all countries
        const activeIds = new Set<string>()
        countries.forEach(c => {
          if (c.costOfLiving) Object.keys(c.costOfLiving).forEach(k => {
            if ((c.costOfLiving?.[k] || 0) > 0) activeIds.add(k)
          })
        })
        const activeFields = LIVING_COST_CATEGORIES.filter(c => activeIds.has(c.id))
        return activeFields.map(field => (
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
        ))
      })()}
    </>
  )
}
