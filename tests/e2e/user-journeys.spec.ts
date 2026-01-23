import { test, expect } from '@playwright/test'

/**
 * E2E Tests for NetCalc User Journeys
 *
 * These tests cover the main user flows:
 * 1. Basic calculation
 * 2. Multi-country comparison
 * 3. URL sharing and restoration
 * 4. Save and restore from history
 */

test.describe('NetCalc User Journeys', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('Journey 1: Basic single-country calculation', async ({ page }) => {
    // User lands on calculator
    await expect(page.locator('h2').filter({ hasText: 'Compare Countries' })).toBeVisible()

    // Select Netherlands
    await page.locator('select').first().selectOption('nl')

    // Wait for year to be auto-selected
    await page.waitForTimeout(500)

    // Enter salary
    await page.locator('input[type="number"]').first().fill('60000')

    // Wait for calculation (debounced 500ms)
    await page.waitForTimeout(1000)

    // Verify result appears
    await expect(page.locator('text=Net Annual')).toBeVisible()

    // Verify flag appears in title
    await expect(page.locator('text=🇳🇱 Netherlands')).toBeVisible()

    // Verify breakdown sections exist
    await expect(page.locator('text=Income Taxes')).toBeVisible()
  })

  test('Journey 2: Multi-country comparison with best indicator', async ({ page }) => {
    // Add first country - Netherlands
    await page.locator('select').first().selectOption('nl')
    await page.waitForTimeout(500)
    await page.locator('input[type="number"]').first().fill('80000')
    await page.waitForTimeout(1000)

    // Add second country
    await page.locator('button:has-text("Add Country")').click()

    // Select Germany for second country
    const countrySelects = page.locator('select').filter({ hasText: /Country|Select/ })
    await countrySelects.nth(1).selectOption('de')
    await page.waitForTimeout(500)

    // Copy salary to all countries
    await page.locator('button:has-text("Copy all")').first().click()
    await page.waitForTimeout(1500)

    // Verify both countries have results
    await expect(page.locator('text=🇳🇱 Netherlands')).toBeVisible()
    await expect(page.locator('text=🇩🇪 Germany')).toBeVisible()

    // Verify "Best" badge appears on one country
    await expect(page.locator('text=Best')).toBeVisible()

    // Verify comparison delta shows
    await expect(page.locator('text=/less than best|more than/')).toBeVisible()
  })

  test('Journey 3: Share via URL and restore', async ({ page }) => {
    // Set up a calculation
    await page.locator('select').first().selectOption('ch')
    await page.waitForTimeout(500)
    await page.locator('input[type="number"]').first().fill('120000')
    await page.waitForTimeout(1000)

    // Click share button
    await page.locator('button:has-text("Share")').click()

    // Verify toast confirmation
    await expect(page.locator('text=Link copied')).toBeVisible({ timeout: 5000 })

    // Verify URL contains state
    const url = page.url()
    expect(url).toContain('?c=ch-')

    // Navigate away
    await page.goto('/history')

    // Navigate back with the URL
    await page.goto(url)
    await page.waitForTimeout(1000)

    // Verify state restored
    await expect(page.locator('text=🇨🇭 Switzerland')).toBeVisible()

    // Verify salary is filled
    const salaryInput = page.locator('input[type="number"]').first()
    await expect(salaryInput).toHaveValue('120000')

    // Verify result appears
    await expect(page.locator('text=Net Annual')).toBeVisible()
  })

  test('Journey 4: Save calculation and restore from history', async ({ page }) => {
    // Set up a comparison
    await page.locator('select').first().selectOption('nl')
    await page.waitForTimeout(500)
    await page.locator('input[type="number"]').first().fill('70000')
    await page.waitForTimeout(1000)

    // Add second country
    await page.locator('button:has-text("Add Country")').click()
    await page.locator('select').nth(1).selectOption('de')
    await page.waitForTimeout(500)
    await page.locator('button:has-text("Copy all")').first().click()
    await page.waitForTimeout(1500)

    // Click save button
    await page.locator('button:has-text("Save")').click()

    // Fill save dialog
    await page.locator('input[id="name"]').fill('NL vs DE Comparison')
    await page.locator('textarea[id="notes"]').fill('Testing save functionality')
    await page.locator('button:has-text("Save")').last().click()

    // Verify save confirmation
    await expect(page.locator('text=Calculation saved')).toBeVisible({ timeout: 5000 })

    // Navigate to history
    await page.goto('/history')

    // Verify saved calculation appears
    await expect(page.locator('text=NL vs DE Comparison')).toBeVisible()
    await expect(page.locator('text=Testing save functionality')).toBeVisible()

    // Verify country badges
    await expect(page.locator('text=🇳🇱 Netherlands 2025')).toBeVisible()
    await expect(page.locator('text=🇩🇪 Germany')).toBeVisible()

    // Click restore
    await page.locator('button:has-text("Restore Calculation")').first().click()
    await page.waitForTimeout(1500)

    // Verify back on calculator with state restored
    await expect(page.locator('text=🇳🇱 Netherlands')).toBeVisible()
    await expect(page.locator('text=🇩🇪 Germany')).toBeVisible()

    // Verify salary restored
    const salaryInput = page.locator('input[type="number"]').first()
    await expect(salaryInput).toHaveValue('70000')
  })

  test('Journey 5: Search and delete from history', async ({ page }) => {
    // Save a few calculations first
    for (let i = 0; i < 3; i++) {
      await page.goto('/')
      await page.locator('select').first().selectOption('nl')
      await page.waitForTimeout(500)
      await page.locator('input[type="number"]').first().fill(`${(i + 1) * 10000}`)
      await page.waitForTimeout(1000)

      await page.locator('button:has-text("Save")').click()
      await page.locator('input[id="name"]').fill(`Test Calculation ${i + 1}`)
      await page.locator('button:has-text("Save")').last().click()
      await page.waitForTimeout(500)
    }

    // Navigate to history
    await page.goto('/history')

    // Verify all calculations appear
    await expect(page.locator('text=Test Calculation 1')).toBeVisible()
    await expect(page.locator('text=Test Calculation 2')).toBeVisible()
    await expect(page.locator('text=Test Calculation 3')).toBeVisible()

    // Search for specific calculation
    await page.locator('input[placeholder*="Search"]').fill('Calculation 2')
    await page.waitForTimeout(500)

    // Verify filtered results
    await expect(page.locator('text=Test Calculation 2')).toBeVisible()
    await expect(page.locator('text=Test Calculation 1')).not.toBeVisible()

    // Clear search
    await page.locator('input[placeholder*="Search"]').clear()
    await page.waitForTimeout(500)

    // Delete a calculation
    await page.locator('button[title="Delete calculation"]').first().click()
    await page.locator('button:has-text("Delete")').last().click()

    // Verify deletion toast
    await expect(page.locator('text=Calculation deleted')).toBeVisible({ timeout: 5000 })

    // Verify calculation removed (count should decrease)
    const remainingCalcs = page.locator('[data-testid="history-item"], .grid > div')
    await expect(remainingCalcs).toHaveCount(2, { timeout: 2000 })
  })

  test('Journey 6: Remove country from comparison', async ({ page }) => {
    // Add two countries
    await page.locator('select').first().selectOption('nl')
    await page.waitForTimeout(500)
    await page.locator('button:has-text("Add Country")').click()
    await page.locator('select').nth(1).selectOption('de')
    await page.waitForTimeout(500)

    // Verify both countries visible
    await expect(page.locator('text=🇳🇱 Netherlands')).toBeVisible()
    await expect(page.locator('text=🇩🇪 Germany')).toBeVisible()

    // Remove second country
    await page.locator('button[aria-label="Remove"]').last().click()
    await page.waitForTimeout(500)

    // Verify only one country remains
    await expect(page.locator('text=🇳🇱 Netherlands')).toBeVisible()
    await expect(page.locator('text=🇩🇪 Germany')).not.toBeVisible()
  })

  test('Journey 7: URL state updates as user types', async ({ page }) => {
    // Select country
    await page.locator('select').first().selectOption('fr')
    await page.waitForTimeout(1000)

    // Enter salary
    await page.locator('input[type="number"]').first().fill('50000')

    // Wait for debounced URL update
    await page.waitForTimeout(1000)

    // Verify URL updated
    const url = page.url()
    expect(url).toContain('?c=fr-')
    expect(url).toContain('-50000')
  })
})
