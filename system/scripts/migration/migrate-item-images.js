export const MigrateItemImages = async function () {
  const actorsList = Loom.actors
  const totalIterations = actorsList.size
  const migrationIDs = []

  // If there's nothing to go through, then just resolve and move on.
  if (totalIterations === 0) {
    return []
  }

  // Fix image data across items (v4.0.0)
  for (const actor of actorsList) {
    const actorItems = actor.items
    let hasFixedItems = false

    for (const item of actorItems) {
      const img = item.img ?? item.imgUrl ?? ''

      // Check if there are any instances of /systems/wod5e/assets/icons/powers/ in the item image
      if (countInstances(img, '/systems/wod5e/assets/icons/powers/') > 0) {
        hasFixedItems = true

        await item.update({
          imgUrl: img.replace(
            /\/systems\/wod5e\/assets\/icons\/powers\//,
            'marketplace/rulesets/wod5e/assets/icons/items/'
          )
        })
      }
    }

    if (hasFixedItems) {
      Loom.ui?.notifications.info(`Fixing actor ${actor.name}: Migrating image data.`)
      migrationIDs.push(actor.id)
    }
  }

  return migrationIDs

  // Function to search through the given string
  function countInstances(string, searchTerm) {
    string ??= ''
    let count = 0

    // Regex
    const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
    const matches = string.match(regex)

    // So long as there's some matches, increase the count
    if (matches !== null) {
      count += matches.length
    }

    return count
  }
}
