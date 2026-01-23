"use client"

import { Info, AlertCircle } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { CalculationResult, BreakdownItem } from "@/lib/api"
import { formatCurrency } from "@/lib/formatters"

interface BreakdownLineProps {
  label: string
  amount: number
  currency: string
  type?: "income" | "deduction" | "credit" | "subtotal" | "total"
  tooltip?: string
}

function BreakdownLine({
  label,
  amount,
  currency,
  type = "deduction",
  tooltip,
}: BreakdownLineProps) {
  const isNegative = type === "deduction" && amount > 0
  const isPositive = type === "credit" && amount > 0

  const amountClassMap: Record<string, string> = {
    income: "text-foreground",
    credit: "text-green-600",
    deduction: "text-destructive",
    total: "text-primary font-semibold",
    subtotal: "text-muted-foreground",
  }
  const amountClass = amountClassMap[type] || "text-muted-foreground"

  const displayAmount = isNegative
    ? `-${formatCurrency(amount, currency)}`
    : isPositive
      ? `+${formatCurrency(amount, currency)}`
      : formatCurrency(amount, currency)

  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <div className="flex items-center gap-1">
        <span className={type === "subtotal" ? "text-muted-foreground" : ""}>
          {label}
        </span>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <span className={amountClass}>{displayAmount}</span>
    </div>
  )
}

interface ResultBreakdownProps {
  isLoading?: boolean
  result?: CalculationResult | null
  error?: string | null
  comparisonDelta?: number
}

// Group breakdown items by category
function groupByCategory(items: BreakdownItem[]) {
  const groups: Record<string, BreakdownItem[]> = {
    income_tax: [],
    contribution: [],
    credit: [],
    deduction: [],
    surtax: [],
  }

  for (const item of items) {
    if (groups[item.category]) {
      groups[item.category].push(item)
    }
  }

  return groups
}

// Calculate sum of items in a category
function categorySum(items: BreakdownItem[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0)
}

export function ResultBreakdown({
  isLoading = false,
  result = null,
  error = null,
  comparisonDelta,
}: ResultBreakdownProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-8 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!result) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Select a country and enter a salary to see the breakdown
        </p>
      </div>
    )
  }

  const { currency } = result
  const grouped = groupByCategory(result.breakdown)
  const taxTotal = categorySum(grouped.income_tax) + categorySum(grouped.surtax)
  const contributionTotal = categorySum(grouped.contribution)
  const creditTotal = categorySum(grouped.credit)
  const deductionTotal = categorySum(grouped.deduction)
  const effectiveRatePercent = (result.effective_rate * 100).toFixed(1)
  const monthlyNet = result.net / 12

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="rounded-lg bg-muted/50 p-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-muted-foreground">Net Annual</span>
          <span className="text-xl font-bold text-primary">
            {formatCurrency(result.net, currency)}
          </span>
        </div>
        {comparisonDelta !== undefined && comparisonDelta !== 0 && (
          <div className="mt-1 text-xs text-muted-foreground">
            {comparisonDelta < 0 ? (
              <span className="text-destructive">
                {formatCurrency(Math.abs(comparisonDelta), currency)} less than best
              </span>
            ) : (
              <span className="text-green-600">
                +{formatCurrency(comparisonDelta, currency)} more than average
              </span>
            )}
          </div>
        )}
        <div className="mt-1 flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {effectiveRatePercent}% eff. rate
          </Badge>
          <Badge variant="outline" className="text-xs">
            {formatCurrency(monthlyNet, currency)}/mo
          </Badge>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <Accordion type="single" collapsible className="w-full">
        {/* Gross Income */}
        <AccordionItem value="income" className="border-b-0">
          <AccordionTrigger className="text-sm py-2 hover:no-underline">
            <div className="flex w-full items-center justify-between pr-2">
              <span>Gross Income</span>
              <span className="font-mono text-sm">{formatCurrency(result.gross, currency)}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-1 pl-2">
              <BreakdownLine
                label="Annual Salary"
                amount={result.gross}
                currency={currency}
                type="income"
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Income Taxes */}
        {(grouped.income_tax.length > 0 || grouped.surtax.length > 0) && (
          <AccordionItem value="taxes" className="border-b-0">
            <AccordionTrigger className="text-sm py-2 hover:no-underline">
              <div className="flex w-full items-center justify-between pr-2">
                <span>Income Taxes</span>
                <span className="font-mono text-sm text-destructive">
                  -{formatCurrency(taxTotal, currency)}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1 pl-2">
                {grouped.income_tax.map((item) => (
                  <BreakdownLine
                    key={item.id}
                    label={item.label}
                    amount={item.amount}
                    currency={currency}
                    type="deduction"
                    tooltip={item.description}
                  />
                ))}
                {grouped.surtax.map((item) => (
                  <BreakdownLine
                    key={item.id}
                    label={item.label}
                    amount={item.amount}
                    currency={currency}
                    type="deduction"
                    tooltip={item.description}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Social Contributions */}
        {grouped.contribution.length > 0 && (
          <AccordionItem value="contributions" className="border-b-0">
            <AccordionTrigger className="text-sm py-2 hover:no-underline">
              <div className="flex w-full items-center justify-between pr-2">
                <span>Social Contributions</span>
                <span className="font-mono text-sm text-destructive">
                  -{formatCurrency(contributionTotal, currency)}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1 pl-2">
                {grouped.contribution.map((item) => (
                  <BreakdownLine
                    key={item.id}
                    label={item.label}
                    amount={item.amount}
                    currency={currency}
                    type="deduction"
                    tooltip={item.description}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Credits */}
        {grouped.credit.length > 0 && (
          <AccordionItem value="credits" className="border-b-0">
            <AccordionTrigger className="text-sm py-2 hover:no-underline">
              <div className="flex w-full items-center justify-between pr-2">
                <span>Credits</span>
                <span className="font-mono text-sm text-green-600">
                  +{formatCurrency(creditTotal, currency)}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1 pl-2">
                {grouped.credit.map((item) => (
                  <BreakdownLine
                    key={item.id}
                    label={item.label}
                    amount={item.amount}
                    currency={currency}
                    type="credit"
                    tooltip={item.description}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Deductions */}
        {grouped.deduction.length > 0 && (
          <AccordionItem value="deductions" className="border-b-0">
            <AccordionTrigger className="text-sm py-2 hover:no-underline">
              <div className="flex w-full items-center justify-between pr-2">
                <span>Deductions</span>
                <span className="font-mono text-sm text-muted-foreground">
                  {formatCurrency(deductionTotal, currency)}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1 pl-2">
                {grouped.deduction.map((item) => (
                  <BreakdownLine
                    key={item.id}
                    label={item.label}
                    amount={item.amount}
                    currency={currency}
                    type="subtotal"
                    tooltip={item.description}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

      {/* Config Info */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
        <span>{result.config_version_hash}</span>
        <span>{result.config_last_updated}</span>
      </div>
    </div>
  )
}
