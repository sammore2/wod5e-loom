import { WOD5eDice } from '../../../scripts/system-rolls.js'
import { getActiveModifiers } from '../../../scripts/rolls/situational-modifiers.js'
import { potencyToRouse } from './blood-potency.js'

export const _onRouseCheck = async function (actor, item, rollMode) {
  // Secondary variables
  const level = item.system.level
  // `item.system.cost` pode vir como STRING do formulário do item ("1", não 1) — a
  // comparação `> 0` funciona igual (JS converte pra número só pra comparar), mas o
  // valor em si continua string. `cost + activeModifiers.totalValue` então virava
  // CONCATENAÇÃO, não soma: "1" + 0 = "10", não 1. Confirmado ao vivo (log mostrou
  // exatamente basicDice=10 saindo de cost=1/totalValue=0). Convertido pra Number aqui.
  const cost = Number(item.system.cost) > 0 ? Number(item.system.cost) : 1
  const selectors = ['rouse']

  // Apply rollMode from chat if none is set
  if (!rollMode) rollMode = Loom.settings.get('core', 'rollMode')

  if (item.system.discipline === 'oblivion' && cost > 0) {
    selectors.push('oblivion-rouse')
  }

  // Vampires roll rouse checks
  if (actor.type === 'vampire') {
    const potency = actor.type === 'vampire' ? actor.system.blood.potency : 0
    const rouseRerolls = await potencyToRouse(potency, level)

    // Handle getting any situational modifiers
    const activeModifiers = await getActiveModifiers({
      actor,
      selectors
    })

    // Send the roll to the system
    // Checagem de Sangue rola em dado de FOME (avançado), não dado normal (básico) — a
    // config estava invertida (`disableAdvancedDice`, valor em `basicDice`), por isso o
    // card mostrava um dado comum em vez do dado vermelho de fome.
    WOD5eDice.Roll({
      advancedDice: cost + activeModifiers.totalValue,
      title: `${Loom.i18n.localize('WOD5E.VTM.RousingBlood')} - ${item.name}`,
      actor,
      disableBasicDice: true,
      rerollHunger: rouseRerolls,
      increaseHunger: true,
      selectors,
      rollMode,
      quickRoll: true
    })
  } else if (actor.type === 'ghoul' && level > 1) {
    // Ghouls take aggravated damage for using powers above level 1 instead of rolling rouse checks
    const actorHealth = actor.system.health
    const actorHealthMax = actorHealth.max
    const currentAggr = actorHealth.aggravated
    let newAggr = parseInt(currentAggr) + 1

    // Make sure aggravated can't go over the max
    if (newAggr > actorHealthMax) {
      newAggr = actorHealthMax
    }

    // Update the actor with the new health
    actor.update({ 'system.health.aggravated': newAggr })
  }
}
