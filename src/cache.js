// simple in-memory cache — lives as long as the tab is open
// using a module-level Map so it's shared across the whole app
const cache = new Map()

export function isCached(key) {
  return cache.has(key)
}

export function getCached(key) {
  return cache.get(key) ?? null
}

export function setCached(key, value) {
  cache.set(key, value)
}
