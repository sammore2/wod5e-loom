import { prepareDisciplinePowers } from './prepare-data.js'
import { getBloodPotencyText } from './blood-potency.js'
import { getActorItems } from '../../../scripts/embedded-items.js'

export const prepareDisciplinesContext = async function (context, actor) {
  const actorData = actor.system

  // Tab data
  context.tab = context.tabs.disciplines

  // Part-specific data
  const derived = actor.derivedData || {};
  const disciplines = derived.disciplines || actorData.disciplines;
  context.disciplines = await prepareDisciplinePowers(disciplines)

  // Get discipline data if any discipline is currently selected
  if (actorData?.selectedDiscipline) {
    const disciplineKey = actorData.selectedDiscipline
    context.selectedDiscipline = {
      ...disciplines[disciplineKey],
      id: disciplineKey  // garante que selectedDiscipline.id está disponível no template
    }
    context.enrichedSelectedDisciplineDescription =
      await Loom.applications.ux.TextEditor.implementation.enrichHTML(
        context.selectedDiscipline?.description || ''
      )
  }

  // Get power data if any power is currently selected
  if (actorData?.selectedDisciplinePower) {
    // `getActorItems()` em vez de `actor.items` — este último às vezes é um array de rows
    // cruas sem o acessor `.system` (mesma causa já corrigida em `disciplines.js`), e o
    // gate `{{#if (isNotEmpty selectedDisciplinePower.system.dicepool)}}` do template
    // falhava calado, escondendo o ícone de rolar dados do poder sem erro nenhum no console.
    context.selectedDisciplinePower = getActorItems(actor).find((item) => item.id === actorData.selectedDisciplinePower)

    if (context.selectedDisciplinePower?.system?.description) {
      context.selectedDisciplinePowerDescription =
        await Loom.applications.ux.TextEditor.implementation.enrichHTML(
          context.selectedDisciplinePower.system.description
        )
    }
  }

  return context
}

export const prepareBloodContext = async function (context, actor) {
  const actorData = actor.system
  const actorHeaders = actorData.headers

  // Tab data
  context.tab = context.tabs.blood

  // Filters for item-specific data
  const items = getActorItems(actor)
  const predatorFilter = items.filter((item) => item.type === 'predatorType')
  const resonanceFilter = items.filter((item) => item.type === 'resonance')
  const clanFilter = context?.clan // Filtering already done in main dataprep

  // Part-specific data
  context.blood = actorData.blood
  context.bloodpotency = await getBloodPotencyText(actorData.blood.potency)
  context.sire = actorHeaders.sire
  context.generation = actorHeaders.generation
  context.predator = predatorFilter[0]
  context.resonance = resonanceFilter[0]
  context.bane = clanFilter?.system?.bane || ''
  context.enrichedBane = await Loom.applications.ux.TextEditor.implementation.enrichHTML(
    context.bane
  )

  return context
}
