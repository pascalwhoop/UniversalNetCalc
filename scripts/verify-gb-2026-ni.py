#!/usr/bin/env python3
"""
GB 2026 National Insurance Arithmetic Verification
===================================================

Verifies Class 1 Employee National Insurance contributions for all 13 test vectors
using official HMRC rates for 2026/27.

Official rates (frozen from 2025/26):
- Primary threshold: £12,570
- Upper earnings limit: £50,270
- Main rate: 8% (on income between thresholds)
- Additional rate: 2% (on income above upper limit)

Source: https://www.gov.uk/national-insurance-rates-letters
"""

import json
from pathlib import Path
from typing import Dict, Any

# Official 2026/27 rates
NI_PRIMARY_THRESHOLD = 12570
NI_UPPER_EARNINGS_LIMIT = 50270
NI_RATE_MAIN = 0.08
NI_RATE_ADDITIONAL = 0.02


def calculate_ni(gross_annual: float) -> float:
    """
    Calculate Class 1 Employee National Insurance contributions.

    Formula:
    - £0 - £12,570: 0% (no NI)
    - £12,570 - £50,270: 8%
    - Above £50,270: 2%

    Args:
        gross_annual: Annual gross salary in GBP

    Returns:
        Total National Insurance contribution
    """
    if gross_annual <= NI_PRIMARY_THRESHOLD:
        return 0.0

    # Main band: 8% on income between primary threshold and upper limit
    main_band_income = min(
        max(0, gross_annual - NI_PRIMARY_THRESHOLD),
        NI_UPPER_EARNINGS_LIMIT - NI_PRIMARY_THRESHOLD
    )
    ni_main = main_band_income * NI_RATE_MAIN

    # Additional band: 2% on income above upper limit
    additional_band_income = max(0, gross_annual - NI_UPPER_EARNINGS_LIMIT)
    ni_additional = additional_band_income * NI_RATE_ADDITIONAL

    return round(ni_main + ni_additional, 2)


def verify_test_vector(test_file: Path) -> Dict[str, Any]:
    """
    Verify a single test vector's National Insurance calculation.

    Args:
        test_file: Path to test vector JSON file

    Returns:
        Verification result with status and details
    """
    with open(test_file) as f:
        test_data = json.load(f)

    gross = test_data["inputs"]["gross_annual"]
    expected_ni = test_data["expected"]["breakdown"]["national_insurance"]

    calculated_ni = calculate_ni(gross)

    # Get tolerance (absolute or percentage)
    tolerance_abs = test_data.get("tolerance", 10)
    tolerance_pct = test_data.get("tolerance_percent", 0.005)

    # Check if within tolerance
    diff = abs(calculated_ni - expected_ni)
    diff_pct = diff / expected_ni if expected_ni > 0 else 0

    within_tolerance = (diff <= tolerance_abs) or (diff_pct <= tolerance_pct)

    return {
        "file": test_file.name,
        "name": test_data["name"],
        "gross": gross,
        "expected_ni": expected_ni,
        "calculated_ni": calculated_ni,
        "difference": round(diff, 2),
        "difference_pct": round(diff_pct * 100, 2),
        "status": "PASS" if within_tolerance else "FAIL",
        "within_tolerance": within_tolerance
    }


def main():
    """Run verification for all GB 2026 test vectors."""
    print("=" * 80)
    print("GB 2026 National Insurance Arithmetic Verification")
    print("=" * 80)
    print()
    print("Official HMRC rates for 2026/27:")
    print(f"  Primary threshold: £{NI_PRIMARY_THRESHOLD:,}")
    print(f"  Upper earnings limit: £{NI_UPPER_EARNINGS_LIMIT:,}")
    print(f"  Main rate (£12,570 - £50,270): {NI_RATE_MAIN * 100}%")
    print(f"  Additional rate (above £50,270): {NI_RATE_ADDITIONAL * 100}%")
    print()
    print("Source: https://www.gov.uk/national-insurance-rates-letters")
    print("=" * 80)
    print()

    base_dir = Path(__file__).parent / "configs" / "gb" / "2026" / "tests"
    test_files = sorted(base_dir.glob("*.json"))

    if not test_files:
        print("ERROR: No test files found!")
        return

    results = []
    for test_file in test_files:
        result = verify_test_vector(test_file)
        results.append(result)

    # Print results
    print(f"{'Test Name':<50} {'Gross':>12} {'Expected':>10} {'Calculated':>10} {'Diff':>8} {'Status':>8}")
    print("-" * 110)

    for r in results:
        status_symbol = "✓" if r["status"] == "PASS" else "✗"
        print(f"{r['name']:<50} £{r['gross']:>11,} £{r['expected_ni']:>9,.2f} £{r['calculated_ni']:>9,.2f} "
              f"£{r['difference']:>7,.2f} {status_symbol} {r['status']}")

    print()
    print("=" * 80)

    # Summary
    passed = sum(1 for r in results if r["status"] == "PASS")
    failed = sum(1 for r in results if r["status"] == "FAIL")

    print(f"Summary: {passed} PASS, {failed} FAIL out of {len(results)} test vectors")

    if failed > 0:
        print()
        print("FAILED test vectors:")
        for r in results:
            if r["status"] == "FAIL":
                print(f"  - {r['name']} ({r['file']}): expected £{r['expected_ni']:.2f}, got £{r['calculated_ni']:.2f} (diff: £{r['difference']:.2f}, {r['difference_pct']:.2f}%)")
        print()
        print("Action required: Update expected values in test vectors or investigate calculation differences.")
    else:
        print()
        print("✓ All National Insurance calculations verified successfully!")
        print("  NI contributions match expected values within tolerance.")

    print("=" * 80)


if __name__ == "__main__":
    main()
