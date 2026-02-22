import { test, expect } from '@playwright/test'

test.describe('Salary mode toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calculator')
  })

  test('renders both mode options', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'Same salary' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Local salaries' })).toBeVisible()
  })

  test('defaults to Same salary mode', async ({ page }) => {
    const sameSalary = page.getByRole('tab', { name: 'Same salary' })
    await expect(sameSalary).toHaveAttribute('aria-selected', 'true')
  })

  test('switches to Local salaries mode on click', async ({ page }) => {
    await page.getByRole('tab', { name: 'Local salaries' }).click()
    await expect(page.getByRole('tab', { name: 'Local salaries' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('tab', { name: 'Same salary' })).toHaveAttribute('aria-selected', 'false')
  })

  test('switching back to Same salary works', async ({ page }) => {
    await page.getByRole('tab', { name: 'Local salaries' }).click()
    await page.getByRole('tab', { name: 'Same salary' }).click()
    await expect(page.getByRole('tab', { name: 'Same salary' })).toHaveAttribute('aria-selected', 'true')
  })

  test('shows tooltip on hover', async ({ page }) => {
    await page.getByRole('tab', { name: 'Same salary' }).hover()
    await expect(page.getByRole('tooltip').first()).toBeVisible()
  })
})
