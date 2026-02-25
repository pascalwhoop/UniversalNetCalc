import { test, expect, Page } from '@playwright/test'

/**
 * Regression tests for salary sync issues when arriving via homepage preset links.
 *
 * Bug 1: Editing the leader (US) salary via the wizard and clicking Apply does NOT
 *        propagate the gross_annual to follower columns (CH, NL). Followers keep
 *        showing "Configure" even after the leader is configured.
 *        Root cause: handleWizardSave calls setCountries directly, bypassing the
 *        sync logic inside updateCountry.
 *
 * Bug 2: Un-toggling and re-toggling "Pin salary" copies the leader's raw
 *        gross_annual string to all followers without FX conversion.
 *        Root cause: handleSalaryModeChange maps the same gross_annual string to
 *        every column instead of converting via exchange rates.
 */

// Tech Hubs preset — US/CA (leader), CH/ZH, NL
// Use a URL with countries pre-configured but no gross_annual to test salary sync
const PRESET_URL =
  '/calculator?c=us-2026--state:california,ch-2026--region_level_1:zurich,nl-2026'

const LEADER_SALARY = '100000'

/** Wait for any pending calculations / debounces to settle */
async function waitForSettle(page: Page, ms = 1500) {
  await page.waitForTimeout(ms)
}

/**
 * Open the Configure wizard for the first column (leader) and set the gross salary.
 * Returns without closing the dialog — caller must click Apply.
 */
async function openLeaderWizardAndSetSalary(page: Page, salary: string) {
  // Click the Edit button for the first (leader) column
  await page.locator('button:has-text("Edit")').first().click({ timeout: 10000 })

  const dialog = page.getByRole('dialog').first()
  await expect(dialog).toBeVisible({ timeout: 8000 })

  // Salary input — wizard uses inputmode="decimal"
  const salaryInput = dialog.locator('input[inputmode="decimal"]').first()
  await salaryInput.clear()
  await salaryInput.fill(salary)
  await page.waitForTimeout(200)

  return dialog
}

// ─── Extract numeric part from a formatted currency cell ────────────────────

/** Parse the first integer run out of a currency string, e.g. "$ 88,234" → 88234 */
function parseDisplayedAmount(text: string): number {
  const digits = text.replace(/[^0-9]/g, '')
  return parseInt(digits, 10)
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe('Preset salary sync', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PRESET_URL)
    await page.waitForLoadState('domcontentloaded')
    // Allow auto-year-select to run for all three columns
    await waitForSettle(page, 2000)
  })

  // ── Bug 1 ─────────────────────────────────────────────────────────────────

  test('Bug 1: setting leader salary via wizard propagates to follower columns', async ({
    page,
  }) => {
    // All three columns should require configuration initially
    const configureButtons = page.locator('button:has-text("Configure")')
    await expect(configureButtons).toHaveCount(3, { timeout: 5000 })

    // Pin salary is enabled by default (pressed)
    const pinBtn = page.locator('button:has-text("Pin salary")')
    await expect(pinBtn).toHaveAttribute('aria-pressed', 'true')

    // Set salary on the leader (US) column
    const dialog = await openLeaderWizardAndSetSalary(page, LEADER_SALARY)
    await dialog.locator('button:has-text("Apply")').click()
    await waitForSettle(page)

    // With salary synced, followers should also have gross_annual set.
    // "Configure" buttons should disappear from CH and NL columns —
    // cells will show either the calculated gross or a loading skeleton,
    // but NOT the "Configure" CTA.
    const remainingConfigureButtons = page.locator('button:has-text("Configure")')
    await expect(remainingConfigureButtons).toHaveCount(
      0,
      { timeout: 8000 }
    )
  })

  // ── Bug 2 ─────────────────────────────────────────────────────────────────

  test('Bug 2: re-toggling Pin salary uses FX conversion, not raw copy', async ({
    page,
  }) => {
    // 1. Configure the leader (US) with a salary
    const dialog = await openLeaderWizardAndSetSalary(page, LEADER_SALARY)
    await dialog.locator('button:has-text("Apply")').click()
    await waitForSettle(page)

    // 2. Now manually configure CH as well (without a salary, just to get it beyond
    //    "Configure" state — this simulates the user having opened & saved CH wizard)
    //    Actually for this bug we just need all columns to have gross_annual after
    //    the leader is set (which is what Bug 1 fix enables, but we test independently
    //    here by using unpin/repin to force a sync).

    // Unpin salary
    const pinBtn = page.locator('button:has-text("Pin salary")')
    await pinBtn.click() // → unpinned
    await expect(pinBtn).toHaveAttribute('aria-pressed', 'false')
    await page.waitForTimeout(400)

    // Re-pin salary — this should re-sync all followers with FX conversion
    await pinBtn.click() // → pinned
    await expect(pinBtn).toHaveAttribute('aria-pressed', 'true')
    await waitForSettle(page, 2000) // allow API exchange-rate call to resolve

    // 3. Read gross income amounts from the Gross Income row in the table.
    //    Column layout: nth(0) = row label, nth(1) = US, nth(2) = CH, nth(3) = NL
    const grossRow = page.locator('tr').filter({ hasText: /^Gross Income/ }).first()
    const cells = grossRow.locator('td')

    // US gross (col index 1): should show ~$100,000
    const usGrossText = await cells.nth(1).textContent() ?? ''
    // CH gross (col index 2): USD → CHF, rate ~0.88–0.92, so NOT 100,000
    const chGrossText = await cells.nth(2).textContent() ?? ''

    // CH must have a value (not "Configure" or "—")
    expect(chGrossText.trim()).not.toBe('')
    expect(chGrossText).not.toContain('Configure')
    expect(chGrossText).not.toBe('—')

    // The raw numeric amounts must differ — USD 100,000 ≠ CHF 100,000
    const usAmount = parseDisplayedAmount(usGrossText)
    const chAmount = parseDisplayedAmount(chGrossText)

    // Both should be non-zero
    expect(usAmount).toBeGreaterThan(0)
    expect(chAmount).toBeGreaterThan(0)

    // They should NOT be identical — if the bug is present, chAmount === usAmount === 100000
    expect(chAmount).not.toBe(usAmount)

    // Sanity: CHF should be in a plausible range relative to USD (0.80–1.10)
    const ratio = chAmount / usAmount
    expect(ratio).toBeGreaterThan(0.75)
    expect(ratio).toBeLessThan(1.15)
  })
})
