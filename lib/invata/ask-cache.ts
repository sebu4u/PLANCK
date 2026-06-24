type CacheEntry<T> = {
  value: T
  cachedAt: number
}

const MAX_ENTRIES = 4
const TTL_MS = 1000 * 60 * 5

const store = new Map<string, CacheEntry<unknown>>()

function read<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined
  if (!entry) return null
  if (Date.now() - entry.cachedAt > TTL_MS) {
    store.delete(key)
    return null
  }
  store.delete(key)
  store.set(key, entry)
  return entry.value
}

function write<T>(key: string, value: T) {
  store.set(key, { value, cachedAt: Date.now() })
  while (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value
    if (!oldest) break
    store.delete(oldest)
  }
}

export function buildInvataAskCacheKey(prompt: string, historyLength: number): string {
  return `${historyLength}::${prompt}`
}

export function getCachedAskResponse<T>(prompt: string, historyLength: number): T | null {
  if (typeof window === "undefined") return null
  return read<T>(buildInvataAskCacheKey(prompt, historyLength))
}

export function setCachedAskResponse<T>(prompt: string, historyLength: number, value: T) {
  if (typeof window === "undefined") return
  write(buildInvataAskCacheKey(prompt, historyLength), value)
}

export function clearInvataAskCache() {
  store.clear()
}
