import { getActiveModifiers } from '../../../scripts/rolls/situational-modifiers.js'
import { WOD5eDice } from '../../../scripts/system-rolls.js'

/** Handle rolling for a frenzy check */
export const _onFrenzyRoll = async function (event) {
  event.preventDefault()

  // Top-level variables
  const actor = this.actor

  // Define the content of the Dialog
  const content = `<p>
    ${Loom.i18n.localize('WOD5E.VTM.FrenzyChoiceResistOrGiveIn')}
  </p>`

  // Check whether the player wants to skip the check and go straight into Frenzy
  const doFrenzyRoll = await Loom.LoomDialog.wait({
    window: {
      title: Loom.i18n.localize('WOD5E.VTM.ResistingFrenzy')
    },
    content,
    modal: true,
    buttons: [
      {
        label: Loom.i18n.localize('WOD5E.ItemsList.Resist'),
        action: 'resist'
      },
      {
        label: Loom.i18n.localize('WOD5E.VTM.GiveIn'),
        action: 'give-in'
      }
    ]
  })

  if (doFrenzyRoll === 'resist') {
    let basicDice = 0
    const willpowerDicePool = await getWillpowerDicePool(actor)
    const humanity = actor.system.humanity.value
    const dicePool = Math.max(willpowerDicePool + Math.floor(humanity / 3), 1)

    // Handle getting any situational modifiers
    const activeModifiers = await getActiveModifiers({
      actor,
      selectors: ['frenzy']
    })

    basicDice = await WOD5E.api.getBasicDice({
      flatMod: dicePool + activeModifiers.totalValue,
      actor
    })

    WOD5eDice.Roll({
      basicDice,
      title: Loom.i18n.localize('WOD5E.VTM.ResistingFrenzy'),
      actor,
      selectors: ['frenzy'],
      data: actor.system,
      disableAdvancedDice: true,
      activeModifiers,
      callback: async (err, result) => {
        if (err) console.log('World of Darkness 5e | ' + err)

        if (!result.rollSuccessful) {
          actor.update({ 'system.frenzyActive': true })

          Loom.ChatMessage.create({
            flags: {
              wod5e: {
                name: Loom.i18n.localize('WOD5E.VTM.ResistingFrenzyFailed'),
                img: 'marketplace/rulesets/wod5e/assets/icons/dice/vampire/bestial-failure.png',
                description: Loom.i18n.format('WOD5E.VTM.ResistingFrenzyFailedDescription', {
                  actor: actor.name
                })
              }
            }
          })
        } else {
          Loom.ChatMessage.create({
            flags: {
              wod5e: {
                name: Loom.i18n.localize('WOD5E.VTM.ResistingFrenzySuccess'),
                img: 'marketplace/rulesets/wod5e/assets/icons/dice/vampire/bestial-failure.png',
                description: Loom.i18n.format('WOD5E.VTM.ResistingFrenzySuccessDescription', {
                  actor: actor.name
                })
              }
            }
          })
        }
      }
    })
  } else if (doFrenzyRoll === 'give-in') {
    // Automatically enter frenzy
    actor.update({ 'system.frenzyActive': true })

    Loom.ChatMessage.create({
      flags: {
        wod5e: {
          name: Loom.i18n.localize('WOD5E.VTM.RidingTheWave'),
          img: 'marketplace/rulesets/wod5e/assets/icons/dice/vampire/bestial-failure.png',
          description: Loom.i18n.format('WOD5E.VTM.RidingTheWaveDescription', {
            actor: actor.name
          })
        }
      }
    })
  }
}

// Calculate the dice for a Willpower roll
function getWillpowerDicePool(actor) {
  const willpowerMax = actor.system.willpower.max
  const willpowerAgg = actor.system.willpower.aggravated
  const willpowerSup = actor.system.willpower.superficial

  return Math.max(willpowerMax - willpowerAgg - willpowerSup, 0)
}
