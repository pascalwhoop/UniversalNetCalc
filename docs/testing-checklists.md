# Testing Checklists

Comprehensive testing checklists for ensuring quality before and after deployments.

## Manual Testing Checklist

### Core Calculator Functionality
- [ ] Add a country and verify it loads correctly
- [ ] Enter gross annual salary and verify calculation appears
- [ ] Add a second country for comparison
- [ ] Remove a country and verify state updates
- [ ] Change country selection and verify inputs reset correctly
- [ ] Select different tax years and verify calculations update
- [ ] Select tax variants (e.g., 30% ruling for NL) and verify special rules apply
- [ ] Test regional inputs (e.g., Italian regions, Swiss cantons)
- [ ] Verify effective tax rate displays correctly
- [ ] Verify marginal tax rate displays with tooltip
- [ ] Test filing status changes (e.g., US single vs. married)

### UI/UX Testing
- [ ] Test responsive design on mobile (320px width)
- [ ] Test responsive design on tablet (768px width)
- [ ] Test responsive design on desktop (1920px width)
- [ ] Verify dark mode toggle works correctly
- [ ] Verify dark mode styling for all components
- [ ] Test keyboard navigation (Tab key through inputs)
- [ ] Test screen reader announcements (VoiceOver/NVDA)
- [ ] Verify all interactive elements have focus indicators
- [ ] Test tooltips appear on hover/focus
- [ ] Verify loading states display correctly
- [ ] Verify error states display with helpful messages

### URL State Persistence
- [ ] Add countries and verify URL updates
- [ ] Copy URL and open in new tab - verify state restored
- [ ] Share URL with someone else (incognito mode) - verify state loads
- [ ] Test URL with invalid country code - verify error handling
- [ ] Test URL with multiple countries - verify all restore correctly

### Results Display
- [ ] Verify gross, net, and effective rate calculations
- [ ] Verify marginal rate badge appears and is accurate
- [ ] Verify monthly net amount displays correctly (annual / 12)
- [ ] Expand breakdown accordion and verify all tax items shown
- [ ] Verify breakdown items are categorized correctly
- [ ] Check salary range chart displays and updates with inputs
- [ ] Verify chart shows comparison bars correctly

### Currency Conversion
- [ ] Test comparison between countries with different currencies
- [ ] Verify currency symbols display correctly (€, $, £, CHF)
- [ ] Test "Copy to All" button with currency conversion
- [ ] Verify exchange rates are reasonably recent

### Data Validation
- [ ] Test entering negative salary - verify validation
- [ ] Test entering non-numeric values - verify validation
- [ ] Test extremely large salaries (e.g., 1 million) - verify no crashes
- [ ] Test zero salary - verify handles gracefully

## Automated Testing Checklist

### Unit Tests
```bash
npm run test
```
- [ ] All unit tests pass
- [ ] Test coverage meets minimum thresholds
- [ ] No console errors or warnings during tests
- [ ] Mock data and fixtures are up to date

### Config Tests
```bash
npm run test:configs
```
- [ ] All config test vectors pass
- [ ] Test vectors cover low, median, and high income scenarios
- [ ] Variant configs have dedicated test vectors
- [ ] Regional configs (IT, CH) have region-specific tests
- [ ] Test tolerances are appropriate (not too loose)

### E2E Tests
```bash
npm run test:e2e
```
- [ ] All Playwright E2E tests pass
- [ ] Tests cover critical user journeys
- [ ] Tests check for visual regressions
- [ ] Tests verify mobile responsive behavior
- [ ] Tests verify accessibility compliance

### Type Checking
```bash
npx tsc --noEmit
```
- [ ] No TypeScript compilation errors
- [ ] No `any` types used (unless properly justified)
- [ ] Proper type definitions for all API responses
- [ ] Type safety for all config interfaces

### Linting
```bash
npm run lint
```
- [ ] No ESLint errors (0 errors)
- [ ] Warnings are reviewed and justified
- [ ] Code style is consistent across files
- [ ] No unused imports or variables

## Pre-Deploy Checklist

### Code Quality
- [ ] All automated tests passing (unit, config, E2E, TypeScript, ESLint)
- [ ] No console errors in development mode
- [ ] No TODOs or FIXMEs in committed code (or documented in issues)
- [ ] Code has been reviewed (self-review or peer review)
- [ ] Commit messages follow conventional commits format

### Build Validation
```bash
npm run build
```
- [ ] Build completes successfully
- [ ] No build warnings or errors
- [ ] Bundle size is within acceptable limits
- [ ] configs-manifest.json is up to date and included in build
- [ ] Environment variables are properly configured

### Data & Configuration
- [ ] configs-manifest.json is current (run `npm run generate:manifest`)
- [ ] All new country configs have test vectors
- [ ] Test vectors pass validation
- [ ] Config YAML syntax is valid
- [ ] Notices are properly defined and displayed

### Documentation
- [ ] CHANGELOG.md is updated (if applicable)
- [ ] New features are documented in README or docs/
- [ ] API changes are documented
- [ ] Breaking changes are clearly noted

## Deploy Checklist

### Preview Deployment
```bash
npm run preview
```
- [ ] Preview deployment succeeds
- [ ] Smoke test preview URL (https://universal-net-calc-preview.reconnct.workers.dev)
- [ ] Test core user flow on preview
- [ ] Check Cloudflare Worker logs for errors
- [ ] Verify configs load correctly from bundled assets

### Production Deploy Preparation
- [ ] Preview environment tested and approved
- [ ] Stakeholders notified of deployment
- [ ] Rollback plan prepared
- [ ] Deployment window scheduled (if needed)

### Production Deployment
- [ ] Deploy to production via GitHub Actions
- [ ] Monitor deployment logs for errors
- [ ] Verify Worker deployment succeeded
- [ ] Check Worker metrics (invocations, errors, duration)

## Post-Deploy Checklist

### Smoke Tests
- [ ] Production URL loads successfully
- [ ] Test core user flow:
  1. Add country (e.g., Netherlands)
  2. Enter salary (e.g., €60,000)
  3. View calculation and breakdown
  4. Add second country for comparison
  5. Generate shareable URL
  6. Verify URL loads in incognito
- [ ] Test on multiple browsers (Chrome, Firefox, Safari)
- [ ] Test on mobile device (real device, not just DevTools)

### Monitoring
- [ ] Check Sentry for new errors
- [ ] Review Cloudflare Analytics:
  - [ ] Request count is normal
  - [ ] Error rate is low (<1%)
  - [ ] P50/P95 latency is acceptable
- [ ] Verify no increase in error rate compared to baseline
- [ ] Check for any customer complaints or bug reports

### Social & SEO
- [ ] Verify Open Graph meta tags render correctly (use https://www.opengraph.xyz/)
- [ ] Verify Twitter Card renders correctly
- [ ] Check that social media cards show correct image and description
- [ ] Test shareable links on Slack, Twitter, LinkedIn

### Communication
- [ ] Notify team of successful deployment
- [ ] Update status page (if applicable)
- [ ] Announce new features (if major release)

## Regression Testing (After Major Changes)

### After Config Changes
- [ ] Run `npm run test:configs` for all affected countries
- [ ] Manually verify calculations for affected countries
- [ ] Compare results with official tax calculators
- [ ] Test variant configs if base config changed

### After Engine Changes
- [ ] Run full test suite (`npm run test`)
- [ ] Test marginal rate calculations for accuracy
- [ ] Verify bracket transitions work correctly
- [ ] Test edge cases (zero income, very high income)
- [ ] Verify rounding behavior is consistent

### After UI Changes
- [ ] Run E2E tests (`npm run test:e2e`)
- [ ] Test responsive design on all breakpoints
- [ ] Verify accessibility with Lighthouse audit
- [ ] Test dark mode appearance
- [ ] Verify print styles (if applicable)

## Performance Testing

### Bundle Size
```bash
npm run build
# Check build output for bundle sizes
```
- [ ] Total bundle size < 5MB (Cloudflare Worker limit)
- [ ] Initial page load is fast (<3s on 3G)
- [ ] No unnecessary dependencies included

### Runtime Performance
- [ ] Calculations complete in <200ms
- [ ] Page renders without jank
- [ ] Interactions feel responsive (<100ms)
- [ ] No memory leaks (test with Chrome DevTools)

## Accessibility Testing

### Automated
```bash
# Run Lighthouse in Chrome DevTools
# Target: Accessibility score > 95
```
- [ ] Lighthouse accessibility score > 95
- [ ] No ARIA violations
- [ ] Proper heading hierarchy (h1 > h2 > h3)
- [ ] All images have alt text

### Manual
- [ ] Navigate entire app with keyboard only (no mouse)
- [ ] Test with screen reader (VoiceOver on Mac, NVDA on Windows)
- [ ] Verify color contrast meets WCAG AA standards
- [ ] Verify focus indicators are visible
- [ ] Test with browser zoom at 200%

## Browser Compatibility

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers
- [ ] Safari iOS (latest)
- [ ] Chrome Android (latest)
- [ ] Samsung Internet (if relevant audience)

## Security Testing

### Basic Security
- [ ] No exposed API keys or secrets in code
- [ ] No sensitive data in URL parameters (except intentional state)
- [ ] CSP headers configured correctly
- [ ] HTTPS enforced on production
- [ ] No mixed content warnings

### Input Validation
- [ ] All user inputs are validated
- [ ] No XSS vulnerabilities (test with `<script>alert('xss')</script>`)
- [ ] No SQL injection risks (using ORM/parameterized queries)
- [ ] File upload validation (if applicable)

## Notes

- **Before Each Release:** Run through Pre-Deploy Checklist
- **After Each Deploy:** Run through Post-Deploy Checklist within 1 hour
- **Weekly:** Review Sentry errors and plan fixes
- **Monthly:** Full regression testing of all features
- **Quarterly:** Comprehensive accessibility audit

## Quick Pre-Commit Checklist

For quick checks before committing:

```bash
npm run lint && npm run test:run && npm run test:configs
```

- [ ] Linting passes
- [ ] Unit tests pass
- [ ] Config tests pass

If all pass, you're good to commit!
