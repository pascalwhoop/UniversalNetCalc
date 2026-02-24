import type { BreakdownItem } from "./api"

export type BreakdownCategory = "income_tax" | "contribution" | "credit" | "deduction" | "surtax"

/**
 * Display configuration for each breakdown category
 */
export const CATEGORY_CONFIG: Record<string, {
  label: string
  colorClass: string
  signPrefix: (amount: number) => string
}> = {
  income_tax: {
    label: "Income Taxes",
    colorClass: "text-destructive",
    signPrefix: (amount) => amount > 0 ? "-" : "",
  },
  contribution: {
    label: "Social Contributions",
    colorClass: "text-destructive",
    signPrefix: (amount) => amount > 0 ? "-" : "",
  },
  credit: {
    label: "Credits",
    colorClass: "text-green-600",
    signPrefix: (amount) => amount > 0 ? "+" : "",
  },
  deduction: {
    label: "Deductions",
    colorClass: "text-muted-foreground",
    signPrefix: () => "",
  },
}

/** Categories that appear as rows in the comparison table, in display order */
export const DISPLAY_CATEGORIES = ["income_tax", "contribution", "credit", "deduction"] as const

/**
 * Group breakdown items by category. Surtaxes are merged into income_tax.
 */
export function groupByCategory(items: BreakdownItem[]): Record<string, BreakdownItem[]> {
  const groups: Record<string, BreakdownItem[]> = {
    income_tax: [],
    contribution: [],
    credit: [],
    deduction: [],
  }

  for (const item of items) {
    // Merge surtax into income_tax for display
    const cat = item.category === "surtax" ? "income_tax" : item.category
    if (groups[cat]) {
      groups[cat].push(item)
    }
  }

  return groups
}

/**
 * Sum amounts for a list of breakdown items
 */
export function categoryTotal(items: BreakdownItem[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0)
}
