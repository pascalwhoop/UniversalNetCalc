# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]


## [0.2.0] - 2026-01-29

### Added

- implement tag-based deployment workflow with PR previews (#23)
- Add all 50 US states + DC to salary calculator
- canada provinces
- Add Canada BC variant and comprehensive tests
- Add Australia non-resident variant and update tests
- Add issue reporting and improve breakdown styling
- Add country detection utility and collapsible component
- Add output merging support for variants
- add smooth animations throughout UI
- add animations and comprehensive SEO optimization
- expand help page with comprehensive documentation
- add marginal tax rate calculation and display
- add auto version bump workflow
- integrate notices UI and fix ESLint errors
- integrate Sentry error tracking and fix exchange rate error handling (#12)
- update app layout and API endpoints
- add calculation history tracking
- implement multi-country calculator with comparisons
- add core library utilities
- add config bundling for Cloudflare Workers
- calculator package & UI

### Fixed

- add contents write permission to version bump workflow
- Standardize country names and sort dropdown alphabetically
- Resolve React hydration error in ComparisonGrid
- Update history item route to /calculator
- Update Sweden expert-tax variant and tests
- Update Norway base config and tests
- Update South Korea flat-tax variant and tests
- Update Japan base config and tests
- Update Ireland SARP variant and tests
- Update Spain Beckham Law variant and tests
- successful package to below 3MB
- wrangler preview deploy
- update E2E tests for shadcn Select components
- resolve TypeScript compilation errors in Deploy Preview
- improve type safety in fetchExchangeRate function
- resolve 128 ESLint errors to improve code quality
- updates to CH tax brackes
- tests for NL

### Changed

- bump
- all of germany now
- custom domain from now on
- new canada configs
- Restructure Denmark tests and update configs
- config: Update environment and gitignore
- deps: Add UI and markdown rendering dependencies
- correct github repo
- new countries supported
- do not version local settings
- more claude skills
- add new country guides
- revert: remove manual testing checklist - prefer automation
- clean up CI/CD workflows and docs
- disable ESLint for engine package and remove redundant comments
- build: add cf-typegen to build script before Next.js compilation
- simplify codebase - consolidate metadata, extract utilities, improve typing
- build: update Cloudflare Worker configuration
- enhance engine and schema types
- config: update GB 2025 with trap zone tests
- config: add Bulgaria tax configuration
- build: add config manifest generation
- build: update build scripts for config bundling
- update configs
- wip
- add italy configurations
- instructions
- configs for first countries
- claude skill for configs

### Documentation

- add comprehensive testing checklists
- add comprehensive documentation and schema tests
- consolidate documentation to docs/ directory
- update CLAUDE.md with project implementation details

### Tests

- trigger CI with source file
- trigger CI
- trigger version bump workflow
- add comprehensive testing infrastructure

### Maintenance

- remove test file
- Remove obsolete country guides and skill references
- Update configs manifest with latest countries
- remove manual testing checklist per user feedback
- add test artifacts and generated files to gitignore
- remove settings.local.json from git tracking
- add .claude to gitignore
- add Claude Code skills and MCP agent configs


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
