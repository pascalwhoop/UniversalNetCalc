declare namespace NodeJS {
  interface ProcessEnv {
    FREECURRENCY_API_KEY?: string
  }
}

// KVNamespace type for environments where @cloudflare/workers-types isn't available
declare interface KVNamespace {
  get(key: string, type?: "text"): Promise<string | null>
  get(key: string, type: "json"): Promise<unknown | null>
  get(key: string, type: "arrayBuffer"): Promise<ArrayBuffer | null>
  get(key: string, type: "stream"): Promise<ReadableStream | null>
  put(
    key: string,
    value: string | ArrayBuffer | ReadableStream,
    options?: { expiration?: number; expirationTtl?: number; metadata?: unknown }
  ): Promise<void>
  delete(key: string): Promise<void>
  list(options?: {
    prefix?: string
    limit?: number
    cursor?: string
  }): Promise<{ keys: { name: string; expiration?: number; metadata?: unknown }[]; list_complete: boolean; cursor?: string }>
}

// Extend Cloudflare.Env with our custom bindings
declare namespace Cloudflare {
  interface Env {
    EXCHANGE_RATES_CACHE?: KVNamespace
    FREECURRENCY_API_KEY?: string
  }
}
