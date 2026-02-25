import { test, expect, Page } from '@playwright/test'

/**
 * Tests for the salary mode toggle (Pin salary button).
 *
 * The UI was redesigned from a two-tab control ("Same salary" / "Local salaries")
 * to a single Toggle button labeled "Pin salary". When pressed (aria-pressed=true)
 * the same gross is applied to all columns; when unpressed each column has its own.
 * The tooltip was also replaced by a HoverCard.
 */

/** Dismiss any open wizard Sheet by pressing Escape and waiting for it to close */
async function dismissSheet(page: Page) {
  const overlay = page.locator('[data-slot="sheet-overlay"]')
  if (await overlay.isVisible({ timeout: 2000 }).catch(() => false)) {
    await page.keyboard.press('Escape')
    await overlay.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {})
    await page.waitForTimeout(200)
  }
}

// Use a URL with pre-configured state so the wizard doesn't auto-open
const CALC_URL = '/calculator?c=nl-2025--100000'

test.describe('Salary mode toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(CALC_URL)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(800)
    await dismissSheet(page)
  })

  test('renders the Pin salary toggle button', async ({ page }) => {
    await expect(page.locator('button:has-text("Pin salary")')).toBeVisible()
  })

  test('defaults to pinned state (aria-pressed=true)', async ({ page }) => {
    const pinBtn = page.locator('button:has-text("Pin salary")')
    await expect(pinBtn).toHaveAttribute('aria-pressed', 'true')
  })

  test('clicking the button unpins salary (aria-pressed=false)', async ({ page }) => {
    const pinBtn = page.locator('button:has-text("Pin salary")')
    await pinBtn.click()
    await expect(pinBtn).toHaveAttribute('aria-pressed', 'false')
  })

  test('clicking twice returns to pinned state', async ({ page }) => {
    const pinBtn = page.locator('button:has-text("Pin salary")')
    await pinBtn.click()
    await expect(pinBtn).toHaveAttribute('aria-pressed', 'false')
    // Dismiss any sheet that may have appeared, then click again
    await dismissSheet(page)
    await pinBtn.click()
    await expect(pinBtn).toHaveAttribute('aria-pressed', 'true')
  })

  test('hovering shows HoverCard content', async ({ page }) => {
    const pinBtn = page.locator('button:has-text("Pin salary")')
    await pinBtn.hover()
    // HoverCard has openDelay=300ms; wait beyond that
    await page.waitForTimeout(600)
    await expect(page.locator('[data-slot="hover-card-content"]')).toBeVisible({ timeout: 3000 })
  })
})
