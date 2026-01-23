# Bundle Size Analysis - Tree Breakdown

**Date:** 2026-01-23
**Total Bundle:** 46 MB (actual deployment size)
**handler.mjs:** 13 MB (main worker file)

## Bundle Size Tree

```
.open-next/server-functions/default/  (46 MB total)
├── handler.mjs                       13 MB  ⚠️  Main worker bundle
├── node_modules/                     19 MB  ❌  Should NOT be in bundle!
│   ├── next/dist/                    17 MB  ❌  Next.js runtime
│   │   ├── server/                   7.8 MB
│   │   ├── compiled/                 4.4 MB
│   │   └── build/                    2.4 MB
│   ├── react-dom/                    1.1 MB
│   ├── @sentry/nextjs/               484 KB ⚠️  Sentry (not the main culprit!)
│   └── @opentelemetry/               236 KB
├── .next/server/chunks/              13 MB  Next.js compiled output
│   └── ssr/                          6.8 MB
└── configs/                          624 KB  YAML configs bundled
```

## The Real Problem

**Next.js is bundling node_modules (19 MB) when it shouldn't!**

The bundler should inline everything into `handler.mjs`, but instead:
- ✅ `handler.mjs` = 13 MB (compiled code)
- ❌ `node_modules/` = 19 MB (raw dependencies - DUPLICATE!)
- ❌ `.next/server/` = 13 MB (more compiled code - DUPLICATE!)

**Total waste:** ~32 MB of duplication

## Breakdown by Dependency

| Dependency | Size | Notes |
|------------|------|-------|
| `next/dist` | 17 MB | Next.js runtime - WAY too big |
| `react-dom` | 1.1 MB | React SSR |
| `@sentry/nextjs` | 484 KB | Sentry (actually reasonable!) |
| `@opentelemetry` | 236 KB | Telemetry |
| Configs | 624 KB | YAML configs |

## Why Is This Happening?

**Theory:** OpenNext is including `node_modules` for external dependencies that can't be bundled. But it's including WAY too much.

**What should happen:**
- Cloudflare Workers bundle: Single `handler.mjs` file (~3-5 MB)
- All code inlined and tree-shaken
- No `node_modules` directory

**What's actually happening:**
- `handler.mjs` + `node_modules/` + `.next/` all present
- Massive duplication
- No tree-shaking of Next.js

## Comparison: Working Deployment vs Now

### Before Sentry (working deployment)
```
Commit: 06bb81d (earlier today)
Bundle size: < 3 MB ✅
Status: Deployed successfully
```

### After Sentry (now)
```
Commit: 814565d (feat: integrate Sentry)
Bundle size: 46 MB ❌
Status: Cannot deploy
```

## What Changed?

Looking at commit `814565d` - "feat: integrate Sentry":
- Added `@sentry/nextjs` package
- Added Sentry config files
- Wrapped Next.js with `withSentryConfig()`

**The wrapper is the culprit!** `withSentryConfig()` changes the webpack config and likely prevents proper tree-shaking of Next.js.

## Solutions

### Option 1: Remove Sentry Wrapper (Quick Fix) ✅
**Status:** Already done!
- Removed `withSentryConfig()` from `next.config.ts`
- Disabled server-side Sentry
- But bundle still 13 MB...

### Option 2: Fix OpenNext Bundling

The issue is OpenNext isn't bundling properly. Check:

1. **Is this a known issue?**
   ```bash
   # Check OpenNext version
   npm list @opennextjs/cloudflare
   # Latest: 1.15.1 ✅
   ```

2. **OpenNext config issues?**
   - Check `open-next.config.ts`
   - Look for external dependencies configuration

3. **Next.js  config issues?**
   - Check `next.config.ts`
   - Ensure proper webpack configuration

### Option 3: Analyze What's in handler.mjs

The `handler.mjs` file is 13 MB on its own. Let's see what's inside:

```bash
# Check if it's minified
head -c 500 .open-next/server-functions/default/handler.mjs

# Look for large dependencies
grep -o "node_modules/[^/]*/[^'\"]*" handler.mjs | sort | uniq -c | sort -rn | head -20
```

### Option 4: Dynamic Imports for Heavy Dependencies

Move heavy dependencies to dynamic imports:
- `recharts` (charts library)
- `lucide-react` (icons)
- Large components

```typescript
// Instead of:
import { LineChart } from 'recharts';

// Use:
const LineChart = dynamic(() => import('recharts').then(mod => ({ default: mod.LineChart })));
```

## Next Steps

1. ✅ **Check OpenNext GitHub issues** - Is this a known bug?
2. ✅ **Analyze handler.mjs** - What's actually in the 13 MB file?
3. **Try minimal reproduction** - Create a simple Next.js app and deploy to see baseline size
4. **Consider alternatives:**
   - Deploy to Vercel (no bundle limits)
   - Use Pages Functions instead of Workers
   - Switch to a lighter framework (Remix, SvelteKit)

## Commands

```bash
# Rebuild and analyze
make clean
make build-cloudflare

# Check bundle sizes
du -h .open-next/server-functions/default/ | sort -rh | head -40

# Analyze handler.mjs
ls -lh .open-next/server-functions/default/handler.mjs
wc -l .open-next/server-functions/default/handler.mjs

# Check what's imported
grep -o "from '[^']*'" .open-next/server-functions/default/handler.mjs | sort | uniq -c | sort -rn | head -20
```

## Conclusion

**Sentry is NOT the main problem** (only 484 KB).

**The real issue:** Next.js bundling is broken. The entire Next.js runtime (17 MB) is being included when it should be tree-shaken down to ~2-3 MB.

**Before Sentry:** Bundle was fine (< 3 MB)
**After Sentry:** Wrapper broke bundling, now 46 MB total

**Immediate action needed:**
1. Check if removing Sentry wrapper fixed the bundling
2. If not, investigate OpenNext configuration
3. Consider reporting bug to OpenNext team
