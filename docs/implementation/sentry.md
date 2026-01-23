# Sentry Error Tracking

**Status:** ✅ Deployed with client-side error tracking (2.27 MB gzipped)

## Solution

Use `@sentry/browser` instead of `@sentry/nextjs` to stay under Cloudflare Workers free tier (3 MB gzipped).

## Bundle Size Comparison

| Configuration | Uncompressed | Gzipped | Status |
|---------------|--------------|---------|--------|
| No Sentry | 8.8 MB | 2.1 MB | Baseline |
| @sentry/nextjs + withSentryConfig() | 46 MB | N/A | Build fails |
| @sentry/nextjs (client-only) | 13.7 MB | 3.7 MB | Over limit |
| **@sentry/browser** | **9.5 MB** | **2.27 MB** | ✅ **Deployed** |

**Savings:** 1.5 MB gzipped vs. full Next.js SDK

## Implementation

**Core files:**
- `src/lib/sentry-client.ts` - Lazy-loaded Sentry browser SDK
- `src/components/sentry-provider.tsx` - Init Sentry on mount
- `src/app/global-error.tsx` - Catch and report errors
- `src/app/layout.tsx` - Wrap app with SentryProvider

**Configuration:**
```typescript
// src/lib/sentry-client.ts
Sentry.init({
  dsn: "...",
  tracesSampleRate: 0,           // No performance tracing
  replaysSessionSampleRate: 0,   // No session replay
  replaysOnErrorSampleRate: 0,   // No error replay
  environment: process.env.NODE_ENV,
});
```

## What's Included
✅ Client-side error capturing
✅ Error notifications in Sentry dashboard
✅ Production error tracking
✅ Global error boundary

## What's Not Included
❌ Server-side error tracking (not needed for Workers)
❌ Performance tracing (saves bundle size)
❌ Session replay (saves bundle size)
❌ Source map uploads (optional)

## Key Findings

1. **@sentry/nextjs includes heavy server instrumentation** - 3.7 MB gzipped
2. **@sentry/browser is minimal** - 2.27 MB gzipped
3. **withSentryConfig() breaks tree-shaking** - Adds 40+ MB uncompressed
4. **Dynamic imports don't reduce bundle** - Code still bundled, just lazy-loaded
5. **Cloudflare gzip is effective** - 76% compression (9.5 MB → 2.27 MB)

## Alternative Solutions

If bundle size becomes an issue:
1. **Upgrade to Workers Paid ($5/mo)** - 10 MB limit
2. **Custom error endpoint** - Send errors to own API (no SDK)
3. **Deploy to Vercel** - No bundle size limits
4. **Cloudflare Tail Workers** - Export logs to Sentry without SDK

## Deployment

**Preview URL:** https://universal-net-calc-preview.reconnct.workers.dev

**Verified:**
```bash
curl -X POST https://...workers.dev/api/calc \
  -H "Content-Type: application/json" \
  -d '{"country":"nl","year":"2025","gross_annual":60000}'

# Works: 2.27 MB gzipped (under 3 MB free tier limit)
```

## References

- [Sentry Browser SDK](https://docs.sentry.io/platforms/javascript/)
- [Cloudflare Workers Limits](https://developers.cloudflare.com/workers/platform/limits/#worker-size)
- [Bundle Analysis](https://esbuild.github.io/analyze/)
