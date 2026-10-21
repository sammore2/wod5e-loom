import { prepareGifts, prepareGiftPowers, prepareFormData } from './prepare-data.js'
import { getActorItems } from '../../../scripts/embedded-items.js'

export const prepareGiftsContext = async function (context, actor) {
  const actorData = actor?.systemData || actor?.system || {}
  const selectedGiftKey = actor?.systemData?.selectedGift ?? actor?.system?.selectedGift
  const selectedPowerId = actor?.systemData?.selectedGiftPower ?? actor?.system?.selectedGiftPower

  // Tab data
  context.tab = context.tabs?.gifts || {}

  // Part-specific data
  const derived = actor?.derivedData || {}
  let gifts = derived.gifts
  if (!gifts || Object.keys(gifts).length === 0) {
    gifts = await prepareGifts(actor)
  }
  context.gifts = await prepareGiftPowers(gifts)
  context.renown = actorData.renown || {}

  // Get gift data if any gift is currently selected
  if (selectedGiftKey) {
    context.selectedGift = {
      ...gifts[selectedGiftKey],
      id: selectedGiftKey
    }
    context.enrichedSelectedGiftDescription =
      await Loom.applications.ux.TextEditor.implementation.enrichHTML(
        context.selectedGift?.description || ''
      )
  }

  // Ensure selection state is synchronized across the gifts list and powers
  if (context.gifts) {
    for (const [key, gift] of Object.entries(context.gifts)) {
      gift.selected = (selectedGiftKey === key)
      if (Array.isArray(gift.powers)) {
        for (const power of gift.powers) {
          if (!power.system) power.system = {}
          power.system.selected = Boolean(selectedPowerId && power.id === selectedPowerId)
        }
      }
    }
  }

  // Get power data if any power is currently selected
  if (selectedPowerId) {
    // `getActorItems()` em vez de `actor.items` — mesma causa já corrigida em
    // vtm/scripts/prepare-partials.js: itens crus não têm `.system`, e a descrição/ícone
    // de rolar dados do dom sumiam calado.
    context.selectedGiftPower = getActorItems(actor).find((item) => item.id === selectedPowerId)

    if (context.selectedGiftPower?.system?.description) {
      context.selectedGiftPowerDescription =
        await Loom.applications.ux.TextEditor.implementation.enrichHTML(
          context.selectedGiftPower.system.description
        )
    }
  }

  return context
}

export const prepareWolfContext = async function (context, actor) {
  const actorData = actor?.system || actor?.systemData || {}

  // Tab data
  context.tab = context.tabs?.wolf || {}

  // Part-specific data with full form definitions merged
  context.forms = await prepareFormData(actorData.forms, actor)
  context.balance = actorData.balance || {}
  context.rage = actorData.rage || { value: 1, max: 5 }

  return context
}
