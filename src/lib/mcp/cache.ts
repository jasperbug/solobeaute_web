// Tiny in-memory TTL cache for the MCP route (module scope, so it lives as
// long as the server instance). Concurrent misses for the same key share one
// upstream request. Errors are never cached.

type Entry<T> = { value: T; expiresAt: number }

const MAX_ENTRIES = 500

const store = new Map<string, Entry<unknown>>()
const inflight = new Map<string, Promise<unknown>>()

/** TTLs (seconds) — all within the approved 60–300 s window. */
export const CACHE_TTL = {
  list: 180,
  detail: 120,
  availability: 60,
} as const

export async function cached<T>(key: string, ttlSeconds: number, load: () => Promise<T>): Promise<T> {
  const now = Date.now()
  const hit = store.get(key)
  if (hit && hit.expiresAt > now) {
    return hit.value as T
  }

  const pending = inflight.get(key)
  if (pending) {
    return pending as Promise<T>
  }

  const promise = load()
    .then((value) => {
      if (store.size >= MAX_ENTRIES) {
        // Drop expired entries first, then the oldest insertion.
        store.forEach((entry, entryKey) => {
          if (entry.expiresAt <= Date.now()) store.delete(entryKey)
        })
        if (store.size >= MAX_ENTRIES) {
          const oldest = store.keys().next().value
          if (oldest !== undefined) store.delete(oldest)
        }
      }
      store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 })
      return value
    })
    .finally(() => {
      inflight.delete(key)
    })

  inflight.set(key, promise)
  return promise
}
