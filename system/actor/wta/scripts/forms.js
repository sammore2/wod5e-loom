import { WOD5eDice } from '../../../scripts/system-rolls.js'
import { getActiveModifiers } from '../../../scripts/rolls/situational-modifiers.js'
import { WereformApplication } from '../applications/wereform-application.js'

export const _onLostTheWolf = async function (actor) {
  // Variables yet to be defined
  let buttons = {}

  // If automatedRage is disabled, we don't want to show this dialogue
  if (!Loom.settings.get('wod5e', 'automatedRage')) return

  // Define the template to be used
  const template = `
    <div class="form-group">
        <label>${Loom.i18n.localize('WOD5E.WTA.LostWolfShiftDown')}</label>
    </div>`

  // Define the buttons and push them to the buttons variable
  buttons = [
    {
      action: 'homid',
      label: Loom.i18n.localize('WOD5E.WTA.HomidName'),
      default: true
    },
    {
      action: 'lupus',
      label: Loom.i18n.localize('WOD5E.WTA.LupusName')
    },
    {
      action: 'override',
      label: Loom.i18n.localize('WOD5E.WTA.StayInCurrentForm')
    }
  ]

  const result = await Loom.LoomDialog.wait({
    window: { title: Loom.i18n.localize('WOD5E.WTA.LostTheWolf') },
    content: template,
    buttons,
    classes: ['wod5e', 'werewolf']
  })

  if (result === 'override') {
    actor.update({ 'system.formOverride': true })
  } else {
    const { patch, newImage } = _getFormTokenPatch(actor, result)
    actor.update({ 'system.activeForm': result, ...patch })
    _propagateTokenImage(actor, newImage)
  }
}

export const _onSpcShiftForm = async function () {
  // Top-level variables
  const actor = this.actor

  // Variables yet to be defined
  let buttons = {}

  // Define the template to be used
  const template = `
    <div class="form-group">
        <label>${Loom.i18n.localize('WOD5E.WTA.ChooseFormShift')}</label>
    </div>`

  // Define the buttons and push them to the buttons variable
  buttons = [
    {
      action: 'homid',
      label: Loom.i18n.localize('WOD5E.WTA.HomidName'),
      default: true
    },
    {
      action: 'glabro',
      label: Loom.i18n.localize('WOD5E.WTA.GlabroName')
    },
    {
      action: 'crinos',
      label: Loom.i18n.localize('WOD5E.WTA.CrinosName')
    },
    {
      action: 'hispo',
      label: Loom.i18n.localize('WOD5E.WTA.HispoName')
    },
    {
      action: 'lupus',
      label: Loom.i18n.localize('WOD5E.WTA.LupusName')
    }
  ]

  const result = await Loom.LoomDialog.wait({
    window: { title: Loom.i18n.localize('WOD5E.WTA.SwapForm') },
    content: template,
    buttons,
    classes: ['wod5e', 'werewolf']
  })

  if (result) {
    const { patch, newImage } = _getFormTokenPatch(actor, result)
    actor.update({ 'system.activeForm': result, ...patch })
    _propagateTokenImage(actor, newImage)
  }
}

export const _onShiftForm = async function (event, target) {
  event.preventDefault()

  // Top-level variables
  const actor = this.actor
  const form = target.getAttribute('data-form')

  switch (form) {
    case 'glabro':
      handleFormChange(event, target, actor, 'glabro', 1)
      break
    case 'crinos':
      handleFormChange(event, target, actor, 'crinos', 2)
      break
    case 'hispo':
      handleFormChange(event, target, actor, 'hispo', 1)
      break
    case 'lupus': {
      const { patch, newImage } = _getFormTokenPatch(actor, 'lupus')
      actor.update({ 'system.activeForm': 'lupus', ...patch })
      _propagateTokenImage(actor, newImage)
      _onFormToChat(event, target, actor)
      break
    }
    default: {
      const { patch, newImage } = _getFormTokenPatch(actor, 'homid')
      actor.update({ 'system.activeForm': 'homid', ...patch })
      _propagateTokenImage(actor, newImage)
      _onFormToChat(event, target, actor)
    }
  }
}

export const handleFormChange = async function (event, target, actor, form, diceCount) {
  // Variables yet to be defined
  const selectors = []

  // If we get a call to change the active form without a new form selected, do nothing
  if (actor.system.activeForm === form) return

  // If automatedRage is turned on and the actor's rage is 0, present a warning
  if (Loom.settings.get('wod5e', 'automatedRage') && actor.system.rage.value === 0) {
    _onInsufficientRage(actor, form)
  } else {
    // Variables
    const formData = actor.system.forms[form]

    // Handle getting any situational modifiers
    const activeModifiers = await getActiveModifiers({
      actor,
      selectors
    })

    // Roll the rage dice necessary
    await WOD5eDice.Roll({
      advancedDice: diceCount + activeModifiers.totalValue,
      title: form,
      flavor: formData?.description || '',
      actor,
      data: actor.system,
      quickRoll: true,
      disableBasicDice: true,
      decreaseRage: true,
      selectors,
      callback: async (err) => {
        if (err) console.log('World of Darkness 5e | ' + err)

        // A queda de Fúria por falha já foi aplicada internamente pelo próprio
        // `WOD5eDice.Roll` (`decreaseRage: true` → `_decreaseRage`, usando o MESMO
        // dado "advanced" que o card de chat mostra, via `roll.advancedDice`).
        // Reler `actor.system.rage.value` aqui (já atualizado) em vez de recalcular
        // falhas a partir de `rollData.terms[2]` — esse índice fixo pressupõe um
        // termo "0d10" vazio antes do termo de fúria, e quebra silenciosamente
        // quando a fórmula não tem esse termo (ex.: `disableBasicDice`), estourando
        // o callback inteiro e travando a troca de forma mesmo com a fúria já
        // debitada certinho pelo mecanismo interno.
        if (actor.system.rage.value > 0) {
          const { patch, newImage } = _getFormTokenPatch(actor, form)
          actor.update({ 'system.activeForm': form, ...patch })
          _onFormToChat(event, target, actor)
          _propagateTokenImage(actor, newImage)
        }
      }
    })
  }
}

export const _onFormToChat = async function (event, target, originActor) {
  event.preventDefault()

  // Top-level variables
  const actor = originActor || this.actor
  const form = target.getAttribute('data-form')

  // Secondary variables
  const formData = actor.system.forms[form]
  const formName = formData.displayName
  const formAbilities = formData.attributes

  // Define the chat message — card de "info" (`flags.wod5e.{name,img,description}`),
  // o MESMO padrão já usado por `_onGiftToChat`/`_onEdgeToChat`/`_onDisciplineToChat`.
  // O core renderiza `description` como HTML puro (sem escapar) pra esse tipo de card —
  // usar `content` aqui (texto solto) caía no fallback de chat comum, que escapa tudo
  // (o HTML aparecia literal, como texto) e ainda perdia o nome/avatar do Ator.
  let description = formData?.description ? `<p>${formData?.description}</p>` : ''
  if (formAbilities && formAbilities.length > 0) {
    description = description + '<ul>'
    formAbilities.forEach((ability) => {
      let abilityLabel = ability.label

      // If there's a hint icon, emulate what we show on the forms page of the Werewolf sheet
      if (ability?.hintIcon) {
        abilityLabel = `${ability.label} <span class="ability-hint" title="${ability.hintDescription}">${ability.hintIcon}</span>`
      }

      description = description + `<li>${abilityLabel}</li>`
    })
    description = description + '</ul>'
  }

  // Post the message to the chat
  Loom.ChatMessage.create({
    speaker: Loom.ChatMessage.getSpeaker({ actor }),
    flags: {
      wod5e: {
        name: Loom.i18n.localize(formName),
        img: formData?.token?.img || actor.avatarUrl || '',
        description
      }
    }
  })
}

export const _onFormEdit = async function (event, target) {
  event.preventDefault()

  // Top-level variables
  const form = target.getAttribute('data-form')

  new WereformApplication({
    actor: this.actor,
    form
  }).render(true)
}

export const _onInsufficientRage = async function (actor, form) {
  // Define the template to be used
  const template = `
    <div class="form-group">
        <label>${Loom.i18n.localize('WOD5E.WTA.LostWolfShiftAnyway')}</label>
    </div>`

  const shouldShift = await Loom.LoomDialog.confirm({
    window: {
      title: Loom.i18n.localize('WOD5E.WTA.LostTheWolf')
    },
    content: template,
    yes: {
      icon: 'fas fa-check',
      label: Loom.i18n.localize('WOD5E.WTA.Shift')
    },
    no: {
      icon: 'fas fa-times',
      label: Loom.i18n.localize('WOD5E.Cancel')
    },
    classes: ['wod5e', 'werewolf']
  })

  if (shouldShift) {
    const { patch, newImage } = _getFormTokenPatch(actor, form)
    actor.update({
      'system.activeForm': form,
      'system.formOverride': true,
      ...patch
    })
    _propagateTokenImage(actor, newImage)
  }
}

/**
 * Calcula os campos do Ator a atualizar por causa da troca de forma, SEM
 * chamar `actor.update()` — quem chama deve juntar isto num único `.update()`
 * com o `system.activeForm`. Chamar vários `.update()` separados em sequência
 * (um por campo) dispara a guarda de loop do core (mutation-loop-guard) e cada
 * update sobrescreve o anterior sem mesclar, perdendo dado.
 */
const _getFormTokenPatch = function (actor, form) {
  const patch = {}

  // Ao sair do homid, guarda o avatar atual do Ator como a imagem "base" do
  // homid (aqui o LoomVTT usa `avatarUrl`, um campo simples de string, tanto no Ator
  // quanto no Cast)
  if (actor.system.activeForm === 'homid' && actor.avatarUrl) {
    patch['system.forms.homid.token.img'] = actor.avatarUrl
  }

  const originalImage = actor.system.forms?.homid?.token?.img || actor.avatarUrl
  const tokenImg = actor.system.forms?.[form]?.token?.img
  const newImage = tokenImg || originalImage

  if (newImage) patch.avatarUrl = newImage

  return { patch, newImage }
}

/**
 * Wrapper de conveniência pra chamadas isoladas (fora do fluxo de troca de
 * forma) que só precisam garantir que a imagem do token está em dia — ex.:
 * `wereform-application.js` depois de salvar edição de uma forma. Aqui é só
 * ESTA chamada, não encadeada com outras, então um único `actor.update()`
 * embutido não reintroduz o problema de múltiplos updates em sequência.
 */
export const _updateToken = async function (actor, form) {
  const { patch, newImage } = _getFormTokenPatch(actor, form)
  if (Object.keys(patch).length) await actor.update(patch)
  await _propagateTokenImage(actor, newImage)
}

/** Propaga a nova imagem pros Casts (tokens no mapa) já vinculados a este ator —
 * endpoint separado (`/cast/...`), não conta pra guarda de loop do Ator. */
const _propagateTokenImage = async function (actor, newImage) {
  if (!newImage) return

  try {
    const casts = await Loom.api.get(`/cast/by-actor/${actor.id}`)
    await Promise.all(
      (casts || []).map((cast) => Loom.api.put(`/cast/${cast.id}/token`, { avatarUrl: newImage }))
    )
  } catch (err) {
    console.error('World of Darkness 5e | Failed to update cast token image', err)
  }
}
