export const MigrateRolldataToDicepools = async function () {
  // Compendium document APIs differ under Loom; only world data is migrated here
  const actorsList = Loom.actors
  const itemsList = Loom.items
  const totalIterations = actorsList.size + itemsList.size
  const migrationIDs = []

  // If there's nothing to go through, then just resolve and move on.
  if (totalIterations === 0) {
    return []
  }

  // Fix dicepools of rollable items in the world
  for (const item of itemsList) {
    // If the item was previously rollable and doesn't already have a filled dicepool, migrate the rolldata to the new format
    if (
      (item.system?.rollable || item.type === 'customRoll') &&
      Loom.utils.isEmpty(item.system?.dicepool)
    ) {
      await item.update({
        system: buildDicepoolUpdate(item)
      })
    }
  }

  // Fix dicepools of rollable items on actors
  for (const actor of actorsList) {
    let hasFixedItems = false

    for (const item of actor.items) {
      // If the item was previously rollable and doesn't already have a filled dicepool, migrate the rolldata to the new format
      if (
        (item.system?.rollable || item.type === 'customRoll') &&
        item?.system?.dice1 &&
        item?.system?.dice2 &&
        Loom.utils.isEmpty(item.system?.dicepool)
      ) {
        hasFixedItems = true

        await item.update({
          system: buildDicepoolUpdate(item)
        })
      }
    }

    if (hasFixedItems) {
      Loom.ui?.notifications.info(`Fixing actor ${actor.name}: Migrating roll data of items.`)
      migrationIDs.push(actor.id)
    }
  }

  return migrationIDs

  function buildDicepoolUpdate(item) {
    const dicepool = {}

    if (item?.system?.dice1) {
      const randomID = Loom.utils.randomID(8)

      dicepool[randomID] = {
        path: getDicePath(item.system.dice1, item.system)
      }
    }

    if (item?.system?.dice2) {
      const randomID = Loom.utils.randomID(8)

      dicepool[randomID] = {
        path: getDicePath(item.system.dice2, item.system)
      }
    }

    return {
      dicepool
    }
  }

  // Function to change a given dice into its path
  function getDicePath(string, data) {
    string.toLowerCase()

    const skillsList = WOD5E.Skills.getList({})
    const attributesList = WOD5E.Attributes.getList({})

    if (string in skillsList) {
      return `skills.${string}`
    } else if (string in attributesList) {
      return `attributes.${string}`
    } else if (string === 'discipline') {
      if (data.discipline === 'rituals') {
        return 'disciplines.sorcery'
      } else if (data.discipline === 'ceremonies') {
        return 'disciplines.oblivion'
      } else {
        return `disciplines.${data.discipline}`
      }
    } else if (string === 'gift') {
      return `gifts.${data.gift}`
    }
  }
}
