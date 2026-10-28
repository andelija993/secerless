
const store = new Map(); // key -> { value: Promise, time: number, refreshing: boolean }

export const DEFAULT_TTL = 60_000; // 1 minute

export function cached(key, loader, ttlMs = DEFAULT_TTL) {
  const now = Date.now();
  const hit = store.get(key);

  if (hit) {
    if (now - hit.time > ttlMs && !hit.refreshing) {
      hit.refreshing = true;
      const fresh = loader();
      fresh
        .then(() => {
          // Only replace if nobody cleared/replaced the entry meanwhile
          if (store.get(key) === hit) store.set(key, { value: fresh, time: Date.now(), refreshing: false });
        })
        .catch((err) => {
          hit.refreshing = false;
          console.error(`Cache refresh failed for ${key}`, err);
        });
    }
    return hit.value;
  }

  // Miss: store the pending promise so simultaneous requests share one DB query
  const value = loader();
  const entry = { value, time: now, refreshing: false };
  store.set(key, entry);
  value.catch(() => {
    if (store.get(key) === entry) store.delete(key); // never cache errors
  });
  return value;
}

export function clearCache() {
  store.clear();
}

