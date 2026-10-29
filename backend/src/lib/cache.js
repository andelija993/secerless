// In-memory cache for public reads. Stale entries are served instantly while
// a fresh copy loads in the background; server.js clears it on every write.
const store = new Map();

export function cached(key, loader, ttlMs = 60_000) {
  const hit = store.get(key);

  if (hit) {
    if (Date.now() - hit.time > ttlMs && !hit.refreshing) {
      hit.refreshing = true;
      const fresh = loader();
      fresh
        .then(() => store.get(key) === hit && store.set(key, { value: fresh, time: Date.now() }))
        .catch((err) => {
          hit.refreshing = false;
          console.error(`Cache refresh failed for ${key}`, err);
        });
    }
    return hit.value;
  }

  // Store the pending promise so simultaneous requests share one query
  const entry = { value: loader(), time: Date.now() };
  store.set(key, entry);
  entry.value.catch(() => store.get(key) === entry && store.delete(key));
  return entry.value;
}

export function clearCache() {
  store.clear();
}

