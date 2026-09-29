import { _rollItem } from '../actor/scripts/item-roll.js'

// NOTE: This entirely needs to be syncronous
// because the hotbarDrop function will skip over the system
// trying to inject its own macro if we make the function async
export function loadHotbarDrop() {
  Loom.LoomHooks.on('hotbarDrop', (hotbar, data, slot) => {
    const item = Loom.fromUuidSync(data.uuid)

    // Check to make sure the item exists
    if (!item) return

    // Do all the item validation logic and creation here
    handleItemDrop(item, data, slot)

    // Prevent the default handling
    return false
  })
}

export async function handleItemDrop(item, data, slot) {
  let command

  // Check to make sure the item is.. rollable!
  // If it isn't, we fall back to the default command
  // If it is, we use our system's custom roll command
  if (item.system?.dicepool === undefined) {
    command = `await Loom.applications.ui.Hotbar.toggleDocumentSheet("${data.uuid}")`
  } else {
    command = `WOD5E.api._onRollItemFromMacro(${JSON.stringify(item.name)})`
  }

  // Create the macro
  const macroCreator = Loom.macros?.create?.bind(Loom.macros) || (typeof Macro !== 'undefined' ? Macro.create.bind(Macro) : null)
  if (!macroCreator) return

  const macro = await macroCreator({
    name: item.name,
    type: 'script',
    img: item.imgUrl,
    command
  })

  // Add the macro to the hotbar
  Loom.user.assignHotbarMacro(macro, slot, {
    fromSlot: data.slot
  })
}

// Exposed as WOD5E.api._onRollItemFromMacro in main.js.
export function _onRollItemFromMacro(itemName) {
  const speaker = Loom.ChatMessage.getSpeaker()
  let actor
  if (speaker.token) actor = Loom.actors.tokens[speaker.token]
  if (!actor) actor = Loom.actors.get(speaker.actor)
  const item = actor ? actor.items.find((i) => i.name === itemName) : null
  if (!item)
    return Loom.ui?.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`)

  _rollItem(actor, item)
}
