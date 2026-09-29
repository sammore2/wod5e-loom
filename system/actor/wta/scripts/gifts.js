import { updateItemData, getActorItems } from '../../../scripts/embedded-items.js'
import { WOD5eDice } from '../../../scripts/system-rolls.js'
import { getActiveModifiers } from '../../../scripts/rolls/situational-modifiers.js'
import { _damageWillpower } from '../../../scripts/rolls/willpower-damage.js'
import { applySystemPatch } from '../../scripts/counters.js'
import { Gifts } from '../../../api/def/gifts.js'

export const _onAddGift = async function (event) {
  event.preventDefault()

  // Top-level variables
  const actor = this.actor

  // Secondary variables
  const giftList = WOD5E.Gifts.getList({})
  // `StringField.choices` espera string por chave — `getList()` devolve um
  // objeto ({label, displayName, ...}) por chave, igual `disciplines.js` do
  // vampiro já tratava. Sem isto, o dropdown mostrava "[object Object]".
  const giftChoices = Object.fromEntries(
    Object.entries(giftList).map(([key, val]) => [key, val.displayName || val.label || key])
  )

  // Build the options for the select dropdown
  const content = new Loom.fields_v14.StringField({
    choices: giftChoices,
    label: Loom.i18n.localize('WOD5E.WTA.SelectGift'),
    required: true
  }).toFormGroup(
    {},
    {
      name: 'gift'
    }
  ).outerHTML

  // Prompt a dialog to determine which gift we're adding
  const giftSelected = await Loom.LoomDialog.prompt({
    window: {
      title: Loom.i18n.localize('WOD5E.WTA.AddGift')
    },
    classes: ['wod5e', 'dialog', 'werewolf', 'dialog'],
    content,
    ok: {
      callback: (event, button, dialog) =>
        new Loom.LoomFormData(dialog.getBody()).object.gift
    },
    modal: true
  })

  if (giftSelected) {
    // Um único `actor.update()` juntando visibilidade + seleção — do contrário
    // 3 updates separados em sequência disparam a guarda de loop do core
    // (mutation-loop-guard) e cada um sobrescreve `system` sem levar o anterior
    // em conta, fazendo o dom "aparecer e sumir" da ficha.
    const systemData = applySystemPatch(actor.systemData, [
      [['gifts', giftSelected, 'visible'], true],
      [['gifts', giftSelected, 'selected'], true],
      [['selectedGift'], giftSelected],
      [['selectedGiftPower'], '']
    ])

    const previouslySelectedGift = actor.system?.selectedGift
    if (previouslySelectedGift && previouslySelectedGift !== giftSelected) {
      systemData.gifts[previouslySelectedGift] ??= {}
      systemData.gifts[previouslySelectedGift].selected = false
    }

    await actor.update({ systemData })
  }
  await this._reloadDocument?.()
}

/** Handle removing a gift from an actor */
export const _onRemoveGift = async function (event, target) {
  event.preventDefault()

  // Top-level variables
  const actor = this.actor
  const gift = target.getAttribute('data-gift')

  const systemData = applySystemPatch(actor.systemData, [
    [['gifts', gift, 'visible'], false]
  ])
  await actor.update({ systemData })
  await this._reloadDocument?.()
}

export const _onGiftCost = async function (actor, item, rollMode) {
  // Secondary variables
  const cost = item.system.cost
  const willpowerCost = item.system.willpowercost
  let selectors = []

  // Apply rollMode from chat if none is set
  if (!rollMode) rollMode = Loom.settings.get('core', 'rollMode')

  // If we're rolling no rage dice and we're spending willpower, then just damage willpower
  if (cost < 1 && willpowerCost > 0) {
    _damageWillpower(null, null, actor, willpowerCost, rollMode)
  } else if (cost > 0) {
    selectors = ['rage']

    // Handle getting any situational modifiers
    const activeModifiers = await getActiveModifiers({
      actor,
      selectors
    })

    // Send the roll to the system
    WOD5eDice.Roll({
      advancedDice: cost + activeModifiers.totalValue,
      title: `${Loom.i18n.localize('WOD5E.WTA.RageDice')} - ${item.name}`,
      actor,
      rollMode,
      disableBasicDice: true,
      decreaseRage: true,
      selectors,
      quickRoll: true,
      willpowerDamage: willpowerCost
    })
  }
}

/** Post Gift description to the chat */
export const _onGiftToChat = async function (event, target) {
  event.preventDefault()

  // Top-level variables
  const actor = this.actor
  const key = target.getAttribute('data-gift')
  const gift = actor.system.gifts[key]
  // `actor.system.gifts[key]` só guarda {visible, selected} — nome/label vem
  // da lista estática (mesma fonte usada no dropdown de "Adicionar Dom"),
  // por isso `gift.displayName` sempre vinha undefined (card sem título).
  const giftDef = Gifts.getList({})[key] || {}

  Loom.ChatMessage.create({
    // Sem isto, a mensagem saía sem falante (mesmo bug já corrigido em
    // `_onFormToChat`) e o card do chat mostrava o card vazio/"Gamemaster".
    speaker: Loom.ChatMessage.getSpeaker({ actor }),
    flags: {
      wod5e: {
        name: giftDef.displayName || giftDef.label || key,
        // `icons/svg/dice-target.svg` é caminho do sistema original — não existe neste
        // projeto (o servidor devolve o fallback de SPA, HTML, não a imagem).
        img: 'marketplace/rulesets/wod5e/assets/icons/items/gift.png',
        description: gift?.description || ''
      }
    }
  })
}

// Mesma proteção de disciplines.js (vtm): clicar rápido demais enquanto o ciclo anterior
// ainda está em voo disparava outro update completo por cima, e sem forçar reload depois
// o array local de itens ficava desatualizado até o próximo re-render — dois poderes/gifts
// podiam aparecer selecionados ao mesmo tempo, e cliques repetidos esbarravam no disjuntor
// de loop do servidor.
const _giftSelectionInFlight = new Set()

/** Select a gift to display */
export const _onSelectGift = async function (event, target) {
  event.preventDefault()

  // Top-level variables
  const actor = this.actor
  const gift = target.getAttribute('data-gift')

  if (_giftSelectionInFlight.has(actor.id)) return
  _giftSelectionInFlight.add(actor.id)
  try {
    await _updateSelectedGift(actor, gift)
    if (typeof this._reloadDocument === 'function') await this._reloadDocument()
  } finally {
    _giftSelectionInFlight.delete(actor.id)
  }
}

/** Select a power to display */
export const _onSelectGiftPower = async function (event, target) {
  event.preventDefault()

  // Top-level variables
  const actor = this.actor
  const power = target.getAttribute('data-power')

  if (_giftSelectionInFlight.has(actor.id)) return
  _giftSelectionInFlight.add(actor.id)
  try {
    await _updateSelectedGiftPower(actor, power)
    if (typeof this._reloadDocument === 'function') await this._reloadDocument()
  } finally {
    _giftSelectionInFlight.delete(actor.id)
  }
}

export const _updateSelectedGiftPower = async function (actor, power) {
  // Variável de saída pro campo selectedGiftPower do ator
  let selectedGiftPower = ''

  // `getActorItems()` em vez de `actor.items`: este último às vezes é um array de rows
  // cruas (sem o acessor `.system`), dependendo do caminho por onde o ator foi carregado —
  // `powerItem.system.giftType` estourava "Cannot read properties of undefined".
  const items = getActorItems(actor)

  // Make sure we actually have a valid power defined
  const powerItem = power ? items.find((item) => item.id === power) : null
  if (powerItem) {
    const gift = powerItem.system?.giftType

    // Update the selected power
    selectedGiftPower = power
    // Sequenciado (await) — os updates abaixo tocam o mesmo ator; disparados em
    // paralelo, cada um calcula seu merge a partir do mesmo estado desatualizado e o
    // que responder por último apaga a mudança do outro, sem erro nenhum no console.
    await updateItemData(powerItem, { data: applySystemPatch(powerItem.data, [[['selected'], true]]) })

    // Update the selected gifts
    await _updateSelectedGift(actor, gift)
  }

  // Unselect the previously selected power
  const previouslySelectedPower = actor.system?.selectedGiftPower
  const prevItem = previouslySelectedPower && previouslySelectedPower !== power
    ? items.find((item) => item.id === previouslySelectedPower)
    : null
  if (prevItem) {
    await updateItemData(prevItem, { data: applySystemPatch(prevItem.data, [[['selected'], false]]) })
  }

  // Update the actor data
  const systemData = applySystemPatch(actor.systemData, [
    [['selectedGiftPower'], selectedGiftPower]
  ])
  await actor.update({ systemData })
}

export const _updateSelectedGift = async function (actor, gift) {
  const patches = []

  // Make sure we actually have a gift defined
  if (gift && actor.system.gifts[gift]) {
    patches.push([['selectedGift'], gift])
    patches.push([['gifts', gift, 'selected'], true])
  } else {
    // Revert to an empty string
    patches.push([['selectedGift'], ''])
  }

  // Unselect the previously selected gift
  const previouslySelectedGift = actor.system?.selectedGift
  if (previouslySelectedGift && previouslySelectedGift !== gift) {
    patches.push([['gifts', previouslySelectedGift, 'selected'], false])
  }

  // Update the actor data
  const systemData = applySystemPatch(actor.systemData, patches)
  await actor.update({ systemData })
}
