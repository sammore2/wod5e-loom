// Import various helper functions
import { generateRollFormula } from './rolls/roll-formula.js'
import { getSituationalModifiers } from './rolls/situational-modifiers.js'
import { _damageWillpower } from './rolls/willpower-damage.js'
import { _increaseHunger } from './rolls/increase-hunger.js'
import { _decreaseRage } from './rolls/decrease-rage.js'
import { _applyOblivionStains } from './rolls/apply-oblivion-stains.js'
import { generateRollMessageData } from './rolls/roll-message.js'
import { updateRollPrompt } from '../sockets/roll-prompt.js'

class WOD5eRoll extends Loom.Roll {
  constructor(formula = '', data = {}, options = {}) {
    super(formula, data, options)
    this.system = options.system ?? this._tryCalculateSystem()
    if (this.system) this.systemRoll = true

    if (!this.dice.every((d) => Loom.utils.getProperty(d, 'gameSystem') === this.system)) {
      throw new Error('Dice are not compatible with this roll')
    }
  }

  get basicDice() {
    return this.#getDiceByType('basic')
  }

  get advancedDice() {
    return this.#getDiceByType('advanced')
  }

  /** @override */

  async _evaluate(options = {}) {
    await super._evaluate(options)

    if (this.system !== undefined) {
      const crits = this.dice
        .filter((d) => d.gameSystem === this.system)
        .flatMap((d) => d.results.filter((r) => r.result === 10 && r.active)).length

      this._total += Math.floor(crits / 2) * 2
    }

    return this
  }

  /** @override */

  _evaluateTotal() {
    const total = super._evaluateTotal()

    if (this.system !== undefined) {
      const crits = this.dice
        .filter((d) => d.gameSystem === this.system)
        .flatMap((d) => d.results.filter((r) => r.result === 10 && r.active)).length
      return total + Math.floor(crits / 2) * 2
    }

    return total
  }

  _tryCalculateSystem() {
    const systems = new Set(this.dice.map((d) => Loom.utils.getProperty(d, 'gameSystem')))

    if (systems.size > 1) {
      throw new Error('Multiple systems detected in dice')
    }

    return systems.values()?.next()?.value
  }

  #getDiceByType(type) {
    return this.terms.find((term) => Loom.utils.getProperty(term, 'dieType') === type)
  }

  async render(chatOptions = {}) {
    const isPrivate = chatOptions.isPrivate || false
    const flavor = chatOptions.flavor || this.options?.flavor || ''
    const system = this.system || 'mortal'
    const title = this.options?.title || `${typeof Loom !== 'undefined' && Loom.i18n?.localize ? Loom.i18n.localize('WOD5E.Chat.Rolling') : 'Rolling'}...`
    const difficulty = this.options?.difficulty || 0
    const activeModifiers = this.options?.activeModifiers || []

    const rollMessageData = await generateRollMessageData({
      title,
      roll: this,
      system,
      flavor,
      difficulty,
      activeModifiers,
      isContentVisible: !isPrivate
    })

    const template = chatOptions.template || 'marketplace/rulesets/wod5e/display/ui/chat/chat-message-roll.hbs'
    return Loom.renderTemplate(template, {
      ...rollMessageData,
      isContentVisible: !isPrivate,
      // O cabeçalho (quem rolou) mora dentro do próprio template do card, não
      // num wrapper genérico — sem isto, portrait/alias chegavam vazios.
      alias: chatOptions.alias || '',
      portrait: chatOptions.portrait || ''
    })
  }

  async toMessage(messageData = {}, { rollMode, create = true } = {}) {
    if (!this._evaluated) await this.evaluate()

    const isPrivate = rollMode === 'gmroll' || rollMode === 'blindroll' || rollMode === 'selfroll'
    const flavor = messageData.flavor || this.options?.flavor || ''
    const system = this.system || 'mortal'
    const title = this.options?.title || `${Loom.i18n?.localize ? Loom.i18n.localize('WOD5E.Chat.Rolling') : 'Rolling'}...`
    const difficulty = this.options?.difficulty || 0
    const activeModifiers = this.options?.activeModifiers || []

    const rollMessageData = await generateRollMessageData({
      title,
      roll: this,
      system,
      flavor,
      difficulty,
      activeModifiers,
      // Always the real content: this HTML is rendered once, on the roller's client, and then
      // sent to whoever the server lets receive this roll (gmroll/blindroll/selfroll are filtered
      // per recipient in the core, and viewers who cannot see it get the core's placeholder).
      // Baking "?" in here hid the result from the GM and from the roller too.
      isContentVisible: true
    })

    // Extensão do card nativo (`Loom.wraps.renderRollCard`, ver system/main.js):
    // o cabeçalho (avatar/nome/deletar) é do core, aqui só o corpo — dados,
    // sucessos/falhas, tudo com o visual e a fórmula do próprio wod5e.
    const bodyHtml = await Loom.renderTemplate(
      'marketplace/rulesets/wod5e/display/ui/chat/chat-message-roll-body.hbs',
      { ...rollMessageData, isContentVisible: true }
    )

    Loom.dispatchRoll({
      // A letra do dado (v/g/h/s/w/r/m) é só o ícone — mecanicamente é sempre
      // d10. O parser de fórmula do core (server) não conhece essas letras;
      // sem essa troca, o servidor rejeitava a rolagem e a mensagem nunca
      // chegava no chat, mesmo com o resultado certo já computado aqui.
      formula: this.formula.replace(/d[a-z]/gi, 'd10'),
      actorId: messageData.speaker?.actor || undefined,
      mode: isPrivate ? rollMode : 'public',
      meta: {
        wod5e: true,
        bodyHtml,
        // Dados crus (com `.result`/`.discarded`/`.index` por dado) pra
        // mecânicas que editam o card no lugar depois (reroll de Força de
        // Vontade) — sem isso, reroll teria que garimpar o HTML já renderizado.
        diceData: {
          system,
          title,
          difficulty,
          activeModifiers,
          flavor,
          basicDice: rollMessageData.basicDice,
          advancedDice: rollMessageData.advancedDice
        },
        // Checagens de recurso (Rousing Blood, Fúria etc) nunca podem ser
        // rerroladas com Força de Vontade, em nenhum sistema.
        noWillpowerReroll: !!this.options?.noWillpowerReroll
      }
    })
  }

  static fromJSON(data) {
    if (data.class !== 'WOD5eRoll') throw new Error('Invalid class')

    const roll = Loom.dice.Loom.Roll.fromData(data)
    Object.setPrototypeOf(roll, WOD5eRoll.prototype)
    roll.system = data.system

    return roll
  }
}

class WOD5eDice {
  /**
   * Class that handles all WOD5e rolls.
   *
   * @param basicDice                 (Optional, default 0) The number of 'basic' dice to roll, such as v, w, and h
   * @param advancedDice              (Optional, default 0) The number of 'advanced' dice to roll, such as g, r and s
   * @param actor                     The actor that the roll is coming from
   * @param data                      Actor or item data to pass along with the roll
   * @param title                     Title of the roll for the dialog/chat message
   * @param disableBasicDice          (Optional, default false) Whether to disable basic dice on this roll
   * @param disableAdvancedDice       (Optional, default false) Whether to disable advanced dice on this roll
   * @param willpowerDamage           (Optional, default 0) How much to damage willpower after the roll is complete
   * @param increaseHunger            (Optional, default false) Whether to increase hunger on failures
   * @param decreaseRage              (Optional, default false) Whether to reduce rage on failures
   * @param difficulty                (Optional, default 0) The number that the roll must succeed to count as a success
   * @param flavor                    (Optional, default '') Text that appears in the description of the roll
   * @param callback                  (Optional) A callable function for determining the chat message flavor given parts and data
   * @param quickRoll                 (Optional, default false) Whether the roll was called to bypass the roll dialog or not
   * @param rollMode                  (Optional, default the current roll mode) Which roll mode the message should default as
   * @param rerollHunger              (Optional, default false) Whether to reroll failed hunger dice
   * @param selectors                 (Optional, default []) Any selectors to use when compiling situational modifiers
   * @param macro                     (Optional, default '') A macro to run after the roll has been made
   * @param disableMessageOutput      (optional, default false) Whether to display the message output of a roll
   * @param advancedCheckDice         (optional, default 0) Any dice that, part of an 'advanced' diceset, is rolled separately but at the same time
   *
   */
  static async Roll({
    basicDice = 0,
    advancedDice = 0,
    actor,
    data,
    title,
    disableBasicDice,
    disableAdvancedDice,
    willpowerDamage = 0,
    increaseHunger = false,
    decreaseRage = false,
    difficulty = 0,
    flavor = '',
    callback,
    quickRoll = false,
    rollMode = Loom.settings.get('core', 'rollMode'),
    rerollHunger = false,
    selectors = [],
    macro = '',
    disableMessageOutput = false,
    advancedCheckDice = 0,
    system = actor?.system?.gamesystem || 'mortal',
    originMessage = '',
    // Checagens de recurso (Rousing Blood, Fúria etc — o sub-roll disparado
    // logo abaixo via `advancedCheckDice`) não podem ser rerroladas com
    // Força de Vontade em nenhum sistema.
    noWillpowerReroll = false
  }) {
    // Grab the dice-related data for the given system
    const systemData = WOD5E.Systems.getList({})[system]

    // Inner roll function
    const _roll = async (inputBasicDice, inputAdvancedDice, formData) => {
      // Get the difficulty and store it
      difficulty = formData
        ? (formData.querySelector('#inputDifficulty')?.value ?? difficulty)
        : difficulty
      // Get the rollMode and store it
      rollMode = formData
        ? (formData.querySelector('[name="rollMode"]')?.value ?? rollMode)
        : rollMode

      // Prevent trying to roll 0 dice; all dice pools should roll at least 1 die
      if (parseInt(inputBasicDice) === 0 && parseInt(inputAdvancedDice) === 0) {
        // Determine if the system uses a resource (like hunger or rage)
        let resourceValue = 0
        if (systemData?.usesResourceOnAdvancedDice && systemData?.resourceValuePath) {
          // Extract resource value
          resourceValue = Loom.utils.getProperty(actor.system, systemData.resourceValuePath) ?? 0
        }

        if (resourceValue > 0) {
          // If system uses a resource and the value of that resource is greater than 0, roll 1 advanced die
          inputAdvancedDice = 1
        } else {
          // Otherwise, roll 1 basic die
          inputBasicDice = 1
        }
      }

      // Construct the proper roll formula by sending it to the generateRollFormula function
      const rollFormula = await generateRollFormula({
        basicDice: inputBasicDice,
        advancedDice: inputAdvancedDice,
        system,
        actor,
        data,
        rerollHunger
      })

      // Determine any active modifiers
      const activeModifiers = []
      if (formData) {
        const modifiersList = formData.querySelectorAll('.mod-checkbox')
        if (modifiersList.length > 0) {
          modifiersList.forEach((el) => {
            const isChecked = el.checked

            if (isChecked) {
              // Get the dataset values
              const label = el.dataset.label
              const value = Number(el.dataset.value || 0)

              // Add a plus sign if the value is positive
              const valueWithSign = (value > 0 ? '+' : '') + value

              // Push the object to the activeModifiers array
              activeModifiers.push({
                label,
                value: valueWithSign
              })
            }
          })
        }

        const customModifiersList = formData.querySelectorAll('.custom-modifier')
        if (customModifiersList.length > 0) {
          // Go through each custom modifier and add it to the array
          customModifiersList.forEach((el) => {
            // Get the label and value from the current .custom-modifier element
            const label = el.querySelector('.mod-name')?.value || ''
            const value = Number(el.querySelector('.mod-value')?.value || 0)

            // Add a plus sign if the value is positive
            const valueWithSign = (value > 0 ? '+' : '') + value

            // Create an object with label and value fields
            const modifierObject = {
              label,
              value: valueWithSign
            }

            // Add the object to the activeModifiers array
            activeModifiers.push(modifierObject)
          })
        }
      }

      const options = {
        difficulty,
        system,
        title,
        flavor,
        activeModifiers,
        rollMode,
        noWillpowerReroll
      }

      // O card de "Inflamando o Sangue" (custo em Checagem de Sangue) dispara ANTES da
      // pool principal, não depois — é o custo de ativar o poder, paga-se primeiro pra
      // só então rolar o teste em si. Isolado com `basicDice: 0` explícito (não só
      // `disableBasicDice: true`) e usando o valor de `advancedCheckDice` de quando a
      // função foi chamada, sem depender de nenhum estado do roll principal abaixo.
      if (advancedCheckDice > 0) {
        await this.Roll({
          actor,
          data,
          // Título diferente do usado pela Checagem de Sangue de custo (`rouse.js`) —
          // as duas usavam o mesmo texto "Inflamando o Sangue", então quando as duas
          // disparavam pra mesma ação (Surto de Sangue marcado + poder com custo) ficava
          // impossível saber qual card era qual.
          title: `${Loom.i18n.localize('WOD5E.VTM.BloodSurge')} - ${title}`,
          system,
          basicDice: 0,
          disableBasicDice: true,
          advancedDice: advancedCheckDice,
          rollMode,
          quickRoll: true,
          increaseHunger: system === 'vampire',
          decreaseRage: system === 'werewolf',
          noWillpowerReroll: true
        })
      }

      // Send the roll to chat
      const roll = await new WOD5eRoll(rollFormula, data, options).roll()

      // Handle failures for werewolves and vampires
      if (roll.advancedDice) await handleFailure(system, roll.advancedDice.results)

      // Handle willpower damage
      if (willpowerDamage > 0 && Loom.settings.get('wod5e', 'automatedWillpower'))
        _damageWillpower(null, null, actor, willpowerDamage, rollMode)

      // Send the results of the roll back to any functions that need it
      if (callback) {
        callback(null, {
          ...roll,
          // terms/dice/total/basicDice/advancedDice are prototype getters and
          // aren't copied by the spread above — willpower-reroll.js reads
          // reroll.basicDice/advancedDice directly, so dropping these silently
          // merged zero new dice into every reroll.
          terms: roll.terms,
          dice: roll.dice,
          total: roll.total,
          basicDice: roll.basicDice,
          advancedDice: roll.advancedDice,
          system,
          difficulty,
          rollSuccessful: roll.total > 0 && (roll.total >= difficulty || difficulty === 0),
          rollMode
        })
      }

      // Run any macros that need to be ran
      if (macro && Loom.macros.get(macro)) {
        Loom.macros.get(macro).execute({
          actor,
          token: actor.token ?? actor.getActiveTokens[0],
          roll
        })
      }

      // Handle updating any 'parent' chat messages that need the roll
      if (originMessage) {
        const chatMessage = Loom.messages.get(originMessage)

        if (chatMessage && chatMessage?.flags?.wod5e?.isRollPrompt) {
          disableMessageOutput = true

          const socketData = {
            action: 'updateRollPrompt',
            actorID: actor.id,
            roll: roll.toJSON(),
            messageID: chatMessage.id
          }

          if ((Loom.user?.role ?? 0) >= 4) {
            // The GM applies the update authoritatively
            updateRollPrompt(socketData)
          } else {
            Loom.socket.emit('system.wod5e', socketData)
          }
        }
      }

      // The below isn't needed if disableMessageOutput is set to true
      if (disableMessageOutput && Loom.dice3d) {
        // Send notice to DiceSoNice because we're not making a new chat message
        Loom.dice3d.showForRoll(roll, Loom.user, true)

        // End function here
        return roll
      }

      // Post the message to the chat
      if (!disableMessageOutput) {
        await roll.toMessage(
          {
            speaker: Loom.ChatMessage.getSpeaker({ actor })
          },
          {
            rollMode
          }
        )
      }

      return roll
    }

    // Check if the user wants to bypass the roll dialog
    if (!quickRoll) {
      // Handle getting any situational modifiers
      const situationalModifiers = actor ? await getSituationalModifiers({ actor, selectors }) : {}

      // Roll dialog template
      const dialogTemplate = `marketplace/rulesets/wod5e/display/ui/${system}-roll-dialog.hbs`
      // Data that the dialog template needs
      const dialogData = {
        system,
        basicDice,
        advancedDice,
        disableBasicDice,
        disableAdvancedDice,
        difficulty,
        rollMode,
        rollModes: Object.fromEntries(
          Object.entries(CONFIG.Dice?.rollModes || {
            publicroll: 'CHAT.RollPublic',
            gmroll: 'CHAT.RollPrivate',
            blindroll: 'CHAT.RollBlind',
            selfroll: 'CHAT.RollSelf'
          }).map(([mode, key]) => [mode, Loom.i18n.localize(key)])
        ),
        situationalModifiers
      }
      // Render the dialog
      const content = await Loom.renderTemplate(
        dialogTemplate,
        dialogData
      )

      // Promise to handle the roll after the dialog window is closed
      // as well as any callbacks or other functions with the roll
      return Loom.LoomDialog.wait({
        window: {
          title: title || Loom.i18n.localize('WOD5E.RollList.Label')
        },
        content,
        actions: {
          plus: (_event, target) => {
            const input = target.ownerDocument.querySelector(`#${target.dataset.resource}`)
            input.valueAsNumber += 1
          },
          minus: (_event, target) => {
            const input = target.ownerDocument.querySelector(`#${target.dataset.resource}`)
            input.valueAsNumber = Math.max(input.valueAsNumber - 1, parseInt(input.min))
          },
          addCustomMod: (_event, target) => {
            // Define the custom modifiers list and a custom modifier element
            const customModList = target.ownerDocument.querySelector('#custom-modifiers-list')
            const customModElement =
              `<div class="mod-row custom-modifier">
                <div class="col-source mod-label">
                  <a class="mod-delete" data-action="deleteCustomMode" title="` +
              Loom.i18n.localize('WOD5E.Delete') +
              `">
                    <i class="fas fa-trash"></i>
                  </a>
                  <input class="mod-name" type="text" value="Custom"/>
                </div>
                <div class="col-value">
                  <input class="mod-value" type="number" value="1"/>
                </div>
              </div>`

            // Append a new custom modifier element to the list
            customModList.insertAdjacentHTML('beforeend', customModElement)
          },
          deleteCustomMode: (_event, target) => {
            target.closest('.custom-modifier').remove()
          }
        },
        buttons: [
          {
            action: 'roll',
            icon: 'rpg-d10',
            label: Loom.i18n.localize('WOD5E.RollList.Label'),
            default: true,
            callback: async (_event, _button, dialog) => {
              const dialogHTML = dialog.element

              // Obtain the input fields
              const basicDiceInput = dialogHTML.querySelector('#inputBasicDice')
              const advancedDiceInput = dialogHTML.querySelector('#inputAdvancedDice')

              // Get the values
              const basicValue = basicDiceInput?.valueAsNumber ?? 0
              const advancedValue = advancedDiceInput?.valueAsNumber ?? 0

              // Add any custom modifiers
              const customModifiersList = dialogHTML.querySelectorAll('.custom-modifier')
              const modifierTotal = customModifiersList
                .entries()
                .reduce((modifierTotal, [, el]) => {
                  return modifierTotal + (el.querySelector('.mod-value')?.valueAsNumber ?? 0)
                }, 0)

              let modifiedBasicValue = basicValue + modifierTotal
              let modifiedAdvancedValue = advancedValue

              // If the basic pool drops below 0, carry the remainder into the advanced dice pool
              if (modifiedBasicValue < 0) {
                modifiedAdvancedValue += modifiedBasicValue
                modifiedBasicValue = 0
              }

              // Neither pool should be below 0
              modifiedAdvancedValue = Math.max(0, modifiedAdvancedValue)

              // Account for the fact that advanced/basic dice could be disabled
              // and we should still roll minimum of 1 dice
              if (modifiedBasicValue === 0 && modifiedAdvancedValue === 0) {
                if (disableAdvancedDice) modifiedBasicValue = 1
                if (disableBasicDice) modifiedBasicValue = 1
              }

              return await _roll(modifiedBasicValue, modifiedAdvancedValue, dialogHTML)
            }
          },
          {
            action: 'cancel',
            icon: 'fas fa-times',
            label: Loom.i18n.localize('WOD5E.Cancel')
          }
        ],
        classes: ['wod5e', system, 'roll-dialog'],
        render: (_event, dialog) => {
          const dialogHTML = dialog.element

          // Obtain the input fields
          const basicDiceInput = dialogHTML.querySelector('#inputBasicDice')
          const advancedDiceInput = dialogHTML.querySelector('#inputAdvancedDice')

          // Get the values
          // Add event listeners to the situational modifier toggles
          dialogHTML.querySelectorAll('.mod-checkbox').forEach(function (el) {
            el.addEventListener('change', function (event) {
              event.preventDefault()

              // Determine the input
              const modCheckbox = event.target
              const modifier = parseInt(event.currentTarget.dataset.value)
              const modifierIsNegative = modifier < 0

              // Get the values of basic and advanced dice
              const basicValue = basicDiceInput?.valueAsNumber ?? 0
              const advancedValue = advancedDiceInput?.valueAsNumber ?? 0
              const aCDValue = event.currentTarget.dataset.advancedCheckDice
                ? parseInt(event.currentTarget.dataset.advancedCheckDice)
                : 0

              // Determine whether any alterations need to be made to basic dice or advanced dice
              // Either use the current applyDiceTo (if set), or default to 'basic'
              let applyDiceTo = event.currentTarget.dataset.applyDiceTo || 'basic'

              // Determine the new input depending on if the modifier is adding or subtracting
              // Checked and modifier is NOT negative = Add
              // Unchecked and modifier is negative = Add
              // Checked and modifier is negative = Subtract
              // Unchecked and modifier is NOT negative = Subtract
              let newValue = 0
              let checkValue = 0

              // Make sure advanced dice are enabled
              if (!disableAdvancedDice) {
                if (modifierIsNegative) {
                  // Apply dice to basicDice unless basicDice is 0
                  if (systemData.usesResourceOnAdvancedDice && basicValue === 0) {
                    applyDiceTo = 'advanced'
                  }
                } else {
                  // Apply dice to advancedDice if advancedValue is below the actor's hunger/rage value
                  if (advancedValue < checkValue) {
                    applyDiceTo = 'advanced'
                  }
                }
              }

              if (
                (modCheckbox?.checked && !modifierIsNegative) ||
                (!modCheckbox?.checked && modifierIsNegative)
              ) {
                // Adding the modifier
                if (applyDiceTo === 'advanced') {
                  // Apply the modifier to advancedDice
                  newValue = advancedValue + Math.abs(modifier)

                  // Determine what we're checking against
                  if (systemData?.usesResourceOnAdvancedDice && systemData?.resourceValuePath) {
                    // Extract resource value
                    checkValue = Loom.utils.getProperty(
                      actor.system,
                      systemData.resourceValuePath
                    )
                  }

                  if (
                    newValue > checkValue &&
                    !(event.currentTarget.dataset.applyDiceTo === 'advanced')
                  ) {
                    // Check for any excess and apply it to basicDice
                    const excess = newValue - checkValue
                    newValue = checkValue
                    basicDiceInput.value = basicValue + excess
                  }

                  // Update the advancedDice in the menu
                  advancedDiceInput.value = newValue
                } else {
                  // If advancedDice is already at its max, apply the whole modifier to just basicDice
                  newValue = basicValue + Math.abs(modifier)
                  basicDiceInput.value = newValue
                }

                // Apply the advancedCheckDice value
                advancedCheckDice = advancedCheckDice + aCDValue
              } else {
                // Removing the modifier
                if (applyDiceTo === 'advanced') {
                  // Apply the modifier to advancedDice
                  newValue = advancedValue - Math.abs(modifier)

                  if (newValue < 0) {
                    // Check for any deficit and apply it to basicDice
                    const deficit = Math.abs(newValue)
                    newValue = 0
                    basicDiceInput.value = Math.max(basicValue - deficit, 0)
                  }

                  // Update the advancedDice in the menu
                  advancedDiceInput.value = newValue
                } else {
                  newValue = basicValue - Math.abs(modifier)
                  if (newValue < 0) {
                    const deficit = Math.abs(newValue)
                    newValue = 0
                    advancedDiceInput.value = Math.max(advancedValue - deficit, 0)
                  }

                  basicDiceInput.value = newValue
                }

                // Apply the advancedCheckDice value while ensuring the value can't go below 0
                advancedCheckDice = Math.max(advancedCheckDice - aCDValue, 0)
              }

              // Ensure that there can't be negative dice
              if (basicDiceInput && basicDiceInput.value < 0) basicDiceInput.value = 0
              if (advancedDiceInput && advancedDiceInput.value < 0) advancedDiceInput.value = 0
            })
          })

          dialogHTML.addEventListener(
            'wheel',
            (e) => {
              const input = e.target.closest('input[type="number"]')
              if (!input || input.disabled || input.readOnly) return
              e.preventDefault()

              const step = Number(input.step) || 1
              const min = input.min !== '' ? Number(input.min) : 0
              const max = input.max !== '' ? Number(input.max) : Infinity
              const current = input.value === '' ? 0 : (Number(input.value) || 0)
              const delta = e.deltaY < 0 ? step : -step
              let next = current + delta
              if (next < min) next = min
              if (next > max) next = max

              if (next !== current || input.value === '') {
                input.value = next
                input.dispatchEvent(new Event('change', { bubbles: true }))
              }
            },
            { passive: false }
          )
        }
      })
    } else {
      return _roll(basicDice, advancedDice)
    }

    // Function to help with handling additional functions as a result
    // of failures
    async function handleFailure(system, diceResults) {
      const failures = diceResults.filter(
        (result) => result.success === false && !result.discarded
      ).length

      if (failures > 0) {
        if (
          system === 'vampire' &&
          increaseHunger &&
          Loom.settings.get('wod5e', 'automatedHunger')
        ) {
          await _increaseHunger(actor, failures, rollMode)
        } else if (
          system === 'werewolf' &&
          decreaseRage &&
          Loom.settings.get('wod5e', 'automatedRage')
        ) {
          // `await` é essencial aqui: `_roll` só chama o `callback` (que em wod5e/wta
          // faz seu PRÓPRIO `actor.update()` pra trocar de forma) depois que
          // `handleFailure` retorna. Sem esperar `_decreaseRage` terminar, o
          // `actor.update()` da troca de forma dispara em paralelo com o da fúria —
          // cada um computa `systemData` a partir do mesmo snapshot desatualizado,
          // e o que responder por último apaga a mudança do outro sem erro nenhum
          // (foi assim que a fúria "não descia": o decremento acontecia e sumia
          // segundos depois).
          await _decreaseRage(actor, failures, rollMode)
        }
      }

      // Handle Oblivion rouse checks here
      if (selectors.includes('oblivion-rouse') && Loom.settings.get('wod5e', 'automatedOblivion')) {
        const oblivionTriggers = diceResults.filter(
          (result) => [1, 10].includes(result.result) && !result.discarded
        ).length

        if (oblivionTriggers > 0) {
          _applyOblivionStains(actor, oblivionTriggers, rollMode)
        }
      }

      // Send a hook
      Loom.LoomHooks.callAll('wod5e.handleFailure', actor, system, failures, diceResults, rollMode)
    }
  }
}

export { WOD5eDice, WOD5eRoll }
