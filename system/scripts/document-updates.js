// Normalize document updates to the REST API field names.
// Actors persist their system under `systemData`, items under `data`.
// Updates written with dotted paths (`system.hunger.value`) are expanded
// and nested accordingly before being persisted. The server deep-merges
// these fields with the existing document, so partial updates are safe.

export function normalizeUpdate(data, systemKey) {
  const expanded = Loom.utils.expandObject(data)
  const result = {}

  for (const [key, value] of Object.entries(expanded)) {
    if (key === 'system') {
      const merged = Loom.utils.mergeObject(result[systemKey] ?? {}, value)
      if (merged.derived) delete merged.derived
      result[systemKey] = merged
    } else if (key === 'systemData' || key === 'data') {
      const merged = Loom.utils.mergeObject(result[systemKey] ?? {}, value)
      if (merged.derived) delete merged.derived
      result[systemKey] = merged
    } else if (key === 'flags' || key === 'derivedData' || key === 'derived') {
      // Flags and derived data aren't persisted by the API; skip them
    } else {
      result[key] = value
    }
  }

  if (result[systemKey]?.derived) {
    delete result[systemKey].derived
  }

  return result
}

export const loadUpdateNormalization = function () {
  // LoomVTT's compatibility layer should handle the translation of 
  // 'system' to 'data' natively during network requests.
  // By doing it here in the `preUpdateItem` hook, we corrupt the in-memory
  // legacy Document because it merges `data.level` instead of `system.level`.
  //
  // Loom.LoomHooks.on('preUpdateActor', (_actor, data) => { ... })
  // Loom.LoomHooks.on('preUpdateItem', (_item, data) => { ... })
}

