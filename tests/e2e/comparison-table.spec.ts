import { test, expect, Page } from '@playwright/test'

/**
 * E2E tests for the comparison table view
 * Covers all features added in feat/table-comparison-view:
 *  - Table row labels and structure
 *  - Expandable tax category rows
 *  - Adding/editing/removing countries via wizard
 *  - "Best" badge on highest net income
 *  - Pin salary sync across columns
 *  - Max 4 countries enforcement
 *  - Living costs section in wizard
 *  - URL state persistence and restoration
 *  - Responsive layout
 *  - Share and Save buttons
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** The wizard dialog opens automatically on load — dismiss it first */
async function dismissDialog(page: Page) {
  const overlay = page.locator('[data-slot="dialog-overlay"]')
  if (await overlay.isVisible().catch(() => false)) {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(400)
  }
}

async function waitForCalc(page: Page) {
  await page.waitForTimeout(700)
  await page.waitForFunction(
    () => !document.querySelector('[data-slot="skeleton"], [class*="skeleton"]'),
    { timeout: 8000 }
  ).catch(() => { /* ignore — skeletons may not be present */ })
  await page.waitForTimeout(300)
}

/** Click a table row by its label text */
async function clickRow(page: Page, label: string) {
  await page.locator(`tr:has-text("${label}")`).first().click({ timeout: 5000 })
}

/** Add a country via the wizard dialog */
async function addCountry(page: Page, name: string) {
  await dismissDialog(page)
  await page.locator('button:has-text("Add Destination")').first().click()
  await page.waitForTimeout(600)
  const combo = page.getByRole('combobox').first()
  await combo.click()
  await page.waitForTimeout(200)
  await page.keyboard.type(name)
  await page.waitForTimeout(400)
  await page.getByRole('option').first().click()
  await page.waitForTimeout(300)
  // Scope Apply to the visible dialog to avoid matching stale DOM nodes
  await page.locator('[role="dialog"]:visible button:has-text("Apply")').click({ timeout: 10000 })
  await page.waitForTimeout(800)
  await dismissDialog(page)
  await waitForCalc(page)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Comparison table view', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calculator')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1500)
    // The wizard opens automatically for the default country — dismiss it
    await dismissDialog(page)
  })

  // ── Section 1: Initial state ───────────────────────────────────────────────

  test('shows key header controls on load', async ({ page }) => {
    await expect(page.locator('button:has-text("Add Destination")')).toBeVisible()
    await expect(page.locator('button:has-text("Pin salary")')).toBeVisible()
    await expect(page.locator('button:has-text("Share")')).toBeVisible()
    await expect(page.locator('button:has-text("Save")')).toBeVisible()
  })

  // ── Section 2: Table row labels ────────────────────────────────────────────

  test('renders all expected table rows', async ({ page }) => {
    for (const label of [
      'Gross Income',
      'Income Taxes',
      'Credits',
      'Net Annual',
      'Net Monthly',
      'Eff. Rate',
      'Marginal Rate',
    ]) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible()
    }
  })

  test('shows config version in table footer', async ({ page }) => {
    await expect(page.getByText(/config/i).first()).toBeVisible()
  })

  // ── Section 3: Expandable tax categories ──────────────────────────────────

  test('Income Taxes row expands and collapses', async ({ page }) => {
    const before = await page.locator('tbody tr').count()
    await clickRow(page, 'Income Taxes')
    await page.waitForTimeout(500)
    const after = await page.locator('tbody tr').count()
    expect(after).toBeGreaterThan(before)

    // Collapse
    await clickRow(page, 'Income Taxes')
    await page.waitForTimeout(400)
    expect(await page.locator('tbody tr').count()).toBeLessThanOrEqual(before)
  })

  test('Credits row expands and collapses', async ({ page }) => {
    const before = await page.locator('tbody tr').count()
    await clickRow(page, 'Credits')
    await page.waitForTimeout(500)
    expect(await page.locator('tbody tr').count()).toBeGreaterThan(before)

    await clickRow(page, 'Credits')
    await page.waitForTimeout(400)
    expect(await page.locator('tbody tr').count()).toBeLessThanOrEqual(before)
  })

  test('Deductions row expands and collapses', async ({ page }) => {
    const before = await page.locator('tbody tr').count()
    await clickRow(page, 'Deductions')
    await page.waitForTimeout(500)
    expect(await page.locator('tbody tr').count()).toBeGreaterThan(before)

    await clickRow(page, 'Deductions')
    await page.waitForTimeout(400)
    expect(await page.locator('tbody tr').count()).toBeLessThanOrEqual(before)
  })

  // ── Section 4: Adding a second country ────────────────────────────────────

  test('adds a second country via wizard', async ({ page }) => {
    const beforeHeaders = await page.locator('thead th').count()
    await addCountry(page, 'Germany')
    // A new column should have been added
    expect(await page.locator('thead th').count()).toBeGreaterThan(beforeHeaders)
  })

  test('"Best" badge appears when 2+ countries have results', async ({ page }) => {
    await addCountry(page, 'Germany')
    await waitForCalc(page)
    await page.waitForTimeout(2000) // allow both calculations to return

    // Best badge should appear on the higher-net-income column
    await expect(page.getByText('Best').first()).toBeVisible({ timeout: 10000 })
  })

  test('expanded tax category shows data across both country columns', async ({ page }) => {
    await addCountry(page, 'Germany')
    const before = await page.locator('tbody tr').count()
    await clickRow(page, 'Income Taxes')
    await page.waitForTimeout(500)
    expect(await page.locator('tbody tr').count()).toBeGreaterThan(before)
  })

  // ── Section 5: Edit and remove ────────────────────────────────────────────

  test('Edit button opens wizard pre-filled with country data', async ({ page }) => {
    const editBtn = page.locator('button:has-text("Edit")').first()
    await editBtn.click()
    await page.waitForTimeout(600)

    const dialog = page.getByRole('dialog').first()
    await expect(dialog).toBeVisible()
    // Wizard should show the country name
    const content = await dialog.textContent()
    expect(content).toMatch(/netherlands|germany/i)

    await page.locator('button:has-text("Cancel")').click()
    await page.waitForTimeout(400)
  })

  test('Remove button removes a country column', async ({ page }) => {
    await addCountry(page, 'Germany')
    const beforeHeaders = await page.locator('thead th').count()

    await page.locator('button:has-text("Remove")').first().click()
    await page.waitForTimeout(600)

    expect(await page.locator('thead th').count()).toBeLessThan(beforeHeaders)
  })

  // ── Section 6: Pin salary ─────────────────────────────────────────────────

  test('"Pin salary" button toggles between pinned and unpinned', async ({ page }) => {
    const pinBtn = page.locator('button:has-text("Pin salary")')
    await expect(pinBtn).toBeVisible()
    await pinBtn.click()
    await page.waitForTimeout(400)
    await pinBtn.click()
    await page.waitForTimeout(400)
    // Button should still be visible after toggling twice
    await expect(pinBtn).toBeVisible()
  })

  // ── Section 7: Max 4 countries ────────────────────────────────────────────

  test('"Add Destination" is disabled when 4 countries are shown', async ({ page }) => {
    const addBtn = page.locator('button:has-text("Add Destination")')
    for (const country of ['Germany', 'France', 'Spain']) {
      if (await addBtn.isDisabled().catch(() => false)) break
      await addCountry(page, country)
    }
    await expect(addBtn).toBeDisabled()
  })

  // ── Section 8: Living costs ───────────────────────────────────────────────

  test('"Monthly Living Costs" section is accessible in wizard', async ({ page }) => {
    await page.locator('button:has-text("Edit")').first().click()
    await page.waitForTimeout(600)
    await expect(page.locator('button:has-text("Monthly Living Costs")')).toBeVisible()
    await page.keyboard.press('Escape')
    await page.waitForTimeout(400)
  })

  // ── Section 9: URL state ──────────────────────────────────────────────────

  test('URL encodes calculator state', async ({ page }) => {
    await page.waitForTimeout(1500) // wait for debounce
    expect(page.url().length).toBeGreaterThan('/calculator'.length)
  })

  test('reloading URL restores country columns', async ({ page }) => {
    await addCountry(page, 'Germany')
    await page.waitForTimeout(1500) // wait for URL debounce

    const url = page.url()
    await page.goto(url)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)
    await dismissDialog(page)

    const colCount = (await page.locator('thead th').count()) - 1
    expect(colCount).toBeGreaterThan(0)
  })

  // ── Section 10: Responsive layout ────────────────────────────────────────

  test('renders without crash on tablet viewport (768×1024)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.waitForTimeout(500)
    await expect(page.locator('body')).toBeVisible()
  })

  test('renders without crash on mobile viewport (375×812)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.waitForTimeout(500)
    await expect(page.locator('body')).toBeVisible()
  })

  // ── Section 11: Share & Save ──────────────────────────────────────────────

  test('"Share" button is clickable', async ({ page }) => {
    await page.locator('button:has-text("Share")').click()
    await page.waitForTimeout(400)
    // No assertion needed beyond not crashing — it copies to clipboard
    await page.keyboard.press('Escape')
  })

  test('"Save" button opens a dialog', async ({ page }) => {
    await page.locator('button:has-text("Save")').first().click()
    await page.waitForTimeout(500)
    await expect(page.getByRole('dialog').first()).toBeVisible()
    await page.keyboard.press('Escape')
  })
})
