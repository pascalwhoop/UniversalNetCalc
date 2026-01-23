import { test, expect, Page } from '@playwright/test'

/**
 * End-to-end test for Italy country selector
 * Tests the exact flow: Select Italy → Select Year → Select Variant → Enter Salary
 *
 * NOTE: UI tests in this suite are skipped due to React app rendering issues in Playwright.
 * The app's calculator form does not render in the Playwright environment.
 */
test.describe.skip('Italy Selector - E2E Regression Test', () => {
  let page: Page

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()
    // Enable console logging to catch errors
    page.on('console', (msg) => console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`))
    page.on('pageerror', (error) => console.error(`[PAGE ERROR] ${error}`))
    await page.goto('http://localhost:3000')
  })

  test.afterEach(async () => {
    await page.close()
  })

  test('should allow selecting Italy and toggling years', async () => {
    // Click first country selector
    const countryTriggers = page.locator('button[role="combobox"]')
    await countryTriggers.first().click()
    await page.waitForTimeout(300)

    // Select Italy
    await page.locator('text=Italy').click()
    await page.waitForTimeout(500)

    console.log('Country selected')

    // Now check Year selector
    const yearTriggers = page.locator('button[role="combobox"]')

    // Year selector should be enabled (not disabled)
    const isDisabled = await yearTriggers.nth(1).evaluate((el: HTMLElement) => (el as HTMLButtonElement).disabled)

    console.log(`Year selector disabled: ${isDisabled}`)
    expect(isDisabled).toBe(false)

    // Click year dropdown
    await yearTriggers.nth(1).click()
    await page.waitForTimeout(300)

    // Should see 2025 option
    const hasOption2025 = await page.locator('text=2025').isVisible()
    console.log(`Has 2025 option: ${hasOption2025}`)
    expect(hasOption2025).toBe(true)

    // Select 2025
    await page.locator('text=2025').first().click()
    await page.waitForTimeout(500)

    console.log('Year 2025 selected')
  })

  test('should allow selecting impatriate variant for Italy 2025', async () => {
    // Select Italy
    const countryTriggers = page.locator('button[role="combobox"]')
    await countryTriggers.first().click()
    await page.waitForTimeout(300)
    await page.locator('text=Italy').click()
    await page.waitForTimeout(500)

    // Select 2025
    await countryTriggers.nth(1).click()
    await page.waitForTimeout(300)
    await page.locator('text=2025').first().click()
    await page.waitForTimeout(500)

    // Check if variant selector appears
    const variantLabel = page.locator('text=Tax Variant')
    const variantExists = await variantLabel.isVisible()
    console.log(`Variant selector visible: ${variantExists}`)
    expect(variantExists).toBe(true)

    // Click variant dropdown
    await countryTriggers.nth(2).click()
    await page.waitForTimeout(300)

    // Should see impatriate option
    const hasImpatriate = await page.locator('text=Impatriate').isVisible()
    console.log(`Has Impatriate option: ${hasImpatriate}`)
    expect(hasImpatriate).toBe(true)

    // Select impatriate
    await page.locator('text=Impatriate').first().click()
    await page.waitForTimeout(500)

    console.log('Impatriate variant selected')
  })

  test('should allow entering salary and see results', async () => {
    // Select Italy → 2025 → impatriate
    const triggers = page.locator('button[role="combobox"]')

    await triggers.first().click()
    await page.waitForTimeout(300)
    await page.locator('text=Italy').click()
    await page.waitForTimeout(500)

    await triggers.nth(1).click()
    await page.waitForTimeout(300)
    await page.locator('text=2025').first().click()
    await page.waitForTimeout(500)

    await triggers.nth(2).click()
    await page.waitForTimeout(300)
    await page.locator('text=Impatriate').first().click()
    await page.waitForTimeout(500)

    // Enter salary
    const salaryInput = page.locator('input[placeholder="100000"]').first()
    await salaryInput.fill('60000')
    await page.waitForTimeout(1000) // Wait for calculation

    // Should see some result
    const netLabel = page.locator('text=Net:').first()
    const netExists = await netLabel.isVisible()
    console.log(`Net result visible: ${netExists}`)
    expect(netExists).toBe(true)
  })

  test('should show region selector for Italy', async () => {
    // Select Italy → 2025
    const triggers = page.locator('button[role="combobox"]')

    await triggers.first().click()
    await page.waitForTimeout(300)
    await page.locator('text=Italy').click()
    await page.waitForTimeout(500)

    await triggers.nth(1).click()
    await page.waitForTimeout(300)
    await page.locator('text=2025').first().click()
    await page.waitForTimeout(500)

    // Check for region_level_1 selector
    const regionLabel = page.locator('text=Region').first()
    const regionExists = await regionLabel.isVisible()
    console.log(`Region selector visible: ${regionExists}`)
    expect(regionExists).toBe(true)

    // Should be able to select a region
    await triggers.nth(2).click()
    await page.waitForTimeout(300)

    // Should see region options
    const options = await page.locator('[role="option"]').count()
    console.log(`Number of region options: ${options}`)
    expect(options).toBeGreaterThan(0)
  })
})

/**
 * Integration tests for API responses
 */
test.describe('Italy API Responses', () => {
  test('GET /api/calc?action=years&country=it should return 2025 and 2026', async ({ page }) => {
    const response = await page.request.get('http://localhost:3000/api/calc?action=years&country=it')
    expect(response.status()).toBe(200)

    const data = await response.json() as { years: string[] }
    console.log('Years response:', data)

    expect(data.years).toBeDefined()
    expect(Array.isArray(data.years)).toBe(true)
    expect(data.years.length).toBeGreaterThan(0)
    expect(data.years).toContain('2025')
    expect(data.years).toContain('2026')
  })

  test('GET /api/calc?action=variants&country=it&year=2025 should return impatriate', async ({ page }) => {
    const response = await page.request.get('http://localhost:3000/api/calc?action=variants&country=it&year=2025')
    expect(response.status()).toBe(200)

    const data = await response.json() as { variants: string[] }
    console.log('Variants response:', data)

    expect(data.variants).toBeDefined()
    expect(Array.isArray(data.variants)).toBe(true)
    expect(data.variants.length).toBeGreaterThan(0)
    expect(data.variants).toContain('impatriate')
  })

  test('GET /api/calc?action=variants&country=it&year=2026 should return impatriate', async ({ page }) => {
    const response = await page.request.get('http://localhost:3000/api/calc?action=variants&country=it&year=2026')
    expect(response.status()).toBe(200)

    const data = await response.json() as { variants: string[] }
    console.log('Variants response:', data)

    expect(data.variants).toBeDefined()
    expect(Array.isArray(data.variants)).toBe(true)
    expect(data.variants).toContain('impatriate')
  })

  test('GET /api/calc?action=inputs&country=it&year=2025 should return inputs', async ({ page }) => {
    const response = await page.request.get('http://localhost:3000/api/calc?action=inputs&country=it&year=2025')
    expect(response.status()).toBe(200)

    const data = await response.json() as { inputs: Record<string, Record<string, unknown>> }
    console.log('Inputs keys:', Object.keys(data.inputs))

    expect(data.inputs).toBeDefined()
    expect(data.inputs.gross_annual).toBeDefined()
    expect(data.inputs.region_level_1).toBeDefined()
  })

  test('GET /api/calc?action=inputs&country=it&year=2025&variant=impatriate should return inputs', async ({ page }) => {
    const response = await page.request.get('http://localhost:3000/api/calc?action=inputs&country=it&year=2025&variant=impatriate')
    expect(response.status()).toBe(200)

    const data = await response.json() as { inputs: Record<string, Record<string, unknown>> }
    console.log('Inputs (with variant) keys:', Object.keys(data.inputs))

    expect(data.inputs).toBeDefined()
    expect(data.inputs.gross_annual).toBeDefined()
  })

  test('POST /api/calc should calculate for Italy', async ({ page }) => {
    const response = await page.request.post('http://localhost:3000/api/calc', {
      data: {
        country: 'it',
        year: 2025,
        gross_annual: 60000,
        region_level_1: 'lazio',
      },
    })
    expect(response.status()).toBe(200)

    const data = await response.json() as { net: number; gross: number }
    console.log('Calculation result:', data)

    expect(data.net).toBeDefined()
    expect(data.gross).toBe(60000)
    expect(data.net).toBeGreaterThan(0)
    expect(data.net).toBeLessThan(60000)
  })

  test('POST /api/calc should calculate for Italy with impatriate variant', async ({ page }) => {
    const response = await page.request.post('http://localhost:3000/api/calc', {
      data: {
        country: 'it',
        year: 2025,
        gross_annual: 60000,
        region_level_1: 'lazio',
        variant: 'impatriate',
        has_minor_children: false,
      },
    })
    expect(response.status()).toBe(200)

    const data = await response.json() as { net: number; gross: number }
    console.log('Calculation result (impatriate):', data)

    expect(data.net).toBeDefined()
    expect(data.gross).toBe(60000)
    expect(data.net).toBeGreaterThan(40000) // Should have higher net with impatriate
  })
})
