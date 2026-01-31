// Script to calculate actual expected values for NL 2025 deduction tests
import { readFile } from 'fs/promises';
import { parse } from 'yaml';
import { join } from 'path';

function evaluateBracketTax(base, brackets) {
  let tax = 0;
  for (let i = 0; i < brackets.length; i++) {
    const bracket = brackets[i];
    const nextThreshold = i + 1 < brackets.length ? brackets[i + 1].threshold : Infinity;

    if (base <= bracket.threshold) break;

    const taxableInBracket = Math.min(base, nextThreshold) - bracket.threshold;
    tax += taxableInBracket * bracket.rate;
  }
  return tax;
}

function evaluateCreditWithPhaseout(amount, phaseout, income) {
  if (!phaseout || !phaseout.start || !phaseout.end || !phaseout.rate) {
    return amount;
  }

  if (income <= phaseout.start) return amount;
  if (income >= phaseout.end) return 0;

  const reduction = (income - phaseout.start) * phaseout.rate;
  return Math.max(0, amount - reduction);
}

function calculateLabourCredit(income, brackets) {
  for (const bracket of brackets) {
    if (income >= bracket.threshold && income <= bracket.max) {
      return bracket.base + (income - bracket.threshold) * bracket.rate;
    }
  }
  return 0;
}

async function main() {
  // Load NL 2025 base config
  const configPath = join(process.cwd(), 'configs/nl/2025/base.yaml');
  const configYaml = await readFile(configPath, 'utf-8');
  const config = parse(configYaml);

  const incomeTaxBrackets = config.parameters.income_tax_brackets;
  const generalCreditMax = config.parameters.general_credit_max;
  const generalCreditPhaseout = {
    start: config.parameters.general_credit_phaseout_start,
    end: config.parameters.general_credit_phaseout_end,
    rate: config.parameters.general_credit_phaseout_rate
  };
  const labourCreditBrackets = config.parameters.labour_credit_brackets;

  console.log('\nNL 2025 Tax Calculation Test Values\n');

  // Test 1: €50,000 with no deductions (baseline)
  {
    const gross = 50000;
    const deductions = 0;
    const taxableIncome = gross - deductions;

    const incomeTax = evaluateBracketTax(taxableIncome, incomeTaxBrackets);
    const generalCredit = evaluateCreditWithPhaseout(
      generalCreditMax,
      generalCreditPhaseout,
      taxableIncome
    );
    const labourCredit = calculateLabourCredit(taxableIncome, labourCreditBrackets);

    const net = gross - incomeTax + generalCredit + labourCredit;
    const effectiveRate = (gross - net) / gross;

    console.log('Test: €50,000 baseline (no deductions)');
    console.log('  Taxable Income:', taxableIncome);
    console.log('  Income Tax:', Math.round(incomeTax));
    console.log('  General Credit:', Math.round(generalCredit));
    console.log('  Labour Credit:', Math.round(labourCredit));
    console.log('  Net:', Math.round(net));
    console.log('  Effective Rate:', effectiveRate.toFixed(5));
    console.log();
  }

  // Test 2: €60,000 with €10,000 mortgage interest (started 2020)
  {
    const gross = 60000;
    const mortgageInterest = 10000;
    const taxableIncome = gross - mortgageInterest;

    const incomeTax = evaluateBracketTax(taxableIncome, incomeTaxBrackets);
    const generalCredit = evaluateCreditWithPhaseout(
      generalCreditMax,
      generalCreditPhaseout,
      taxableIncome
    );
    const labourCredit = calculateLabourCredit(taxableIncome, labourCreditBrackets);

    const net = gross - incomeTax + generalCredit + labourCredit;
    const effectiveRate = (gross - net) / gross;

    console.log('Test: €60,000 with €10,000 mortgage interest deduction');
    console.log('  Taxable Income:', taxableIncome);
    console.log('  Income Tax:', Math.round(incomeTax));
    console.log('  General Credit:', Math.round(generalCredit));
    console.log('  Labour Credit:', Math.round(labourCredit));
    console.log('  Net:', Math.round(net));
    console.log('  Effective Rate:', effectiveRate.toFixed(5));
    console.log();
  }

  // Test 3: €75,000 with €10,000 pension contribution (capped at €6,000 jaarruimte)
  {
    const gross = 75000;
    const pensionDeduction = Math.min(10000, 6000); // Capped at jaarruimte
    const taxableIncome = gross - pensionDeduction;

    const incomeTax = evaluateBracketTax(taxableIncome, incomeTaxBrackets);
    const generalCredit = evaluateCreditWithPhaseout(
      generalCreditMax,
      generalCreditPhaseout,
      taxableIncome
    );
    const labourCredit = calculateLabourCredit(taxableIncome, labourCreditBrackets);

    const net = gross - incomeTax + generalCredit + labourCredit;
    const effectiveRate = (gross - net) / gross;

    console.log('Test: €75,000 with €10,000 pension (capped at €6,000 jaarruimte)');
    console.log('  Pension Deduction Applied:', pensionDeduction);
    console.log('  Taxable Income:', taxableIncome);
    console.log('  Income Tax:', Math.round(incomeTax));
    console.log('  General Credit:', Math.round(generalCredit));
    console.log('  Labour Credit:', Math.round(labourCredit));
    console.log('  Net:', Math.round(net));
    console.log('  Effective Rate:', effectiveRate.toFixed(5));
    console.log();
  }

  // Test 4: €60,000 with €2,000 healthcare costs (threshold ~€1,123)
  {
    const gross = 60000;
    const healthcareExpenses = 2000;
    const threshold = 132 + (gross - 8625) * 0.0165;
    const healthcareDeduction = Math.max(0, healthcareExpenses - threshold);
    const taxableIncome = gross - healthcareDeduction;

    const incomeTax = evaluateBracketTax(taxableIncome, incomeTaxBrackets);
    const generalCredit = evaluateCreditWithPhaseout(
      generalCreditMax,
      generalCreditPhaseout,
      taxableIncome
    );
    const labourCredit = calculateLabourCredit(taxableIncome, labourCreditBrackets);

    const net = gross - incomeTax + generalCredit + labourCredit;
    const effectiveRate = (gross - net) / gross;

    console.log('Test: €60,000 with €2,000 healthcare costs');
    console.log('  Healthcare Threshold:', Math.round(threshold));
    console.log('  Healthcare Deduction Applied:', Math.round(healthcareDeduction));
    console.log('  Taxable Income:', taxableIncome);
    console.log('  Income Tax:', Math.round(incomeTax));
    console.log('  General Credit:', Math.round(generalCredit));
    console.log('  Labour Credit:', Math.round(labourCredit));
    console.log('  Net:', Math.round(net));
    console.log('  Effective Rate:', effectiveRate.toFixed(5));
    console.log();
  }
}

main().catch(console.error);
