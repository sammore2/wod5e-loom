export function _onSortItem(event, actor, itemData) {
  // Get the drag source and drop target
  const items = actor.items
  const findItem = (id) => items.find((item) => item.id === id)
  const source = findItem(itemData._id ?? itemData.id)
  const dropTarget = event.target.closest('[data-item-id]')
  if (!dropTarget || !source) return
  const target = findItem(dropTarget.dataset.itemId)

  // Don't sort on yourself
  if (!target || source.id === target.id) return

  // Identify sibling items based on adjacent HTML elements
  const siblings = []
  for (const el of dropTarget.parentElement.children) {
    const siblingId = el.dataset.itemId
    if (siblingId && siblingId !== source.id) {
      const sibling = findItem(siblingId)
      if (sibling) siblings.push(sibling)
    }
  }

  // Perform the sort
  const sortUpdates = Loom.utils.performIntegerSort(source, {
    target,
    siblings
  })

  // Apply sort values individually (Loom has no embedded-document batch update)
  for (const u of sortUpdates) {
    const doc = u.target
    const update = u.update
    if (doc?.update && update?.sort !== undefined) doc.update({ sort: update.sort })
  }
}
