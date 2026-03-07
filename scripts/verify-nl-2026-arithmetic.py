#!/usr/bin/env python3
"""
Arithmetic verification of Netherlands 2026 tax calculations.

This script implements the official 2026 Dutch tax formulas to verify:
- Income tax brackets (Box 1)
- General tax credit (Algemene heffingskorting)
- Labour tax credit (Arbeidskorting)
- Mortgage interest deductions with rate cap
- Healthcare deductions
- Pension deductions

All formulas are based on official Belastingdienst sources.

Sources:
- Income tax: https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/heffingskortingen_boxen_tarieven/boxen_en_tarieven/box_1/box_1
- Tax credits: https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/heffingskortingen_boxen_tarieven/heffingskortingen/
"""

import json
from typing import Dict, Any
from pathlib import Path


# Official 2026 tax parameters
INCOME_TAX_BRACKETS = [
    {"threshold": 0, "rate": 0.3575},
    {"threshold": 38883, "rate": 0.3756},
    {"threshold": 78426, "rate": 0.4950},
]

GENERAL_CREDIT_MAX = 3115
GENERAL_CREDIT_PHASEOUT_START = 29736
GENERAL_CREDIT_PHASEOUT_RATE = 0.06398

LABOUR_CREDIT_BRACKETS = [
    {"threshold": 0, "max": 11965, "rate": 0.08324, "base": 0},
    {"threshold": 11965, "max": 25845, "rate": 0.31009, "base": 996},
    {"threshold": 25845, "max": 45592, "rate": 0.01950, "base": 5300},
    {"threshold": 45592, "max": 132920, "rate": -0.06510, "base": 5685},
    {"threshold": 132920, "max": 999999999, "rate": 0, "base": 0},
]

TOP_BRACKET_THRESHOLD = 78426
MORTGAGE_RATE_CAP = 0.3756  # Second bracket rate
MORTGAGE_MAX_YEARS = 30
CURRENT_YEAR = 2026

HEALTHCARE_THRESHOLD_FIXED = 132
HEALTHCARE_THRESHOLD_RATE = 0.0165
HEALTHCARE_THRESHOLD_INCOME_START = 8625


def calculate_bracket_tax(taxable_income: float, brackets: list) -> float:
    """Calculate tax using progressive bracket system."""
    tax = 0.0
    for i, bracket in enumerate(brackets):
        threshold = bracket["threshold"]
        rate = bracket["rate"]

        # Find the upper limit for this bracket
        if i < len(brackets) - 1:
            next_threshold = brackets[i + 1]["threshold"]
            taxable_in_bracket = min(max(0, taxable_income - threshold), next_threshold - threshold)
        else:
            taxable_in_bracket = max(0, taxable_income - threshold)

        tax += taxable_in_bracket * rate

    return tax


def calculate_general_credit(taxable_income: float) -> float:
    """Calculate algemene heffingskorting with phaseout."""
    if taxable_income <= GENERAL_CREDIT_PHASEOUT_START:
        return GENERAL_CREDIT_MAX

    reduction = (taxable_income - GENERAL_CREDIT_PHASEOUT_START) * GENERAL_CREDIT_PHASEOUT_RATE
    return max(0, GENERAL_CREDIT_MAX - reduction)


def calculate_labour_credit(gross_income: float) -> float:
    """Calculate arbeidskorting using complex bracket structure."""
    for bracket in LABOUR_CREDIT_BRACKETS:
        if gross_income <= bracket["max"]:
            if gross_income <= bracket["threshold"]:
                return 0

            credit = bracket["base"] + (gross_income - bracket["threshold"]) * bracket["rate"]
            return max(0, credit)

    return 0


def calculate_mortgage_deduction(
    gross_annual: float,
    mortgage_interest: float,
    mortgage_start_year: int
) -> tuple[float, float]:
    """
    Calculate mortgage interest deduction and rate cap correction.

    Returns:
        (deduction_amount, rate_cap_correction)
    """
    if mortgage_interest <= 0 or mortgage_start_year <= 0:
        return 0, 0

    # Check 30-year eligibility
    years_elapsed = CURRENT_YEAR - mortgage_start_year
    if years_elapsed > MORTGAGE_MAX_YEARS:
        return 0, 0

    deduction = mortgage_interest

    # Calculate rate cap correction for top-bracket earners
    gross_above_top = max(0, gross_annual - TOP_BRACKET_THRESHOLD)
    mortgage_in_top_bracket = min(deduction, gross_above_top)

    # Clawback excess benefit: (49.5% - 37.56%) = 11.94%
    rate_cap_correction = mortgage_in_top_bracket * (0.4950 - MORTGAGE_RATE_CAP)

    return deduction, rate_cap_correction


def calculate_healthcare_deduction(gross_annual: float, healthcare_expenses: float) -> float:
    """Calculate healthcare cost deduction (specifieke zorgkosten)."""
    if healthcare_expenses <= 0:
        return 0

    # Calculate threshold
    variable_threshold = max(0, gross_annual - HEALTHCARE_THRESHOLD_INCOME_START) * HEALTHCARE_THRESHOLD_RATE
    total_threshold = HEALTHCARE_THRESHOLD_FIXED + variable_threshold

    # Only expenses above threshold are deductible
    return max(0, healthcare_expenses - total_threshold)


def calculate_pension_deduction(pension_contributions: float, jaarruimte_available: float) -> float:
    """Calculate pension contribution deduction (capped by jaarruimte)."""
    if pension_contributions <= 0:
        return 0

    if jaarruimte_available > 0:
        return min(pension_contributions, jaarruimte_available)

    return pension_contributions


def verify_test_vector(test_data: Dict[str, Any], variant: str = "base") -> Dict[str, Any]:
    """Verify a single test vector against official formulas."""
    inputs = test_data["inputs"]
    expected = test_data["expected"]

    gross_annual = inputs["gross_annual"]
    mortgage_interest = inputs.get("mortgage_interest_paid", 0)
    mortgage_start_year = inputs.get("mortgage_start_year", 0)
    pension_contributions = inputs.get("pension_contributions", 0)
    jaarruimte_available = inputs.get("jaarruimte_available", 0)
    healthcare_expenses = inputs.get("healthcare_expenses", 0)

    # Apply 30% ruling if variant
    if variant == "30-ruling":
        taxable_base = gross_annual * 0.70
    else:
        taxable_base = gross_annual

    # Calculate deductions
    mortgage_deduction, mortgage_rate_cap_correction = calculate_mortgage_deduction(
        gross_annual, mortgage_interest, mortgage_start_year
    )
    healthcare_deduction = calculate_healthcare_deduction(gross_annual, healthcare_expenses)
    pension_deduction = calculate_pension_deduction(pension_contributions, jaarruimte_available)

    total_deductions = mortgage_deduction + healthcare_deduction + pension_deduction

    # Taxable income
    taxable_income = taxable_base - total_deductions

    # Income tax
    income_tax = calculate_bracket_tax(taxable_income, INCOME_TAX_BRACKETS)

    # Tax credits (based on taxable income, except labour credit uses gross for 30% ruling)
    general_credit = calculate_general_credit(taxable_income)

    # Labour credit: for 30% ruling, use gross income, not taxable base
    labour_credit = calculate_labour_credit(gross_annual)

    total_credits = general_credit + labour_credit

    # Total tax
    total_tax_before_credits = income_tax + mortgage_rate_cap_correction
    total_tax = max(0, total_tax_before_credits - total_credits)

    # Net income
    net_annual = gross_annual - total_tax
    effective_rate = (gross_annual - net_annual) / gross_annual if gross_annual > 0 else 0

    # Compare with expected
    net_diff = abs(net_annual - expected["net"])
    rate_diff = abs(effective_rate - expected["effective_rate"])

    tolerance = test_data.get("tolerance", 10)
    tolerance_percent = test_data.get("tolerance_percent", 0.005)

    net_pass = net_diff <= tolerance
    rate_pass = rate_diff <= tolerance_percent

    return {
        "name": test_data["name"],
        "inputs": inputs,
        "calculated": {
            "taxable_income": round(taxable_income, 2),
            "income_tax": round(income_tax, 2),
            "general_credit": round(general_credit, 2),
            "labour_credit": round(labour_credit, 2),
            "total_tax": round(total_tax, 2),
            "net": round(net_annual, 2),
            "effective_rate": round(effective_rate, 5),
        },
        "expected": expected,
        "differences": {
            "net": round(net_diff, 2),
            "effective_rate": round(rate_diff, 5),
        },
        "passed": net_pass and rate_pass,
        "net_pass": net_pass,
        "rate_pass": rate_pass,
    }


def main():
    """Run arithmetic verification on all NL 2026 test vectors."""
    base_path = Path(__file__).parent.parent / "configs" / "nl" / "2026" / "tests"

    test_files = {
        "base": [
            "single-low-income.json",
            "single-median-income.json",
            "single-high-income.json",
            "deduction-baseline.json",
            "deduction-healthcare.json",
            "deduction-mortgage.json",
            "deduction-mortgage-rate-cap.json",
            "deduction-pension-capped.json",
        ],
        "30-ruling": [
            "30-ruling-median-income.json",
            "30-ruling-high-income.json",
        ],
    }

    results = []
    all_passed = True

    for variant, files in test_files.items():
        print(f"\n{'='*80}")
        print(f"Verifying {variant} test vectors")
        print(f"{'='*80}\n")

        for filename in files:
            filepath = base_path / filename

            if not filepath.exists():
                print(f"❌ File not found: {filename}")
                all_passed = False
                continue

            with open(filepath, "r") as f:
                test_data = json.load(f)

            result = verify_test_vector(test_data, variant)
            results.append(result)

            # Print result
            status = "✅ PASS" if result["passed"] else "❌ FAIL"
            print(f"{status} {result['name']}")
            print(f"  Gross: €{result['inputs']['gross_annual']:,.0f}")
            print(f"  Expected net: €{result['expected']['net']:,.0f}")
            print(f"  Calculated net: €{result['calculated']['net']:,.0f}")
            print(f"  Difference: €{result['differences']['net']:.2f}")

            if not result["passed"]:
                print(f"  ⚠️  Net diff: €{result['differences']['net']:.2f}")
                print(f"  ⚠️  Rate diff: {result['differences']['effective_rate']:.5f}")
                print(f"  Details:")
                print(f"    Taxable income: €{result['calculated']['taxable_income']:,.2f}")
                print(f"    Income tax: €{result['calculated']['income_tax']:,.2f}")
                print(f"    General credit: €{result['calculated']['general_credit']:,.2f}")
                print(f"    Labour credit: €{result['calculated']['labour_credit']:,.2f}")
                print(f"    Total tax: €{result['calculated']['total_tax']:,.2f}")
                all_passed = False

            print()

    # Summary
    print(f"\n{'='*80}")
    print("SUMMARY")
    print(f"{'='*80}\n")

    passed_count = sum(1 for r in results if r["passed"])
    total_count = len(results)

    print(f"Total tests: {total_count}")
    print(f"Passed: {passed_count}")
    print(f"Failed: {total_count - passed_count}")

    if all_passed:
        print("\n✅ All tests passed arithmetic verification!")
    else:
        print("\n❌ Some tests failed - see details above")
        return 1

    return 0


if __name__ == "__main__":
    exit(main())
