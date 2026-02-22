import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Tax Deductions
 *
 * Tests the progressive disclosure deduction UI:
 * 1. Adding a mortgage interest deduction with multiple fields
 * 2. Verifying calculation updates
 * 3. Editing and removing deductions
 * 4. Adding multiple deductions together
 */

test.describe('Tax Deductions Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Listen to API requests
    page.on('request', request => {
      if (request.url().includes('/api/calc')) {
        console.log('API Request:', request.method(), request.url())
        if (request.method() === 'POST') {
          console.log('Request body:', request.postDataJSON())
        }
      }
    })

    page.on('response', async response => {
      if (response.url().includes('/api/calc')) {
        console.log('API Response:', response.status())
        try {
          const body = await response.json()
          console.log('Response body:', JSON.stringify(body, null, 2))
        } catch (e) {
          // Not JSON
        }
      }
    })

    await page.goto('/calculator')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(500)
  })

  test('Should add mortgage interest deduction and update calculation', async ({ page }) => {
    // Select Netherlands
    const countryTrigger = page.locator('button[role="combobox"]').first()
    await countryTrigger.click()
    await page.waitForTimeout(300)
    await page.getByText('Netherlands', { exact: true }).first().click()
    await page.waitForTimeout(1000) // Wait for year auto-select

    // Enter gross salary
    const grossInput = page.locator('input[type="number"]').first()
    await grossInput.fill('60000')
    await page.waitForTimeout(1500) // Wait for debounced calculation

    // Capture baseline net salary
    const netAnnualLabel = page.getByText('Net Annual')
    await expect(netAnnualLabel).toBeVisible({ timeout: 5000 })

    const netAmountElement = netAnnualLabel.locator('..').locator('span.text-xl')
    const baselineNet = await netAmountElement.textContent()
    console.log('Baseline net (no deductions):', baselineNet)

    // Verify deductions section shows €0
    const deductionsAccordion = page.getByText('Deductions', { exact: true }).first()
    if (await deductionsAccordion.isVisible()) {
      await deductionsAccordion.click()
      await page.waitForTimeout(300)

      const deductionAmount = page.locator('text=Deductions').locator('..').locator('.font-mono').first()
      const baselineDeduction = await deductionAmount.textContent()
      expect(baselineDeduction).toContain('€0')
      console.log('Baseline deductions:', baselineDeduction)
    }

    // Click "Add Deduction" button
    const addDeductionButton = page.getByRole('button', { name: 'Add Deduction' })
    await expect(addDeductionButton).toBeVisible()
    await addDeductionButton.click()
    await page.waitForTimeout(500)

    // Select mortgage interest deduction type
    const deductionTypeSelector = page.locator('[role="combobox"]').filter({ hasText: 'Select a deduction type' })
    await expect(deductionTypeSelector).toBeVisible()
    await deductionTypeSelector.click()
    await page.waitForTimeout(300)

    // Click on Mortgage Interest option
    const mortgageOption = page.getByText('Mortgage Interest Paid', { exact: false }).first()
    await expect(mortgageOption).toBeVisible()
    await mortgageOption.click()
    await page.waitForTimeout(500)

    // Get dialog container and scope inputs to it
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()

    // Fill in mortgage interest amount by label
    const mortgageAmountInput = page.getByLabel('Mortgage Interest Paid (Optional)')
    await expect(mortgageAmountInput).toBeVisible()
    await mortgageAmountInput.fill('10000')
    await expect(mortgageAmountInput).toHaveValue('10000')
    console.log('Filled mortgage interest: 10000')

    // Fill in mortgage start year by label
    const mortgageYearInput = page.getByLabel('Mortgage Start Year (Optional)')
    await expect(mortgageYearInput).toBeVisible()
    await mortgageYearInput.fill('2020')
    await expect(mortgageYearInput).toHaveValue('2020')
    console.log('Filled mortgage start year: 2020')

    // Wait for React state to update
    await page.waitForTimeout(1000)

    // Save the deduction (button text might be "Add" or "Update" depending on state)
    const saveButton = page.getByRole('button', { name: /^(Add|Update)$/ })
    await expect(saveButton).toBeVisible()
    await saveButton.click()

    // Wait for dialog to close
    await expect(dialog).not.toBeVisible({ timeout: 2000 })

    // Wait for calculation to update
    await page.waitForTimeout(2000)

    // Verify deduction appears in Active Deductions list
    const activeDeductionsLabel = page.getByText('Active Deductions')
    await expect(activeDeductionsLabel).toBeVisible({ timeout: 10000 })

    const mortgageDeductionItem = page.getByText('Mortgage Interest Paid', { exact: false }).first()
    await expect(mortgageDeductionItem).toBeVisible()
    console.log('✓ Mortgage deduction appears in active list')

    // Verify calculation updated
    await page.waitForTimeout(1000)
    const updatedNet = await netAmountElement.textContent()
    console.log('Updated net (with deduction):', updatedNet)

    // Net should have changed from baseline
    expect(updatedNet).not.toBe(baselineNet)

    // Verify deductions breakdown shows non-zero value
    const deductionsTotal = page.locator('text=Deductions').locator('..').locator('.font-mono').first()
    const deductionTotalText = await deductionsTotal.textContent()
    console.log('Deductions total in breakdown:', deductionTotalText)

    // Should NOT be €0
    expect(deductionTotalText).not.toContain('€0')
  })

  test('Should edit an existing deduction', async ({ page }) => {
    // Setup: Add a deduction first
    const countryTrigger = page.locator('button[role="combobox"]').first()
    await countryTrigger.click()
    await page.waitForTimeout(300)
    await page.getByText('Netherlands', { exact: true }).first().click()
    await page.waitForTimeout(1000)

    await page.locator('input[type="number"]').first().fill('60000')
    await page.waitForTimeout(1500)

    // Add mortgage deduction
    await page.getByRole('button', { name: 'Add Deduction' }).click()
    await page.waitForTimeout(500)

    await page.locator('[role="combobox"]').filter({ hasText: 'Select a deduction type' }).click()
    await page.waitForTimeout(300)

    await page.getByText('Mortgage Interest Paid', { exact: false }).first().click()
    await page.waitForTimeout(500)

    await page.getByLabel('Mortgage Interest Paid (Optional)').fill('10000')
    await page.getByLabel('Mortgage Start Year (Optional)').fill('2020')

    await page.getByRole('button', { name: /^(Add|Update)$/ }).click()
    await page.waitForTimeout(2000)

    // Now edit the deduction
    const editButton = page.locator('button').filter({ hasText: 'Edit' }).first()
    await expect(editButton).toBeVisible()
    await editButton.click()
    await page.waitForTimeout(500)

    // Change the mortgage amount
    await page.getByLabel('Mortgage Interest Paid (Optional)').fill('15000')
    await page.waitForTimeout(200)

    // Save changes
    const saveButton = page.getByRole('button', { name: /^(Add|Update)$/ })
    await expect(saveButton).toBeVisible()
    await saveButton.click()
    await page.waitForTimeout(2000)

    // Verify the value updated in the active list
    const mortgageItem = page.getByText('Mortgage Interest Paid', { exact: false }).first()
    const itemContainer = mortgageItem.locator('..')
    await expect(itemContainer.getByText('15,000')).toBeVisible()
  })

  test('Should remove a deduction', async ({ page }) => {
    // Setup: Add a deduction
    const countryTrigger = page.locator('button[role="combobox"]').first()
    await countryTrigger.click()
    await page.waitForTimeout(300)
    await page.getByText('Netherlands', { exact: true }).first().click()
    await page.waitForTimeout(1000)

    await page.locator('input[type="number"]').first().fill('60000')
    await page.waitForTimeout(1500)

    const netAmountElement = page.getByText('Net Annual').locator('..').locator('span.text-xl')
    const baselineNet = await netAmountElement.textContent()

    // Add deduction
    await page.getByRole('button', { name: 'Add Deduction' }).click()
    await page.waitForTimeout(500)

    await page.locator('[role="combobox"]').filter({ hasText: 'Select a deduction type' }).click()
    await page.waitForTimeout(300)

    await page.getByText('Mortgage Interest Paid', { exact: false }).first().click()
    await page.waitForTimeout(500)

    await page.getByLabel('Mortgage Interest Paid (Optional)').fill('10000')
    await page.getByLabel('Mortgage Start Year (Optional)').fill('2020')

    await page.getByRole('button', { name: /^(Add|Update)$/ }).click()
    await page.waitForTimeout(2000)

    // Verify deduction was added
    await expect(page.getByText('Active Deductions')).toBeVisible()
    const netWithDeduction = await netAmountElement.textContent()
    expect(netWithDeduction).not.toBe(baselineNet)

    // Remove the deduction
    const removeButton = page.locator('button').filter({ hasText: 'Remove' }).first()
    await expect(removeButton).toBeVisible()
    await removeButton.click()
    await page.waitForTimeout(2000)

    // Verify deduction removed
    await expect(page.getByText('Active Deductions')).not.toBeVisible()

    // Verify net went back to baseline
    const netAfterRemoval = await netAmountElement.textContent()
    expect(netAfterRemoval).toBe(baselineNet)
  })

  test('Should add multiple deductions', async ({ page }) => {
    // Select Netherlands
    const countryTrigger = page.locator('button[role="combobox"]').first()
    await countryTrigger.click()
    await page.waitForTimeout(300)
    await page.getByText('Netherlands', { exact: true }).first().click()
    await page.waitForTimeout(1000)

    await page.locator('input[type="number"]').first().fill('60000')
    await page.waitForTimeout(1500)

    const netAmountElement = page.getByText('Net Annual').locator('..').locator('span.text-xl')
    const baselineNet = await netAmountElement.textContent()

    // Add first deduction (Mortgage)
    await page.getByRole('button', { name: 'Add Deduction' }).click()
    await page.waitForTimeout(500)

    await page.locator('[role="combobox"]').filter({ hasText: 'Select a deduction type' }).click()
    await page.waitForTimeout(300)

    await page.getByText('Mortgage Interest Paid', { exact: false }).first().click()
    await page.waitForTimeout(500)

    await page.getByLabel('Mortgage Interest Paid (Optional)').fill('10000')
    await page.getByLabel('Mortgage Start Year (Optional)').fill('2020')

    await page.getByRole('button', { name: /^(Add|Update)$/ }).click()
    await page.waitForTimeout(2000)

    // Add second deduction (Pension)
    await page.getByRole('button', { name: 'Add Deduction' }).click()
    await page.waitForTimeout(500)

    await page.locator('[role="combobox"]').filter({ hasText: 'Select a deduction type' }).click()
    await page.waitForTimeout(300)

    await page.getByText('Pension/Annuity Contributions', { exact: false }).first().click()
    await page.waitForTimeout(500)

    await page.getByLabel('Pension/Annuity Contributions (Optional)').fill('5000')
    await page.getByLabel('Available Jaarruimte (Optional)').fill('8000')

    await page.getByRole('button', { name: /^(Add|Update)$/ }).click()
    await page.waitForTimeout(2000)

    // Verify both deductions appear
    await expect(page.getByText('Mortgage Interest Paid', { exact: false })).toBeVisible()
    await expect(page.getByText('Pension/Annuity Contributions', { exact: false })).toBeVisible()

    // Verify calculation changed significantly
    const netWithBoth = await netAmountElement.textContent()
    expect(netWithBoth).not.toBe(baselineNet)
  })

  test('Should persist deductions in URL', async ({ page }) => {
    // Add a deduction
    const countryTrigger = page.locator('button[role="combobox"]').first()
    await countryTrigger.click()
    await page.waitForTimeout(300)
    await page.getByText('Netherlands', { exact: true }).first().click()
    await page.waitForTimeout(1000)

    await page.locator('input[type="number"]').first().fill('60000')
    await page.waitForTimeout(1500)

    await page.getByRole('button', { name: 'Add Deduction' }).click()
    await page.waitForTimeout(500)

    await page.locator('[role="combobox"]').filter({ hasText: 'Select a deduction type' }).click()
    await page.waitForTimeout(300)

    await page.getByText('Mortgage Interest Paid', { exact: false }).first().click()
    await page.waitForTimeout(500)

    await page.getByLabel('Mortgage Interest Paid (Optional)').fill('10000')
    await page.getByLabel('Mortgage Start Year (Optional)').fill('2020')

    await page.getByRole('button', { name: /^(Add|Update)$/ }).click()
    await page.waitForTimeout(2000)

    // Get the URL
    const urlWithDeduction = page.url()
    console.log('URL with deduction:', urlWithDeduction)

    // Verify URL contains deduction parameters
    expect(urlWithDeduction).toContain('mortgage_interest_paid')
    expect(urlWithDeduction).toContain('mortgage_start_year')

    // Navigate away and back
    await page.goto('/')
    await page.waitForTimeout(500)

    await page.goto(urlWithDeduction)
    await page.waitForTimeout(2000)

    // Verify deduction restored
    await expect(page.getByText('Active Deductions')).toBeVisible()
    await expect(page.getByText('Mortgage Interest Paid', { exact: false })).toBeVisible()

    // Verify values restored
    const mortgageItem = page.getByText('Mortgage Interest Paid', { exact: false }).first()
    await expect(mortgageItem).toBeVisible()
  })
})
