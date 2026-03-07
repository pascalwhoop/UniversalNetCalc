#!/usr/bin/env python3
"""
Debug CH 2026 actual vs expected calculations
"""

import json
from pathlib import Path

test_vectors = [
    {
        'file': 'single-low-income-geneva.json',
        'expected_net': 38346.46,
        'actual_net': 37446.464,
        'diff': 899.996
    },
    {
        'file': 'single-high-income-neuchatel.json',
        'expected_net': 153104.16,
        'actual_net': 143984.762,
        'diff': 9119.398
    },
    {
        'file': 'married-high-income-zug.json',
        'expected_net': 120406.66,
        'actual_net': 129906.6576,
        'diff': -9499.998  # Engine calculates MORE net (less tax)
    }
]

test_dir = Path(__file__).parent.parent / 'configs' / 'ch' / '2026' / 'tests'

for tv in test_vectors:
    with open(test_dir / tv['file'], 'r') as f:
        data = json.load(f)

    print(f"\n{'='*80}")
    print(f"Test: {data['name']}")
    print(f"{'='*80}")
    print(f"Gross: CHF {data['inputs']['gross_annual']:,}")
    print(f"\nExpected breakdown:")
    for key, val in data['expected']['breakdown'].items():
        print(f"  {key:30s}: CHF {val:>10,.2f}")

    print(f"\nExpected net: CHF {tv['expected_net']:,.2f}")
    print(f"Actual net:   CHF {tv['actual_net']:,.2f}")
    print(f"Difference:   CHF {tv['diff']:,.2f} {'(engine calculates MORE tax)' if tv['diff'] > 0 else '(engine calculates LESS tax)'}")

    # Calculate what the actual cantonal tax must be
    gross = data['inputs']['gross_annual']
    expected_breakdown = data['expected']['breakdown']

    total_expected_deductions = sum(expected_breakdown.values())
    actual_total_deductions = gross - tv['actual_net']

    print(f"\nTotal deductions expected: CHF {total_expected_deductions:,.2f}")
    print(f"Total deductions actual:   CHF {actual_total_deductions:,.2f}")
    print(f"Extra deductions:          CHF {actual_total_deductions - total_expected_deductions:,.2f}")
