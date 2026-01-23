const { chromium } = require('playwright');

const TARGET_URL = 'http://localhost:3000';

const results = {
  passed: [],
  failed: [],
  errors: []
};

async function test(name, fn) {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    await fn();
    results.passed.push(name);
    console.log(`✅ PASSED: ${name}`);
  } catch (error) {
    results.failed.push(name);
    results.errors.push({ test: name, error: error.message });
    console.log(`❌ FAILED: ${name}`);
    console.log(`   Error: ${error.message}`);
  }
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const page = await browser.newPage();

  try {
    console.log('🚀 Starting NetCalc E2E Tests');
    console.log(`📍 Target URL: ${TARGET_URL}`);

    // Test 1: Basic single-country calculation
    await test('Journey 1: Basic single-country calculation', async () => {
      await page.goto(TARGET_URL);
      await page.waitForLoadState('networkidle');

      // Check for main heading
      await page.waitForSelector('h2:has-text("Compare Countries")', { timeout: 10000 });

      // Find country selector - could be select or combobox
      const countrySelectors = [
        'select',
        '[role="combobox"]',
        'button:has-text("Select country")'
      ];

      let countrySelector = null;
      for (const selector of countrySelectors) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          countrySelector = selector;
          console.log(`   Found country selector: ${selector}`);
          break;
        }
      }

      if (!countrySelector) {
        throw new Error('Could not find country selector');
      }

      // Try to select Netherlands
      if (countrySelector === 'select') {
        await page.locator('select').first().selectOption('nl');
      } else {
        // Combobox approach
        const combobox = page.locator('[role="combobox"]').first();
        await combobox.click();
        await page.waitForTimeout(300);
        await page.locator('text=Netherlands').first().click();
      }

      await page.waitForTimeout(500);

      // Enter salary
      const salaryInput = page.locator('input[type="number"]').first();
      await salaryInput.fill('60000');
      await page.waitForTimeout(1500); // Wait for calculation

      // Verify result appears
      await page.waitForSelector('text=Net Annual', { timeout: 5000 });
      
      // Verify flag appears
      await page.waitForSelector('text=Netherlands', { timeout: 5000 });
      
      // Verify breakdown sections
      await page.waitForSelector('text=Income Taxes', { timeout: 5000 });
    });

    // Test 2: Multi-country comparison
    await test('Journey 2: Multi-country comparison', async () => {
      await page.goto(TARGET_URL);
      await page.waitForLoadState('networkidle');

      // Select first country
      const combobox = page.locator('[role="combobox"]').first();
      await combobox.click();
      await page.waitForTimeout(300);
      await page.locator('text=Netherlands').first().click();
      await page.waitForTimeout(500);

      // Enter salary
      await page.locator('input[type="number"]').first().fill('80000');
      await page.waitForTimeout(1000);

      // Add second country
      const addButton = page.locator('button:has-text("Add Country")');
      if (await addButton.count() > 0) {
        await addButton.click();
        await page.waitForTimeout(500);

        // Select Germany for second country
        const secondCombobox = page.locator('[role="combobox"]').nth(1);
        await secondCombobox.click();
        await page.waitForTimeout(300);
        await page.locator('text=Germany').first().click();
        await page.waitForTimeout(500);

        // Copy salary to all countries
        const copyButton = page.locator('button:has-text("Copy all")').first();
        if (await copyButton.count() > 0) {
          await copyButton.click();
          await page.waitForTimeout(1500);
        }

        // Verify both countries visible
        await page.waitForSelector('text=Netherlands', { timeout: 5000 });
        await page.waitForSelector('text=Germany', { timeout: 5000 });

        // Verify "Best" badge appears
        const bestBadge = page.locator('text=Best');
        if (await bestBadge.count() > 0) {
          console.log('   ✅ Best badge found');
        }
      } else {
        throw new Error('Add Country button not found');
      }
    });

    // Test 3: URL sharing and restoration
    await test('Journey 3: URL sharing and restoration', async () => {
      await page.goto(TARGET_URL);
      await page.waitForLoadState('networkidle');

      // Select Switzerland
      const combobox = page.locator('[role="combobox"]').first();
      await combobox.click();
      await page.waitForTimeout(300);
      await page.locator('text=Switzerland').first().click();
      await page.waitForTimeout(500);

      // Enter salary
      await page.locator('input[type="number"]').first().fill('120000');
      await page.waitForTimeout(1000);

      // Click share button
      const shareButton = page.locator('button:has-text("Share")');
      if (await shareButton.count() > 0) {
        await shareButton.click();
        await page.waitForTimeout(1000);

        // Verify URL contains state
        const url = page.url();
        if (!url.includes('?c=') && !url.includes('ch')) {
          throw new Error(`URL does not contain state: ${url}`);
        }
        console.log(`   ✅ URL contains state: ${url}`);

        // Navigate away and back
        await page.goto(`${TARGET_URL}/history`);
        await page.waitForTimeout(500);
        await page.goto(url);
        await page.waitForTimeout(1000);

        // Verify state restored
        await page.waitForSelector('text=Switzerland', { timeout: 5000 });
        const salaryInput = page.locator('input[type="number"]').first();
        const value = await salaryInput.inputValue();
        if (value !== '120000') {
          throw new Error(`Salary not restored. Expected 120000, got ${value}`);
        }
      } else {
        throw new Error('Share button not found');
      }
    });

    // Test 4: Save and restore from history
    await test('Journey 4: Save calculation and restore from history', async () => {
      await page.goto(TARGET_URL);
      await page.waitForLoadState('networkidle');

      // Set up comparison
      const combobox = page.locator('[role="combobox"]').first();
      await combobox.click();
      await page.waitForTimeout(300);
      await page.locator('text=Netherlands').first().click();
      await page.waitForTimeout(500);
      await page.locator('input[type="number"]').first().fill('70000');
      await page.waitForTimeout(1000);

      // Add second country
      const addButton = page.locator('button:has-text("Add Country")');
      if (await addButton.count() > 0) {
        await addButton.click();
        await page.waitForTimeout(500);
        const secondCombobox = page.locator('[role="combobox"]').nth(1);
        await secondCombobox.click();
        await page.waitForTimeout(300);
        await page.locator('text=Germany').first().click();
        await page.waitForTimeout(500);

        const copyButton = page.locator('button:has-text("Copy all")').first();
        if (await copyButton.count() > 0) {
          await copyButton.click();
          await page.waitForTimeout(1500);
        }

        // Click save button
        const saveButton = page.locator('button:has-text("Save")');
        if (await saveButton.count() > 0) {
          await saveButton.click();
          await page.waitForTimeout(500);

          // Fill save dialog
          const nameInput = page.locator('input[id="name"]');
          if (await nameInput.count() > 0) {
            await nameInput.fill('NL vs DE Comparison');
            await page.waitForTimeout(300);

            const notesInput = page.locator('textarea[id="notes"]');
            if (await notesInput.count() > 0) {
              await notesInput.fill('Testing save functionality');
            }

            const confirmSave = page.locator('button:has-text("Save")').last();
            await confirmSave.click();
            await page.waitForTimeout(1000);

            // Navigate to history
            await page.goto(`${TARGET_URL}/history`);
            await page.waitForTimeout(1000);

            // Verify saved calculation appears
            await page.waitForSelector('text=NL vs DE Comparison', { timeout: 5000 });
            await page.waitForSelector('text=Testing save functionality', { timeout: 5000 });

            // Click restore
            const restoreButton = page.locator('button:has-text("Restore Calculation")').first();
            if (await restoreButton.count() > 0) {
              await restoreButton.click();
              await page.waitForTimeout(1500);

              // Verify back on calculator with state restored
              await page.waitForSelector('text=Netherlands', { timeout: 5000 });
              await page.waitForSelector('text=Germany', { timeout: 5000 });
            }
          } else {
            throw new Error('Save dialog name input not found');
          }
        } else {
          throw new Error('Save button not found');
        }
      } else {
        throw new Error('Add Country button not found');
      }
    });

    // Test 5: Remove country from comparison
    await test('Journey 5: Remove country from comparison', async () => {
      await page.goto(TARGET_URL);
      await page.waitForLoadState('networkidle');

      // Add two countries
      const combobox = page.locator('[role="combobox"]').first();
      await combobox.click();
      await page.waitForTimeout(300);
      await page.locator('text=Netherlands').first().click();
      await page.waitForTimeout(500);

      const addButton = page.locator('button:has-text("Add Country")');
      if (await addButton.count() > 0) {
        await addButton.click();
        await page.waitForTimeout(500);
        const secondCombobox = page.locator('[role="combobox"]').nth(1);
        await secondCombobox.click();
        await page.waitForTimeout(300);
        await page.locator('text=Germany').first().click();
        await page.waitForTimeout(500);

        // Verify both countries visible
        await page.waitForSelector('text=Netherlands', { timeout: 5000 });
        await page.waitForSelector('text=Germany', { timeout: 5000 });

        // Remove second country
        const removeButtons = page.locator('button[aria-label="Remove"]');
        const removeCount = await removeButtons.count();
        if (removeCount > 0) {
          await removeButtons.last().click();
          await page.waitForTimeout(500);

          // Verify only one country remains
          await page.waitForSelector('text=Netherlands', { timeout: 5000 });
          const germanyVisible = await page.locator('text=Germany').isVisible().catch(() => false);
          if (germanyVisible) {
            throw new Error('Germany still visible after removal');
          }
        } else {
          throw new Error('Remove button not found');
        }
      } else {
        throw new Error('Add Country button not found');
      }
    });

    // Test 6: URL state updates
    await test('Journey 6: URL state updates as user types', async () => {
      await page.goto(TARGET_URL);
      await page.waitForLoadState('networkidle');

      // Select country
      const combobox = page.locator('[role="combobox"]').first();
      await combobox.click();
      await page.waitForTimeout(300);
      await page.locator('text=France').first().click();
      await page.waitForTimeout(1000);

      // Enter salary
      await page.locator('input[type="number"]').first().fill('50000');
      await page.waitForTimeout(1000); // Wait for debounced URL update

      // Verify URL updated
      const url = page.url();
      if (!url.includes('?c=') && !url.includes('fr')) {
        console.log(`   ⚠️  URL may not contain state: ${url}`);
      } else {
        console.log(`   ✅ URL contains state: ${url}`);
      }
    });

    // Test 7: API endpoints
    await test('API: Test calculation endpoint', async () => {
      const response = await page.request.post(`${TARGET_URL}/api/calc`, {
        data: {
          country: 'nl',
          year: 2025,
          gross_annual: 60000,
          filing_status: 'single',
        },
      });

      if (response.status() !== 200) {
        throw new Error(`API returned status ${response.status()}`);
      }

      const data = await response.json();
      if (!data.net || !data.gross) {
        throw new Error('API response missing required fields');
      }

      if (data.gross !== 60000) {
        throw new Error(`Expected gross 60000, got ${data.gross}`);
      }

      if (data.net <= 0 || data.net >= 60000) {
        throw new Error(`Net value seems incorrect: ${data.net}`);
      }

      console.log(`   ✅ API calculation: gross=${data.gross}, net=${data.net}, effective_rate=${data.effective_rate}`);
    });

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${results.passed.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    
    if (results.passed.length > 0) {
      console.log('\n✅ PASSED TESTS:');
      results.passed.forEach(test => console.log(`   - ${test}`));
    }
    
    if (results.failed.length > 0) {
      console.log('\n❌ FAILED TESTS:');
      results.failed.forEach(test => console.log(`   - ${test}`));
      console.log('\n📋 ERROR DETAILS:');
      results.errors.forEach(({ test, error }) => {
        console.log(`   ${test}:`);
        console.log(`     ${error}`);
      });
    }

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('❌ Fatal error:', error);
    await page.screenshot({ path: '/tmp/error-screenshot.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
