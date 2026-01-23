# Development Gotchas

This document tracks common pitfalls and their solutions to help future developers avoid them.

## URL State Synchronization Feedback Loop

**Problem:** When implementing bidirectional sync between component state and URL (for shareable links), it's easy to create a feedback loop where URL updates trigger state re-initialization, which overwrites user input.

**Symptoms:**
- User changes form values but they revert to previous values
- User has to try multiple times before changes "stick"
- Values keep jumping back after typing

**Root Cause:**
When you have both:
1. An effect that reads URL params and initializes component state
2. An effect that writes component state to URL (debounced)

If the "read URL" effect has URL params as a dependency, it creates a loop:
```
User input → State change → URL update → URL params change → Re-initialize state → Overwrite user input
```

**Solution:**
Separate "URL read" (mount only) from "URL write" (ongoing):

```typescript
// ❌ WRONG - Creates feedback loop
useEffect(() => {
  const urlState = decodeState(searchParams)
  initializeState(urlState)
}, [searchParams]) // Re-runs on every URL change!

// ✅ CORRECT - Only read URL on mount
useEffect(() => {
  if (hasInitialized.current) return

  const urlState = decodeState(searchParams)
  initializeState(urlState)
  hasInitialized.current = true
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []) // Empty deps - only runs once

// ✅ CORRECT - Write to URL ongoing
useEffect(() => {
  const timer = setTimeout(() => {
    updateURL(currentState)
  }, 500)
  return () => clearTimeout(timer)
}, [currentState]) // Reacts to state changes
```

**Key principles:**
- Use empty dependency array `[]` for URL initialization effects
- Use refs to guard against re-initialization (`hasInitialized.current`)
- Don't include reactive URL params in initialization effect dependencies
- Debounce URL writes to avoid excessive updates
- Use `window.history.replaceState()` for URL updates to avoid navigation

**Files affected:**
- `/src/components/calculator/comparison-grid.tsx` - Main orchestrator
- `/src/components/calculator/country-column.tsx` - Form state component

**Related:** React docs on [Separating Events from Effects](https://react.dev/learn/separating-events-from-effects)

---

## TanStack Query Mutation in Dependencies

**Problem:** Including a TanStack Query mutation object in a useCallback or useEffect dependency array creates an infinite loop.

**Symptoms:**
- API calls repeat infinitely
- Browser becomes unresponsive
- Console shows hundreds of identical requests
- Network tab shows endless POST requests

**Root Cause:**
When you include the mutation object from `useMutation()` in a dependency array, every mutation updates the object reference, causing the callback/effect to re-run, which triggers another mutation:

```
Mutation runs → Mutation object updates → Callback recreates → Effect runs → Mutation runs → ∞
```

**Solution:**
Exclude the mutation object from dependencies - it's stable and provided by the hook:

```typescript
// ❌ WRONG - Creates infinite loop
const calculateMutation = useCalculateSalary()

const calculate = useCallback(() => {
  calculateMutation.mutate(request)
}, [country, year, formValues, calculateMutation]) // ← BUG: mutation in deps!

useEffect(() => {
  calculate()
}, [calculate]) // → Infinite loop!

// ✅ CORRECT - Mutation object excluded
const calculateMutation = useCalculateSalary()

const calculate = useCallback(() => {
  calculateMutation.mutate(request)
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [country, year, formValues])
// Note: calculateMutation is stable from hook, exclude from deps

useEffect(() => {
  calculate()
}, [calculate]) // → Runs only when inputs change ✓
```

**Why this works:**
- TanStack Query's mutation objects are stable references
- The `.mutate()` function doesn't change between renders
- Only include actual input values in dependencies
- The mutation state (isPending, error, data) updates internally without changing the mutation object

**Alternative pattern - Direct mutation in effect:**
```typescript
const calculateMutation = useCalculateSalary()

useEffect(() => {
  if (!country || !year) return

  calculateMutation.mutate(request)
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [country, year, formValues]) // No mutation object in deps
```

**Files affected:**
- `/src/components/calculator/country-column.tsx` - Fixed: calculate callback
- `/src/components/calculator/salary-range-chart.tsx` - Correct: mutation not in deps

**Related:** TanStack Query docs on [Mutations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations)

---

## Cloudflare Workers Filesystem Access

**Problem:** Cloudflare Workers cannot read files from disk using Node.js `fs` module, even with `nodejs_compat` and `enable_nodejs_fs_module` compatibility flags enabled. This breaks YAML config loading.

**Symptoms:**
- Application works perfectly in dev mode (`npm run dev`)
- Deployed Workers fail with errors about missing files
- `fs.readFile()` or similar filesystem operations fail at runtime
- Configs bundled in `.open-next/` but cannot be accessed

**Root Cause:**
Cloudflare Workers run in a V8 isolate, not a full Node.js environment. While `nodejs_compat` provides many Node.js APIs, it doesn't give access to a traditional filesystem. Even bundled files cannot be read with `fs.readFile()`.

**Solution:**
Pre-build configs into a single TypeScript module at build time, then import it directly:

```typescript
// ❌ WRONG - Tries to read from filesystem at runtime
import { readFile } from 'fs/promises'
const yaml = await readFile('./configs/nl/2025/base.yaml', 'utf-8')
const config = parse(yaml)

// ✅ CORRECT - Pre-bundle configs at build time
// In package.json:
"build": "npm run build:configs && next build"
"build:configs": "node scripts/bundle-configs.mjs"

// scripts/bundle-configs.mjs reads all YAML files and generates:
// .generated/config-bundle.ts
export const configBundle = {
  "nl": {
    "2025": {
      "base": { /* parsed YAML as JSON */ },
      "variants": {
        "30-ruling": { /* parsed YAML as JSON */ }
      }
    }
  }
}

// packages/engine/src/config-loader.ts
import configBundle from '../../../.generated/config-bundle.ts'

// In production (Workers):
const config = configBundle[country][year].base

// In dev (Node.js):
const yaml = await readFile('./configs/nl/2025/base.yaml', 'utf-8')
const config = parse(yaml)
```

**Key principles:**
- Treat bundled data as code, not files - import it statically
- Use build-time scripts to convert YAML/data files to TypeScript modules
- Detect environment (Workers vs Node) and use appropriate loading strategy
- Keep YAML as source of truth, generate TS modules in CI/CD
- Add generated files to `.gitignore`

**Build process:**
1. `npm run build:configs` - Converts all YAML configs to single TypeScript module
2. `next build` - Next.js bundles the generated module with application code
3. OpenNext build - Packages everything for Cloudflare Workers deployment
4. At runtime in Workers - Import the bundled config module directly (no filesystem)

**Files affected:**
- `/scripts/bundle-configs.mjs` - Build script that generates config bundle
- `/packages/engine/src/config-loader.ts` - Dual-mode loader (bundle vs filesystem)
- `/.generated/config-bundle.ts` - Generated module (not in git)
- `/package.json` - Build pipeline coordination

**Alternative approaches considered:**
1. Dynamic imports with pre-built TS modules per config (more complex, same result)
2. Cloudflare KV storage (extra latency, more setup complexity)
3. Static assets + fetch() (requires parsing YAML in Workers, adds overhead)
4. R2 storage (overkill for small static configs)

**Related:**
- [Cloudflare Workers Node.js compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)
- [OpenNext Cloudflare documentation](https://opennext.js.org/cloudflare)
