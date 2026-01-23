"use client";

let initialized = false;
let SentryModule: typeof import("@sentry/browser") | null = null;

async function loadSentry() {
  if (!SentryModule) {
    SentryModule = await import("@sentry/browser");
  }
  return SentryModule;
}

export async function initSentry() {
  if (initialized || typeof window === "undefined") {
    return;
  }

  const Sentry = await loadSentry();

  Sentry.init({
    dsn: "https://b9fb6d31785217b70b8fdb2af6963e3f@o4510353175085056.ingest.de.sentry.io/4510759184105552",

    // Minimal config - errors only, no tracing or replay
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,

    sendDefaultPii: false,
    environment: process.env.NODE_ENV,
  });

  initialized = true;
}

export async function captureException(error: unknown) {
  const Sentry = await loadSentry();
  Sentry.captureException(error);
}
