# Documentation

This directory contains technical documentation for the Universal Gross-to-Net Salary Calculator.

## Structure

### Product Requirements
- **[PRD](./prd.md)** - Product Requirements Document with architecture decisions, goals, and milestones

### Implementation Documentation
- **[Overview](./implementation/overview.md)** - Overview of all implementation phases (0-5)
- **[Phase 2: TanStack Query](./implementation/phase-2-tanstack-query.md)** - Migration to TanStack Query for data fetching
- **[Phase 5: Mobile Responsive Design](./implementation/phase-5-mobile.md)** - Mobile responsive design implementation

### Testing
- **[Mobile Testing Guide](./testing/mobile-testing.md)** - Comprehensive guide for testing mobile responsive design

### Development Notes
- **[Gotchas](./gotchas.md)** - Common pitfalls and their solutions
- **[URL State Fix Verification](./url-state-fix-verification.md)** - Documentation of URL state synchronization fix

## Quick Links

- **Getting Started**: See [CLAUDE.md](../CLAUDE.md) in the root directory
- **Architecture**: See [PRD](./prd.md) section 8
- **Adding Countries**: Use the `/add-new-country` skill or see [CLAUDE.md](../CLAUDE.md) section "Working with Configs"
- **Testing**: See [testing/mobile-testing.md](./testing/mobile-testing.md) for mobile testing, or run `npm run test:configs` for config validation
