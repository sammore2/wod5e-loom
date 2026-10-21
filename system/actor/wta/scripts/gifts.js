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

// Fila serializada por ator para persistir a seleção em segundo plano sem disparar
// múltiplos PUTs simultâneos e sem congelar ou atrasar a interface do usuário.
const _actorGiftSelectionQueues = new Map()

function enqueueActorGiftSelection(actor, updateFn) {
  const actorId = actor?.id || 'default'
  const current = _actorGiftSelectionQueues.get(actorId) || Promise.resolve()
  const next = current
    .then(async () => {
      await updateFn()
    })
    .catch((err) => {
      console.error('World of Darkness 5e | Error persisting gift selection:', err)
    })
    .finally(() => {
      if (_actorGiftSelectionQueues.get(actorId) === next) {
        _actorGiftSelectionQueues.delete(actorId)
      }
    })
  _actorGiftSelectionQueues.set(actorId, next)
  return next
}

/** Select a gift to display */
export const _onSelectGift = async function (event, target) {
  event?.preventDefault?.()

  // Top-level variables
  const actor = this.actor
  const element = target || event?.currentTarget || event?.target?.closest?.('[data-gift]')
  const gift = element?.getAttribute?.('data-gift') || element?.dataset?.gift

  if (!actor || !gift) return

  // Atualização otimista imediata em memória (0ms de latência percebida)
  const prev = actor.systemData?.selectedGift || actor.system?.selectedGift
  if (actor.systemData) {
    actor.systemData.selectedGift = gift
    if (actor.systemData.gifts?.[gift]) {
      actor.systemData.gifts[gift].selected = true
    }
    if (prev && prev !== gift && actor.systemData.gifts?.[prev]) {
      actor.systemData.gifts[prev].selected = false
    }
  }
  if (actor.system) {
    actor.system.selectedGift = gift
    if (actor.system.gifts?.[gift]) {
      actor.system.gifts[gift].selected = true
    }
    if (prev && prev !== gift && actor.system.gifts?.[prev]) {
      actor.system.gifts[prev].selected = false
    }
  }

  // Re-renderiza a tela localmente no mesmo instante
  if (typeof this.rerenderBody === 'function') {
    this.rerenderBody()
  } else if (typeof this.render === 'function') {
    this.render(false)
  }

  // Persiste a seleção no servidor em segundo plano de forma enfileirada
  enqueueActorGiftSelection(actor, async () => {
    await _updateSelectedGift(actor, gift)
  })
}

/** Select a power to display */
export const _onSelectGiftPower = async function (event, target) {
  event?.preventDefault?.()

  // Top-level variables
  const actor = this.actor
  const element = target || event?.currentTarget || event?.target?.closest?.('[data-power]')
  const power = element?.getAttribute?.('data-power') || element?.dataset?.power

  if (!actor || !power) return

  const items = getActorItems(actor)
  const powerItem = items.find((item) => item.id === power)
  const gift = powerItem?.system?.giftType

  // Atualização otimista imediata em memória (0ms de latência perceida)
  if (actor.systemData) {
    actor.systemData.selectedGiftPower = power
    if (gift) {
      actor.systemData.selectedGift = gift
      if (actor.systemData.gifts?.[gift]) {
        actor.systemData.gifts[gift].selected = true
      }
    }
  }
  if (actor.system) {
    actor.system.selectedGiftPower = power
    if (gift) {
      actor.system.selectedGift = gift
      if (actor.system.gifts?.[gift]) {
        actor.system.gifts[gift].selected = true
      }
    }
  }

  // Re-renderiza a tela localmente no mesmo instante
  if (typeof this.rerenderBody === 'function') {
    this.rerenderBody()
  } else if (typeof this.render === 'function') {
    this.render(false)
  }

  // Persiste a seleção no servidor em segundo plano de forma enfileirada
  enqueueActorGiftSelection(actor, async () => {
    await _updateSelectedGiftPower(actor, power)
  })
}

export const _updateSelectedGiftPower = async function (actor, power) {
  let selectedGiftPower = ''
  const items = getActorItems(actor)
  const powerItem = power ? items.find((item) => item.id === power) : null

  const patches = []
  if (powerItem) {
    const gift = powerItem.system?.giftType
    selectedGiftPower = power

    if (gift) {
      patches.push([['selectedGift'], gift])
      patches.push([['gifts', gift, 'selected'], true])

      const previouslySelectedGift = actor.system?.selectedGift || actor.systemData?.selectedGift
      if (previouslySelectedGift && previouslySelectedGift !== gift) {
        patches.push([['gifts', previouslySelectedGift, 'selected'], false])
      }
    }
  }

  patches.push([['selectedGiftPower'], selectedGiftPower])

  // Um único update no documento do ator, sem requisições REST adicionais em itens
  const systemData = applySystemPatch(actor.systemData ?? actor.system, patches)
  if (actor.systemData) {
    actor.systemData.selectedGiftPower = selectedGiftPower
    if (powerItem?.system?.giftType) {
      actor.systemData.selectedGift = powerItem.system.giftType
    }
  }
  if (actor.system) {
    actor.system.selectedGiftPower = selectedGiftPower
    if (powerItem?.system?.giftType) {
      actor.system.selectedGift = powerItem.system.giftType
    }
  }

  await actor.update({ systemData })
}

export const _updateSelectedGift = async function (actor, gift) {
  const patches = []

  // Make sure we actually have a gift defined
  if (gift && (actor.system?.gifts?.[gift] || actor.systemData?.gifts?.[gift])) {
    patches.push([['selectedGift'], gift])
    patches.push([['gifts', gift, 'selected'], true])
  } else {
    // Revert to an empty string
    patches.push([['selectedGift'], ''])
  }

  // Unselect the previously selected gift
  const previouslySelectedGift = actor.system?.selectedGift || actor.systemData?.selectedGift
  if (previouslySelectedGift && previouslySelectedGift !== gift) {
    patches.push([['gifts', previouslySelectedGift, 'selected'], false])
  }

  // Update the actor data
  const systemData = applySystemPatch(actor.systemData ?? actor.system, patches)
  if (actor.systemData) {
    actor.systemData.selectedGift = gift || ''
  }
  if (actor.system) {
    actor.system.selectedGift = gift || ''
  }
  await actor.update({ systemData })
}
