// Durability helpers. IndexedDB is "best-effort" by default and browsers can
// evict it under storage pressure (mobile Safari is especially aggressive when
// the app isn't installed). Requesting persistent storage tells the browser to
// keep our data unless the user explicitly clears it.

export type PersistState = 'persisted' | 'best-effort' | 'unsupported'

/** Ask the browser to make storage durable. Safe to call on every launch. */
export async function ensurePersistentStorage(): Promise<PersistState> {
  try {
    if (!navigator.storage?.persist) return 'unsupported'
    if (await navigator.storage.persisted()) return 'persisted'
    const granted = await navigator.storage.persist()
    return granted ? 'persisted' : 'best-effort'
  } catch {
    return 'unsupported'
  }
}

/** Current persistence status without requesting it (for the settings UI). */
export async function persistState(): Promise<PersistState> {
  try {
    if (!navigator.storage?.persisted) return 'unsupported'
    return (await navigator.storage.persisted()) ? 'persisted' : 'best-effort'
  } catch {
    return 'unsupported'
  }
}

/** Rough usage estimate, for reassurance in the UI. */
export async function storageEstimate(): Promise<{ usage: number; quota: number } | null> {
  try {
    if (!navigator.storage?.estimate) return null
    const e = await navigator.storage.estimate()
    return { usage: e.usage ?? 0, quota: e.quota ?? 0 }
  } catch {
    return null
  }
}
