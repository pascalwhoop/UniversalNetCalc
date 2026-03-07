#!/usr/bin/env node
import { CalculationEngine } from '../packages/engine/src/engine.js';
import { ConfigLoader } from '../packages/engine/src/config-loader.js';

const loader = new ConfigLoader();

// Test single-low-income-geneva
console.log('\n' + '='.repeat(80));
console.log('Testing: Single filer at low income in Geneva (CHF 45,000)');
console.log('='.repeat(80));

const config1 = await loader.loadConfig('ch', 2026);
const engine1 = new CalculationEngine(config1);

const result1 = engine1.calculate({
  gross_annual: 45000,
  filing_status: 'single',
  region_level_1: 'geneva'
});

console.log('\nCalculation result:');
console.log(`Net: CHF ${result1.net.toFixed(2)}`);
console.log(`\nBreakdown:`);
console.log(`  Federal tax:       CHF ${result1.breakdown.federal_income_tax.toFixed(2)}`);
console.log(`  Cantonal tax:      CHF ${result1.breakdown.cantonal_municipal_tax.toFixed(2)}`);
console.log(`  AHV/IV/EO:         CHF ${result1.breakdown.avs_ai_apg_contribution.toFixed(2)}`);
console.log(`  ALV:               CHF ${result1.breakdown.unemployment_contribution.toFixed(2)}`);

console.log(`\nTotal deductions:  CHF ${(45000 - result1.net).toFixed(2)}`);

// Log context nodes to see intermediate calculations
console.log('\nIntermediate calculations:');
console.log(`  unemployment_base: CHF ${engine1.context.nodes.unemployment_base?.toFixed(2)}`);
console.log(`  cantonal_brackets: ${JSON.stringify(engine1.context.nodes.cantonal_brackets, null, 2)}`);


// Test married-high-income-zug
console.log('\n' + '='.repeat(80));
console.log('Testing: Married filers at high income in Zug (CHF 150,000)');
console.log('='.repeat(80));

const config2 = await loader.loadConfig('ch', 2026);
const engine2 = new CalculationEngine(config2);

const result2 = engine2.calculate({
  gross_annual: 150000,
  filing_status: 'married',
  region_level_1: 'zug'
});

console.log('\nCalculation result:');
console.log(`Net: CHF ${result2.net.toFixed(2)}`);
console.log(`\nBreakdown:`);
console.log(`  Federal tax:       CHF ${result2.breakdown.federal_income_tax.toFixed(2)}`);
console.log(`  Cantonal tax:      CHF ${result2.breakdown.cantonal_municipal_tax.toFixed(2)}`);
console.log(`  AHV/IV/EO:         CHF ${result2.breakdown.avs_ai_apg_contribution.toFixed(2)}`);
console.log(`  ALV:               CHF ${result2.breakdown.unemployment_contribution.toFixed(2)}`);

console.log(`\nTotal deductions:  CHF ${(150000 - result2.net).toFixed(2)}`);
