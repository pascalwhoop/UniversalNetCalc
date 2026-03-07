#!/usr/bin/env python3
"""
Switzerland 2026 Social Security Arithmetic Verification
=========================================================

Verifies AHV/IV/EO and ALV contributions against official BSV rates.

Official sources:
- AHV/IV/EO: 5.3% employee share (no cap)
  Source: https://www.bsv.admin.ch/bsv/de/home/sozialversicherungen/ahv/grundlagen-gesetze/ahv-beitragssaetze.html
- ALV: 1.1% up to CHF 148,200 cap, then 0.5% above
  Source: https://www.bsv.admin.ch/bsv/de/home/sozialversicherungen/alv/grundlagen-gesetze.html

Test vectors:
1. single-median-zurich: CHF 80,000
2. single-low-income-geneva: CHF 45,000
3. single-high-income-neuchatel: CHF 200,000
4. married-high-income-zug: CHF 150,000
"""

import json
from pathlib import Path
from typing import Dict, Any

# Official rates for 2026 (unchanged from 2025)
AVS_AI_APG_RATE = 0.053  # 5.3% employee share
ALV_RATE_BELOW_CAP = 0.011  # 1.1% up to cap
ALV_RATE_ABOVE_CAP = 0.005  # 0.5% above cap (solidarity contribution)
ALV_CAP = 148200  # CHF 148,200 cap


def calculate_avs_ai_apg(gross_annual: float) -> float:
    """Calculate AHV/IV/EO contribution (5.3% of gross, no cap)."""
    return round(gross_annual * AVS_AI_APG_RATE, 2)


def calculate_alv(gross_annual: float) -> float:
    """Calculate ALV (unemployment insurance) contribution."""
    if gross_annual <= ALV_CAP:
        return round(gross_annual * ALV_RATE_BELOW_CAP, 2)
    else:
        # 1.1% up to cap, then 0.5% above
        below_cap = ALV_CAP * ALV_RATE_BELOW_CAP
        above_cap = (gross_annual - ALV_CAP) * ALV_RATE_ABOVE_CAP
        return round(below_cap + above_cap, 2)


def verify_test_vector(test_file: Path) -> Dict[str, Any]:
    """Verify social security calculations for a single test vector."""
    with open(test_file, 'r') as f:
        test_data = json.load(f)

    gross = test_data['inputs']['gross_annual']
    expected = test_data['expected']['breakdown']

    # Calculate expected values
    calc_avs = calculate_avs_ai_apg(gross)
    calc_alv = calculate_alv(gross)

    # Get expected values from test vector
    exp_avs = expected.get('avs_ai_apg_contribution')
    exp_alv = expected.get('unemployment_contribution')

    # Check if values match (within 1 CHF tolerance for rounding)
    avs_match = abs(calc_avs - exp_avs) <= 1 if exp_avs else False
    alv_match = abs(calc_alv - exp_alv) <= 1 if exp_alv else False

    return {
        'name': test_data['name'],
        'gross': gross,
        'avs_ai_apg': {
            'calculated': calc_avs,
            'expected': exp_avs,
            'match': avs_match,
            'diff': calc_avs - exp_avs if exp_avs else None
        },
        'alv': {
            'calculated': calc_alv,
            'expected': exp_alv,
            'match': alv_match,
            'diff': calc_alv - exp_alv if exp_alv else None
        },
        'total_contributions': {
            'calculated': calc_avs + calc_alv,
            'expected': exp_avs + exp_alv if exp_avs and exp_alv else None
        }
    }


def main():
    """Run verification for all CH 2026 test vectors."""
    test_dir = Path(__file__).parent.parent / 'configs' / 'ch' / '2026' / 'tests'
    test_files = sorted(test_dir.glob('*.json'))

    print("=" * 80)
    print("Switzerland 2026 Social Security Arithmetic Verification")
    print("=" * 80)
    print()
    print("Official rates (2026):")
    print(f"  AHV/IV/EO: {AVS_AI_APG_RATE * 100}% (no cap)")
    print(f"  ALV: {ALV_RATE_BELOW_CAP * 100}% up to CHF {ALV_CAP:,}")
    print(f"  ALV (above cap): {ALV_RATE_ABOVE_CAP * 100}% solidarity contribution")
    print()
    print("=" * 80)
    print()

    all_pass = True
    results = []

    for test_file in test_files:
        result = verify_test_vector(test_file)
        results.append(result)

        print(f"Test: {result['name']}")
        print(f"Gross: CHF {result['gross']:,.2f}")
        print()

        # AHV/IV/EO
        print(f"  AHV/IV/EO (5.3%):")
        print(f"    Calculated: CHF {result['avs_ai_apg']['calculated']:,.2f}")
        print(f"    Expected:   CHF {result['avs_ai_apg']['expected']:,.2f}")
        if result['avs_ai_apg']['match']:
            print(f"    ✅ MATCH")
        else:
            print(f"    ❌ MISMATCH (diff: CHF {result['avs_ai_apg']['diff']:.2f})")
            all_pass = False
        print()

        # ALV
        print(f"  ALV (unemployment):")
        print(f"    Calculated: CHF {result['alv']['calculated']:,.2f}")
        print(f"    Expected:   CHF {result['alv']['expected']:,.2f}")
        if result['alv']['match']:
            print(f"    ✅ MATCH")
        else:
            print(f"    ❌ MISMATCH (diff: CHF {result['alv']['diff']:.2f})")
            all_pass = False
        print()

        # Total
        print(f"  Total social contributions:")
        print(f"    Calculated: CHF {result['total_contributions']['calculated']:,.2f}")
        print(f"    Expected:   CHF {result['total_contributions']['expected']:,.2f}")
        print()
        print("-" * 80)
        print()

    # Summary
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print()

    avs_matches = sum(1 for r in results if r['avs_ai_apg']['match'])
    alv_matches = sum(1 for r in results if r['alv']['match'])
    total_tests = len(results)

    print(f"AHV/IV/EO: {avs_matches}/{total_tests} match")
    print(f"ALV:       {alv_matches}/{total_tests} match")
    print()

    if all_pass:
        print("✅ ALL SOCIAL SECURITY CALCULATIONS VERIFIED")
    else:
        print("❌ SOME SOCIAL SECURITY CALCULATIONS DO NOT MATCH")
        print()
        print("Action required: Update test vectors with correct values")

    return 0 if all_pass else 1


if __name__ == '__main__':
    exit(main())
