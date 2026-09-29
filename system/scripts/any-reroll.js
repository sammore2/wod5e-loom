// Import modules
import { WOD5eDice } from './system-rolls.js'
import { generateRollMessageData } from './rolls/roll-message.js'

const BODY_TEMPLATE = 'marketplace/rulesets/wod5e/display/ui/chat/chat-message-roll-body.hbs'

/** Conta sucessos (dados ativos, não descartados, valor > 5 — inclui críticos). */
function countSuccesses(results) {
  return (results || []).filter((r) => !r.discarded && r.result > 5).length
}

/**
 * Reroll de dados comuns — edita o card de rolagem JÁ POSTADO no lugar, no
 * mesmo padrão do reroll de Força de Vontade (`willpower-reroll.js`), em vez
 * de postar um novo. Este arquivo ainda dependia de `message.rolls` /
 * `roll.terms[0]` — APIs que o
 * LoomVTT nunca teve (`LiveMessage` só expõe `.roll` singular, com
 * `.meta.diceData`, e `setRoll()`/`setFlag()`/`patchRoll()`) — por isso o
 * reroll nunca persistia: os dados novos eram sorteados de verdade, mas o
 * card continuava mostrando o resultado antigo.
 *
 * @param messageId  id da mensagem de chat que está sendo rerolada
 */
export const _onAnyReroll = async (messageId) => {
  const message = Loom.messages.get(messageId)
  const diceData = message?.roll?.meta?.diceData
  if (!diceData) return

  const { basicDice, advancedDice, system, difficulty, activeModifiers, title, flavor } = diceData

  // Monta a lista de dados rerolláveis a partir do próprio diceData (fonte de
  // verdade) — o `_onAnyReroll` original recebia o elemento DOM do card e
  // raspava `.die` dele, mas o menu de contexto (`sidebar-tab.ts`) sempre
  // passou o id da mensagem pros callbacks, igual `_onWillpowerReroll` — daí
  // `roll.querySelectorAll` estourava TypeError antes mesmo do diálogo abrir.
  const entries = []
  ;(basicDice?.results || []).forEach((die, index) => {
    if (!die.discarded) entries.push({ pool: 'basic', index, die })
  })
  ;(advancedDice?.results || []).forEach((die, index) => {
    if (!die.discarded) entries.push({ pool: 'advanced', index, die })
  })

  if (!entries.length) return

  const diceRolls = entries
    .map(
      (entry, i) =>
        `<div class="die-select" data-entry="${i}"><img src="${entry.die.img}" class="${entry.die.classes}"/></div>`
    )
    .join('')

  // Create dialog for rerolling dice
  // HTML of the dialog
  const content = `
    <form>
        <div class="window-content">
            <label><b>Select dice to reroll (Max 3)</b></label>
            <hr>
            <span class="dice-tooltip">
              <div class="dice-rolls flexrow reroll">
                ${diceRolls}
              </div>
            </span>
        </div>
    </form>`

  // Prompt dialog
  await Loom.LoomDialog.prompt({
    window: {
      title: Loom.i18n.localize('WOD5E.Chat.Reroll')
    },
    classes: ['wod5e', system, 'dialog'],
    content,
    ok: {
      label: 'Reroll',
      callback: () => rerollDie()
    },
    cancel: {
      label: 'Cancel'
    },
    modal: true,
    render: (event, dialog) => {
      const rerollableDie = dialog.element.querySelectorAll('.reroll .die-select')

      rerollableDie.forEach((die) => {
        die.addEventListener('click', toggleDieSelect)
      })
    }
  })

  // Handles selecting and de-selecting the die (max 3, same as willpower-reroll)
  function toggleDieSelect() {
    const selected = document.querySelectorAll('.reroll .selected')
    if (!this.classList.contains('selected') && selected.length < 3) {
      this.classList.add('selected')
    } else {
      this.classList.remove('selected')
    }
  }

  // Handles rerolling the number of dice selected
  async function rerollDie() {
    const selectedEls = [...document.querySelectorAll('.reroll .die-select.selected')]
    if (!selectedEls.length) return

    const selectedEntries = selectedEls
      .map((el) => entries[Number(el.dataset.entry)])
      .filter(Boolean)
    const basicCount = selectedEntries.filter((e) => e.pool === 'basic').length
    const advancedCount = selectedEntries.filter((e) => e.pool === 'advanced').length

    if (!basicCount && !advancedCount) return

    // Marca os dados escolhidos como descartados — ficam visíveis no card
    // (com o visual de "rerolado"), só não contam mais pro total.
    selectedEntries.forEach((e) => {
      e.die.discarded = true
    })

    await WOD5eDice.Roll({
      basicDice: basicCount,
      advancedDice: advancedCount,
      title: Loom.i18n.localize('WOD5E.Chat.Reroll'),
      quickRoll: true,
      rollMode: message?.flags?.rollMode || Loom.settings.get('core', 'rollMode'),
      disableMessageOutput: true,
      system,
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
