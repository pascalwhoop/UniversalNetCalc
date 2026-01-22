declare namespace NodeJS {
  interface ProcessEnv {
    FREECURRENCY_API_KEY?: string
  }
}

// Extend Cloudflare.Env with our custom bindings
declare namespace Cloudflare {
  interface Env {
    EXCHANGE_RATES_CACHE?: KVNamespace
    FREECURRENCY_API_KEY?: string
  }
}
