# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-01-23

### Added
- Initial release of Universal Net Calc
- Support for Netherlands, Germany, Canada, and all 50 US states with tax calculations
- Multi-country gross-to-net salary calculator
- YAML-driven tax configuration system
- Configuration management with variants (e.g., 30% Ruling for expat regimes)
- Test vector framework for validating configurations
- Next.js frontend with responsive design
- shadcn/ui components for modern UI
- Recharts for data visualization
- Cloudflare Workers deployment with OpenNext
- Configuration-driven calculation engine with DAG evaluation
- Community-maintainable tax configurations
- API endpoints for salary calculations and country/year management

### Features
- **Calculator UI:** Interactive salary calculations with breakdown by tax components
- **Tax Breakdown:** Detailed breakdown showing income tax, contributions, credits, deductions
- **Multi-Region Support:** Different tax rules per country and year
- **Variants:** Support for special tax regimes (expat programs, filing types)
- **Regional Tax:** Support for multi-level regional taxation (states, provinces, cantons)
- **Test Validation:** Comprehensive test vectors for each configuration

[Unreleased]: https://github.com/reconnct/universal-net-calc/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/reconnct/universal-net-calc/releases/tag/v0.1.0
