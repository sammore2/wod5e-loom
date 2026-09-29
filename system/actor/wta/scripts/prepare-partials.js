import { prepareGifts, prepareGiftPowers, prepareFormData } from './prepare-data.js'
import { getActorItems } from '../../../scripts/embedded-items.js'

export const prepareGiftsContext = async function (context, actor) {
  const actorData = actor?.system || actor?.systemData || {}

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
  if (actorData?.selectedGift) {
    const giftKey = actorData.selectedGift
    context.selectedGift = {
      ...gifts[giftKey],
      id: giftKey
    }
    context.enrichedSelectedGiftDescription =
      await Loom.applications.ux.TextEditor.implementation.enrichHTML(
        context.selectedGift?.description || ''
      )
  }

  // Get power data if any power is currently selected
  if (actorData?.selectedGiftPower) {
    // `getActorItems()` em vez de `actor.items` — mesma causa já corrigida em
    // vtm/scripts/prepare-partials.js: itens crus não têm `.system`, e a descrição/ícone
    // de rolar dados do dom sumiam calado.
    context.selectedGiftPower = getActorItems(actor).find((item) => item.id === actorData.selectedGiftPower)

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
