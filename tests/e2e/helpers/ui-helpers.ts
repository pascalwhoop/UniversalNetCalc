import { Page } from '@playwright/test'

/**
 * Helper functions for interacting with shadcn/ui Select components
 * in E2E tests. These functions provide a consistent interface for
 * selecting values from dropdown menus.
 */

/**
 * Wait for a calculation to complete by waiting for the calculation debounce
 * and any pending network requests to finish.
 */
export async function waitForCalculationComplete(page: Page): Promise<void> {
  // Wait for debounced calculation (500ms) + some buffer
  await page.waitForTimeout(750)

  // Wait for any pending network requests
  await page.waitForLoadState('networkidle')
}

/**
 * Select a country from the country dropdown
 *
 * @param page Playwright page object
 * @param countryCode Country code (e.g., 'nl', 'it', 'de')
 * @param index Optional index if multiple country selectors exist (default: 0)
 */
export async function selectCountryFromCombobox(
  page: Page,
  countryCode: string,
  index: number = 0
): Promise<void> {
  // Find the combobox trigger by looking for it near the Country label
  // Strategy: Find all combobox buttons and click the one near "Country" label
  const countryName = getCountryName(countryCode)

  // For first selector, try clicking the first combobox we can find
  if (index === 0) {
    // Find the container with "Country" label, then find the trigger button
    // Using a more specific selector for the actual Select trigger
    const trigger = page.locator('button[role="combobox"]').first()
    await trigger.click({ timeout: 5000 })
  } else {
    // For multi-selector, find the nth combobox
    const trigger = page.locator('button[role="combobox"]').nth(index)
    await trigger.click({ timeout: 5000 })
  }

  await page.waitForTimeout(300)

  // Find and click the country option by text
  const option = page.locator(`text=${countryName}`)
  await option.first().click()

  // Wait for selection to complete
  await page.waitForTimeout(500)
}

/**
 * Select a year from the year dropdown
 *
 * @param page Playwright page object
 * @param year Year to select (e.g., '2025')
 * @param index Optional index if multiple year selectors exist (default: 0)
 */
export async function selectYearFromCombobox(
  page: Page,
  year: string,
  index: number = 0
): Promise<void> {
  // Find all combobox triggers and click the year one
  // Assuming year is the second combobox after country
  const triggers = page.locator('button[role="combobox"]')
  const trigger = triggers.nth(index + 1) // index+1 because country is first
  await trigger.click({ timeout: 5000 })

  await page.waitForTimeout(300)

  // Find and click the year option by text
  const option = page.locator(`text=${year}`)
  await option.first().click()

  // Wait for selection to complete
  await page.waitForTimeout(500)
}

/**
 * Select a tax variant from the variant dropdown
 *
 * @param page Playwright page object
 * @param variant Variant name (e.g., 'impatriate', '30-ruling')
 * @param index Optional index if multiple variant selectors exist (default: 0)
 */
export async function selectVariantFromCombobox(
  page: Page,
  variant: string,
  index: number = 0
): Promise<void> {
  // Format variant name for display (e.g., 'impatriate' -> 'Impatriate')
  const variantDisplayName = variant
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  // Find all combobox triggers
  // Variant is typically the 3rd or later trigger, find by proximity to "Tax Variant" label
  const triggers = page.locator('button[role="combobox"]')

  // Try to find the variant trigger - for now use a higher index
  // This may need adjustment based on actual page structure
  let trigger

  if (index === 0) {
    // Find all comboboxes and use the last one before any custom inputs
    // Usually it's after country (0), year (1), so variant is (2) at minimum
    const count = await triggers.count()
    trigger = triggers.nth(Math.min(2, count - 1))
  } else {
    trigger = triggers.nth(index + 2)
  }

  await trigger.click({ timeout: 5000 })

  await page.waitForTimeout(300)

  // Find and click the variant option by text
  const option = page.locator(`text=${variantDisplayName}`)
  await option.first().click()

  // Wait for selection to complete
  await page.waitForTimeout(500)
}

/**
 * Select a region/enum value from a dropdown by label
 *
 * @param page Playwright page object
 * @param label Label of the field (e.g., 'Region', 'Filing Status')
 * @param value Value to select (e.g., 'lazio', 'single')
 * @param index Optional index if multiple fields with same label exist (default: 0)
 */
export async function selectFromDropdownByLabel(
  page: Page,
  label: string,
  value: string,
  index: number = 0
): Promise<void> {
  // Format value for display (e.g., 'lazio' -> 'Lazio')
  const displayValue = value
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  // Find the trigger near the label
  const triggers = page.locator('button[role="combobox"]')
  const trigger = triggers.nth(index)

  await trigger.click({ timeout: 5000 })
  await page.waitForTimeout(300)

  // Find and click the option by text
  const option = page.locator(`text=${displayValue}`)
  await option.first().click()

  // Wait for selection to complete
  await page.waitForTimeout(500)
}

/**
 * Helper to convert country codes to display names
 * Add more mappings as needed
 */
function getCountryName(countryCode: string): string {
  const countryNames: Record<string, string> = {
    'nl': 'Netherlands',
    'de': 'Germany',
    'fr': 'France',
    'ch': 'Switzerland',
    'it': 'Italy',
    'be': 'Belgium',
    'at': 'Austria',
    'es': 'Spain',
    'se': 'Sweden',
    'us': 'United States',
  }

  return countryNames[countryCode] || countryCode.toUpperCase()
}
