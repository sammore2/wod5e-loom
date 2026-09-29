// Import modules
import { WOD5eDice } from './system-rolls.js'
import { generateRollMessageData } from './rolls/roll-message.js'

const BODY_TEMPLATE = 'marketplace/rulesets/wod5e/display/ui/chat/chat-message-roll-body.hbs'

/** Conta sucessos (dados ativos, não descartados, valor > 5 — inclui críticos). */
function countSuccesses(results) {
  return (results || []).filter((r) => !r.discarded && r.result > 5).length
}

/**
 * Reroll de Força de Vontade — edita o card de rolagem JÁ POSTADO no lugar,
 * em vez de postar um novo (via `Loom.messages.get(id).setRoll()`, ver
 * `client/core/messages-collection.ts`). A versão original desse arquivo
 * dependia de uma API de atualização de rolls que o
 * LoomVTT nunca teve — por isso nunca funcionou depois da conversão pro
 * sistema nativo de card de chat.
 *
 * @param messageId  id da mensagem de chat que está sendo rerolada
 */
export const _onWillpowerReroll = async (messageId) => {
  const message = Loom.messages.get(messageId)
  const diceData = message?.roll?.meta?.diceData
  if (!diceData) return

  const { basicDice, advancedDice, system, difficulty, activeModifiers, title, flavor } = diceData

  // Monta a lista de dados rerolláveis: básicos sempre podem, avançados só
  // quando já vieram marcados como tal (ex: Fúria não-Brutal de lobisomem).
  const entries = []
  ;(basicDice?.results || []).forEach((die, index) => {
    if (!die.discarded) entries.push({ pool: 'basic', index, die })
  })
  ;(advancedDice?.results || []).forEach((die, index) => {
    if (!die.discarded && die.classes?.includes('rerollable')) entries.push({ pool: 'advanced', index, die })
  })

  if (!entries.length) {
    Loom.ui?.notifications?.warn(Loom.i18n.localize('WOD5E.Chat.NoRerollableDice'))
    return
  }

  const diceHtml = entries
    .map(
      (entry, i) =>
        `<div class="die-select" data-entry="${i}"><img src="${entry.die.img}" class="${entry.die.classes}"/></div>`
    )
    .join('')

  const content = `
    <form>
      <div class="window-content">
        <label><b>${Loom.i18n.localize('WOD5E.Chat.WillpowerReroll')}</b></label>
        <hr>
        <span class="dice-tooltip">
          <div class="dice-rolls flexrow willpower-reroll">
            ${diceHtml}
          </div>
        </span>
      </div>
    </form>`

  await Loom.LoomDialog.prompt({
    window: {
      title: Loom.i18n.localize('WOD5E.Chat.WillpowerReroll')
    },
    classes: ['wod5e', system, 'dialog'],
    content,
    ok: {
      label: 'Reroll',
      callback: () => rerollSelected()
    },
    cancel: {
      label: 'Cancel'
    },
    modal: true,
    render: (_event, dialog) => {
      dialog.element.querySelectorAll('.willpower-reroll .die-select').forEach((el) => {
        el.addEventListener('click', toggleDieSelect)
      })
    }
  })

  function toggleDieSelect() {
    const selected = document.querySelectorAll('.willpower-reroll .selected')
    if (!this.classList.contains('selected') && selected.length < 3) {
      this.classList.add('selected')
    } else {
      this.classList.remove('selected')
    }
  }

  async function rerollSelected() {
    const selectedEls = [...document.querySelectorAll('.willpower-reroll .die-select.selected')]
    if (selectedEls.length < 1 || selectedEls.length > 3) return

    const selectedEntries = selectedEls.map((el) => entries[Number(el.dataset.entry)])
    const basicCount = selectedEntries.filter((e) => e.pool === 'basic').length
    const advancedCount = selectedEntries.filter((e) => e.pool === 'advanced').length

    // Marca os dados escolhidos como descartados — ficam visíveis no card
    // (com o visual de "rerolado"), só não contam mais pro total.
    selectedEntries.forEach((e) => {
      e.die.discarded = true
    })

    // `speaker` de um roll vem do servidor como `{actorId, actorName, actorAvatar}`
    // (resolvido no `chat.roll` do WS), não `{actor, token, alias}` como o
    // `Loom.ChatMessage.getSpeaker()` client-side monta.
    const actorId = message.speaker?.actorId
    const actor = actorId ? Loom.actors.get(actorId) : undefined

    await WOD5eDice.Roll({
      basicDice: basicCount,
      advancedDice: advancedCount,
      actor,
      data: actor?.system || {},
      system,
      title: Loom.i18n.localize('WOD5E.Chat.WillpowerReroll'),
      willpowerDamage: actor ? 1 : 0,
      quickRoll: true,
      disableMessageOutput: true,
      callback: async (err, reroll) => {
        if (err) {
          console.error('World of Darkness 5e |', err)
          return
        }

        const nextBasicIndex = basicDice?.results?.length || 0
        const nextAdvancedIndex = advancedDice?.results?.length || 0

        const mergedBasicResults = [
          ...(basicDice?.results || []),
          ...((reroll.basicDice?.results || []).map((r, i) => ({ ...r, index: nextBasicIndex + i })))
        ]
        const mergedAdvancedResults = [
          ...(advancedDice?.results || []),
          ...((reroll.advancedDice?.results || []).map((r, i) => ({ ...r, index: nextAdvancedIndex + i })))
        ]

        const rollLike = {
          basicDice: {
            results: mergedBasicResults,
            formula: basicDice?.formula || '',
            total: countSuccesses(mergedBasicResults)
          },
          advancedDice: {
            results: mergedAdvancedResults,
            formula: advancedDice?.formula || '',
            total: countSuccesses(mergedAdvancedResults)
          }
        }

        const newRollMessageData = await generateRollMessageData({
          title,
          roll: rollLike,
          system,
          flavor,
          difficulty,
          activeModifiers,
          isContentVisible: true
        })

        const newBodyHtml = await Loom.renderTemplate(BODY_TEMPLATE, {
          ...newRollMessageData,
          isContentVisible: true
        })

        await message.setRoll({
          ...message.roll,
          meta: {
            ...message.roll.meta,
            bodyHtml: newBodyHtml,
            diceData: {
              system,
              title,
              difficulty,
              activeModifiers,
              flavor,
              basicDice: newRollMessageData.basicDice,
              advancedDice: newRollMessageData.advancedDice
            }
          }
        })
      }
    })
  }
}
