// Expose `system` as an own property on live documents. Loom defines it as a
// prototype getter on LiveActor/LiveItem, which Handlebars denies access to.
// An own delegating getter resolves everywhere while staying fresh.

function expose(doc) {
  if (!doc || Object.prototype.hasOwnProperty.call(doc, 'system')) return
  const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(doc), 'system')
  if (!descriptor?.get) return
  Object.defineProperty(doc, 'system', {
    get: descriptor.get,
    enumerable: true,
    configurable: true
  })
}

export const loadDocumentFieldExposure = function () {
  for (const actor of Loom.actors) expose(actor)
  for (const item of Loom.items) expose(item)

  Loom.LoomHooks.on('actor.updated', (_data, doc) => {
    expose(doc ?? Loom.actors.get(_data?.id))
  })
  Loom.LoomHooks.on('item.created', (data) => expose(Loom.items.get(data?.id)))
  Loom.LoomHooks.on('item.updated', (data) => expose(Loom.items.get(data?.id)))
}
