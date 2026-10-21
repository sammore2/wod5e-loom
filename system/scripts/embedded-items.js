// Embedded item management on actors. Items are created through the
// actor-scoped REST API (/actors/:actorId/items) and linked to the actor.

import { normalizeUpdate } from './document-updates.js'

/**
 * Retorna os itens vinculados ao ator, priorizando a coleção/array local do próprio ator.
 * Garante que `.system` esteja sempre acessível mesmo quando a row for crua.
 */
export function getActorItems(actor) {
  if (!actor) return []

  let items = []
  if (Array.isArray(actor._embeddedItems) && actor._embeddedItems.length > 0) {
    items = actor._embeddedItems
  } else if (Array.isArray(actor.sheet?._embeddedItems) && actor.sheet._embeddedItems.length > 0) {
    items = actor.sheet._embeddedItems
  } else if (Array.isArray(actor._source?.items) && actor._source.items.length > 0) {
    items = actor._source.items
  } else if (Array.isArray(actor._data?.items) && actor._data.items.length > 0) {
    items = actor._data.items
  } else if (Array.isArray(actor.items) && actor.items.length > 0) {
    items = actor.items
  } else if (Array.isArray(actor.systemData?.items) && actor.systemData.items.length > 0) {
    items = actor.systemData.items
  } else if (actor.items?.contents && actor.items.contents.length > 0) {
    items = Array.from(actor.items.contents)
  } else if (Array.isArray(actor._embeddedItems)) {
    items = actor._embeddedItems
  } else if (Array.isArray(actor.sheet?._embeddedItems)) {
    items = actor.sheet._embeddedItems
  } else if (Array.isArray(actor.items)) {
    items = actor.items
  }

  // Fallback para Loom.items apenas se o ator não tiver nenhum item populado
  if (items.length === 0 && Loom.items?.contents) {
    items = Loom.items.contents.filter(
      (item) => item.actorId === actor.id || item.parent?.id === actor.id
    )
  }

  return items.map((item) => {
    const needsSystem = !item.system && (item.systemData || item.data)
    // Raw REST rows (POST /actors/:id/items response, or a row pulled straight
    // from the actor's own embedded array) never carry `.uuid` — that's a
    // getter only real document class instances have. Every template that
    // reads `{{item.uuid}}` for a `data-item-uuid` roll trigger got an empty
    // attribute for these, and Loom.fromUuidSync can't resolve embedded items
    // anyway (see item-roll.js's note — they're deliberately kept out of the
    // world items collection), so `Item.<id>` only needs to be well-formed
    // enough for that code's own id-extraction fallback to work.
    const needsUuid = !item.uuid && item.id
    // Mesma razão do uuid: raw rows não têm `.update()` (só documentos "vivos"
    // do document-sheet.ts têm). Sem isto, todo clique num poder de disciplina
    // caía no fallback REST de `updateItemData` — funcional, mas martelava o
    // console warning a cada clique. Dar um `.update()` de verdade aqui remove
    // o aviso na origem em vez de só engolir o warn.
    const needsUpdate = typeof item.update !== 'function'
    if (!needsSystem && !needsUuid && !needsUpdate) return item
    return new Proxy(item, {
      get(target, prop, receiver) {
        if (needsSystem && prop === 'system') return target.systemData ?? target.data ?? {}
        if (needsUuid && prop === 'uuid') return `Item.${target.id}`
        if (needsUpdate && prop === 'update') {
          return async (changes) => {
            const normalized = normalizeUpdate(changes, 'data')
            const actorId = target.actorId || target.parent?.id
            return actorId
              ? Loom.api.put(`/actors/${actorId}/items/${target.id}`, normalized)
              : Loom.api.put(`/items/${target.id}`, normalized)
          }
        }
        return Reflect.get(target, prop, receiver)
      }
    })
  })
}

// Update an item document, falling back to the REST API when the object
// at hand isn't a live document instance (e.g. a raw row)
export async function updateItemData(item, changes) {
  if (!item) return

  if (typeof item.update === 'function') {
    return item.update(changes)
  }

  if (item.id) {
    if (!updateItemData._warned) {
      updateItemData._warned = true
      console.warn(
        'World of Darkness 5e | Item document without .update() encountered',
        '(constructor:', item.constructor?.name ?? typeof item, ') — using REST fallback.'
      )
    }
    const normalized = normalizeUpdate(changes, 'data')
    const actorId = item.actorId || item.parent?.id
    if (actorId) {
      return Loom.api.put(`/actors/${actorId}/items/${item.id}`, normalized)
    }
    return Loom.api.put(`/items/${item.id}`, normalized)
  }

  console.warn('World of Darkness 5e | Cannot update item without id:', item?.name)
}

export async function createEmbeddedItems(actor, itemsData) {
  if (!actor) return []

  const entries = itemsData instanceof Array ? itemsData : [itemsData]

  if (typeof actor.createEmbeddedDocuments === 'function') {
    return actor.createEmbeddedDocuments('Item', entries)
  }

  const created = []

  for (const entry of entries) {
    const itemData = entry.system ?? entry.data ?? {}
    let item
    if (actor.id) {
      // POST /actors/:actorId/items vincula o item diretamente ao ator (embedded)
      // e não cria item global no world nem polui a aba de Itens da barra lateral.
      item = await Loom.api.post(`/actors/${actor.id}/items`, {
        name: entry.name,
        type: entry.type,
        data: itemData,
        imgUrl: entry.imgUrl ?? entry.img ?? '',
        flags: entry.flags
      })
    } else {
      item = await Loom.api.post('/items', {
        name: entry.name,
        type: entry.type,
        data: itemData,
        imgUrl: entry.imgUrl ?? entry.img ?? '',
        flags: entry.flags
      })
    }

    if (item) {
      if (Array.isArray(actor.items)) {
        actor.items.push(item)
      }
      created.push(item)
    }
  }

  return created
}

export async function deleteEmbeddedItems(actor, itemIds) {
  if (!actor) return

  const ids = itemIds instanceof Array ? itemIds : [itemIds]

  if (typeof actor.deleteEmbeddedDocuments === 'function') {
    return actor.deleteEmbeddedDocuments('Item', ids)
  }

  for (const id of ids) {
    if (actor?.id) {
      await Loom.api.delete(`/actors/${actor.id}/items/${id}`)
    } else {
      await deleteItem(id)
    }
    if (Loom.items?.get?.(id)) {
      Loom.items.delete(id)
    }
    if (Array.isArray(actor.items)) {
      const idx = actor.items.findIndex((i) => (i.id ?? i._id) === id)
      if (idx > -1) actor.items.splice(idx, 1)
    }
  }
}

// Delete an item through the REST API
export async function deleteItem(itemId) {
  if (!itemId) return
  return Loom.api.delete(`/items/${itemId}`)
}
