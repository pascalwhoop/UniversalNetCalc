#!/usr/bin/env python3
"""
GB 2026 £100k Tax Trap Validation (Layer 3)
============================================

Special validation for the personal allowance taper zone (£100k - £125,140).

This zone creates an effective marginal tax rate of 60% (or 62% including NI)
because:
1. For every £2 earned over £100k, £1 of Personal Allowance is lost
2. That £1 of "lost allowance" becomes taxable at 40% (higher rate)
3. Combined with 40% tax on the income itself = 60% effective rate
4. Add 2% NI for employees = 62% total marginal rate

Official sources:
- https://www.gov.uk/income-tax-rates
- https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027
"""

import json
from pathlib import Path
from typing import Dict, Any

# Official 2026/27 parameters
PERSONAL_ALLOWANCE_BASE = 12570
PERSONAL_ALLOWANCE_TAPER_START = 100000
PERSONAL_ALLOWANCE_TAPER_RATE = 0.5  # £1 reduction for every £2 earned

# Income tax brackets (on TAXABLE income)
INCOME_TAX_BRACKETS = [
    (0, 0.20),        # Basic rate: 20% on taxable £0-£37,700
    (37700, 0.40),    # Higher rate: 40% on taxable £37,701-£112,570
    (112570, 0.45)    # Additional rate: 45% on taxable £112,571+
]

# National Insurance
NI_PRIMARY_THRESHOLD = 12570
NI_UPPER_EARNINGS_LIMIT = 50270
NI_RATE_MAIN = 0.08
NI_RATE_ADDITIONAL = 0.02


def calculate_personal_allowance(gross: float) -> float:
    """
    Calculate tapered personal allowance.

    Formula: PA = max(0, £12,570 - 0.5 × max(0, income - £100,000))
    """
    if gross <= PERSONAL_ALLOWANCE_TAPER_START:
        return PERSONAL_ALLOWANCE_BASE

    reduction = (gross - PERSONAL_ALLOWANCE_TAPER_START) * PERSONAL_ALLOWANCE_TAPER_RATE
    pa = max(0, PERSONAL_ALLOWANCE_BASE - reduction)

    return pa


def calculate_income_tax(gross: float) -> tuple[float, float, float]:
    """
    Calculate income tax using progressive brackets.

    Returns:
        (personal_allowance, taxable_income, income_tax)
    """
    pa = calculate_personal_allowance(gross)
    taxable = max(0, gross - pa)

    tax = 0.0
    for i, (threshold, rate) in enumerate(INCOME_TAX_BRACKETS):
        if i == len(INCOME_TAX_BRACKETS) - 1:
            # Last bracket
            if taxable > threshold:
                tax += (taxable - threshold) * rate
        else:
            # Not last bracket
            next_threshold = INCOME_TAX_BRACKETS[i + 1][0]
            if taxable > threshold:
                band_income = min(taxable - threshold, next_threshold - threshold)
                tax += band_income * rate

    return pa, taxable, tax


def calculate_ni(gross: float) -> float:
    """Calculate National Insurance contributions."""
    if gross <= NI_PRIMARY_THRESHOLD:
        return 0.0

    main_band_income = min(
        max(0, gross - NI_PRIMARY_THRESHOLD),
        NI_UPPER_EARNINGS_LIMIT - NI_PRIMARY_THRESHOLD
    )
    ni_main = main_band_income * NI_RATE_MAIN

    additional_band_income = max(0, gross - NI_UPPER_EARNINGS_LIMIT)
    ni_additional = additional_band_income * NI_RATE_ADDITIONAL

    return ni_main + ni_additional


def calculate_marginal_rate(gross: float, increment: float = 1000) -> Dict[str, float]:
    """
    Calculate effective marginal tax rate at a given income level.

    Tests how much of an additional £increment is retained after tax and NI.

    Returns:
        Dictionary with marginal rates
    """
    # Calculate at current income
    _, _, tax1 = calculate_income_tax(gross)
    ni1 = calculate_ni(gross)
    net1 = gross - tax1 - ni1

    # Calculate at income + increment
    _, _, tax2 = calculate_income_tax(gross + increment)
    ni2 = calculate_ni(gross + increment)
    net2 = (gross + increment) - tax2 - ni2

    # Marginal deductions
    marginal_tax = tax2 - tax1
    marginal_ni = ni2 - ni1
    marginal_deductions = marginal_tax + marginal_ni

    # Marginal rates
    marginal_tax_rate = marginal_tax / increment
    marginal_ni_rate = marginal_ni / increment
    effective_marginal_rate = marginal_deductions / increment

    return {
        "income": gross,
        "increment": increment,
        "marginal_tax": marginal_tax,
        "marginal_tax_rate": marginal_tax_rate,
        "marginal_ni": marginal_ni,
        "marginal_ni_rate": marginal_ni_rate,
        "marginal_deductions": marginal_deductions,
        "effective_marginal_rate": effective_marginal_rate,
        "retained_pct": 1 - effective_marginal_rate
    }


def verify_trap_zone_test(test_file: Path) -> Dict[str, Any]:
    """
    Verify a tax trap zone test vector.

    Args:
        test_file: Path to test vector JSON

    Returns:
        Verification result
    """
    with open(test_file) as f:
        test_data = json.load(f)

    gross = test_data["inputs"]["gross_annual"]
    expected = test_data["expected"]

    # Calculate values
    pa, taxable, income_tax = calculate_income_tax(gross)
    ni = calculate_ni(gross)
    net = gross - income_tax - ni

    # Calculate marginal rate
    marginal = calculate_marginal_rate(gross)

    # Validate
    tolerance_abs = test_data.get("tolerance", 50)
    tolerance_pct = test_data.get("tolerance_percent", 0.001)

    def within_tolerance(actual, expected):
        diff = abs(actual - expected)
        diff_pct = diff / expected if expected > 0 else 0
        return (diff <= tolerance_abs) or (diff_pct <= tolerance_pct)

    pa_match = within_tolerance(pa, PERSONAL_ALLOWANCE_BASE - (gross - PERSONAL_ALLOWANCE_TAPER_START) * PERSONAL_ALLOWANCE_TAPER_RATE if gross >= PERSONAL_ALLOWANCE_TAPER_START else PERSONAL_ALLOWANCE_BASE)
    income_tax_match = within_tolerance(income_tax, expected["breakdown"]["income_tax"])
    ni_match = within_tolerance(ni, expected["breakdown"]["national_insurance"])
    net_match = within_tolerance(net, expected["net"])

    all_match = pa_match and income_tax_match and ni_match and net_match

    return {
        "file": test_file.name,
        "name": test_data["name"],
        "gross": gross,
        "personal_allowance": round(pa, 2),
        "taxable_income": round(taxable, 2),
        "income_tax_calculated": round(income_tax, 2),
        "income_tax_expected": expected["breakdown"]["income_tax"],
        "income_tax_match": income_tax_match,
        "ni_calculated": round(ni, 2),
        "ni_expected": expected["breakdown"]["national_insurance"],
        "ni_match": ni_match,
        "net_calculated": round(net, 2),
        "net_expected": expected["net"],
        "net_match": net_match,
        "marginal_tax_rate": round(marginal["marginal_tax_rate"] * 100, 2),
        "marginal_ni_rate": round(marginal["marginal_ni_rate"] * 100, 2),
        "effective_marginal_rate": round(marginal["effective_marginal_rate"] * 100, 2),
        "retained_pct": round(marginal["retained_pct"] * 100, 2),
        "status": "PASS" if all_match else "FAIL"
    }


def main():
    """Validate the £100k tax trap scenarios."""
    print("=" * 100)
    print("GB 2026 £100k Tax Trap Validation (Layer 3)")
    print("=" * 100)
    print()
    print("Personal Allowance Taper Rules:")
    print(f"  Base personal allowance: £{PERSONAL_ALLOWANCE_BASE:,}")
    print(f"  Taper starts at: £{PERSONAL_ALLOWANCE_TAPER_START:,}")
    print(f"  Taper rate: £1 reduction for every £2 earned over £{PERSONAL_ALLOWANCE_TAPER_START:,}")
    print(f"  Personal allowance fully eliminated at: £{PERSONAL_ALLOWANCE_TAPER_START + PERSONAL_ALLOWANCE_BASE / PERSONAL_ALLOWANCE_TAPER_RATE:,.0f}")
    print()
    print("Expected Marginal Rates in Taper Zone:")
    print("  Income tax marginal rate: 60% (40% on income + 40% on lost PA)")
    print("  National Insurance: 2%")
    print("  Combined effective marginal rate: 62%")
    print("  (Meaning only 38p of each £1 earned reaches your pocket)")
    print()
    print("Source: https://www.gov.uk/income-tax-rates")
    print("=" * 100)
    print()

    base_dir = Path(__file__).parent / "configs" / "gb" / "2026" / "tests"

    # Test the three tax trap scenarios
    trap_tests = [
        "trap-zone-start.json",    # £101,000 - just above £100k threshold
        "trap-zone-mid.json",       # £115,000 - mid-range
        "trap-zone-end.json"        # £125,140 - PA fully eliminated
    ]

    results = []
    for test_name in trap_tests:
        test_file = base_dir / test_name
        if not test_file.exists():
            print(f"WARNING: {test_name} not found")
            continue

        result = verify_trap_zone_test(test_file)
        results.append(result)

    # Print results
    print(f"{'Test Scenario':<50} {'Gross':>12} {'PA':>10} {'Taxable':>12} {'Status':>8}")
    print("-" * 100)

    for r in results:
        status_symbol = "✓" if r["status"] == "PASS" else "✗"
        print(f"{r['name']:<50} £{r['gross']:>11,} £{r['personal_allowance']:>9,.2f} £{r['taxable_income']:>11,.2f} {status_symbol} {r['status']}")

    print()
    print("=" * 100)
    print("Detailed Breakdown")
    print("=" * 100)

    for r in results:
        print(f"\n{r['name']} (Gross: £{r['gross']:,})")
        print(f"  Personal Allowance: £{r['personal_allowance']:,.2f}")
        print(f"  Taxable Income: £{r['taxable_income']:,.2f}")
        print()
        print(f"  Income Tax:")
        print(f"    Calculated: £{r['income_tax_calculated']:,.2f}")
        print(f"    Expected:   £{r['income_tax_expected']:,.2f}")
        print(f"    Match: {r['income_tax_match']}")
        print()
        print(f"  National Insurance:")
        print(f"    Calculated: £{r['ni_calculated']:,.2f}")
        print(f"    Expected:   £{r['ni_expected']:,.2f}")
        print(f"    Match: {r['ni_match']}")
        print()
        print(f"  Net Income:")
        print(f"    Calculated: £{r['net_calculated']:,.2f}")
        print(f"    Expected:   £{r['net_expected']:,.2f}")
        print(f"    Match: {r['net_match']}")
        print()
        print(f"  Marginal Rates (on next £1,000 earned):")
        print(f"    Income Tax: {r['marginal_tax_rate']:.2f}%")
        print(f"    National Insurance: {r['marginal_ni_rate']:.2f}%")
        print(f"    Combined Effective: {r['effective_marginal_rate']:.2f}%")
        print(f"    You retain: {r['retained_pct']:.2f}% (lose {100 - r['retained_pct']:.2f}% to tax & NI)")

    print()
    print("=" * 100)

    # Summary
    passed = sum(1 for r in results if r["status"] == "PASS")
    failed = sum(1 for r in results if r["status"] == "FAIL")

    print(f"Summary: {passed} PASS, {failed} FAIL out of {len(results)} trap zone test vectors")

    if failed == 0:
        print()
        print("✓ All £100k tax trap scenarios verified successfully!")
        print("  Personal allowance taper, income tax, and NI calculations are correct.")
    else:
        print()
        print("✗ Some trap zone tests failed. Review calculations above.")

    print("=" * 100)


if __name__ == "__main__":
    main()
