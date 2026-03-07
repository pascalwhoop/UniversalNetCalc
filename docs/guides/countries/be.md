# Belgium 2025

Belgium 2025 is modeled as a payroll-oriented employee salary calculation for a single annual gross salary input.

## Implemented

- Employee social security (`RSZ`) at `13.07%`
- Standard employee professional expense deduction at `30%`, capped at `EUR 5,930`
- Federal income tax brackets for income year 2025 / assessment year 2026:
  - `0 - 16,320`: `25%`
  - `16,320 - 28,800`: `40%`
  - `28,800 - 49,840`: `45%`
  - `49,840+`: `50%`
- Base tax-free allowance of `EUR 10,910`
- Child allowance additions for dependent children
- Municipal surtax as a user input, defaulting to `7%`
- Special social security contribution (`BBSZ`) estimated from payroll withholding bands

## Important modeling note

`BBSZ` is not modeled as a final household-income reconciliation. The current config uses employer payroll withholding bands from the social security instructions, which is suitable for gross-to-net salary estimation but can differ from the final annual settlement on the tax return.

## Sources

- `https://financien.belgium.be/nl/particulieren/belastingaangifte/tarieven-belastingvrije-som/tarieven#q1` - official federal brackets and tax-free allowance
- `https://www.socialsecurity.be/employer/instructions/dmfa/nl/latest/instructions/special_contributions/special_contribution_social_security.html` - payroll withholding guidance for special social security contribution
- `https://www.aclvb.be/nl/forfaitaire-beroepskosten` - employee lump-sum professional expense cap for assessment year 2026
