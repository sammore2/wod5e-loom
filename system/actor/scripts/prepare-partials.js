import { prepareEdgePowers } from '../htr/scripts/prepare-data.js'
import { prepareDisciplinePowers } from '../vtm/scripts/prepare-data.js'
import { prepareGiftPowers } from '../wta/scripts/prepare-data.js'

export const prepareStatsContext = async function (context, actor) {
  const actorData = actor.system

  // Tab data
  context.tab = context.tabs.stats

  // Part-specific data
  const derived = actor.derivedData || {};
  context.sortedAttributes = derived.sortedAttributes || actorData.sortedAttributes;
  context.sortedSkills = derived.sortedSkills || actorData.sortedSkills;
  // `customRolls`/`conditions` já vêm computados em `context` pelo `prepareItems()` de
  // `_prepareContext()` — `actor.system` é um getter que devolve objeto NOVO a cada
  // acesso (nunca populado por `prepareItems()`), reatribuir daqui sempre voltava `undefined`.

  return context
}

export const prepareExperienceContext = async function (context, actor) {
  const actorData = actor.system

  // Tab data
  context.tab = context.tabs.experience

  // Part-specific data
  if (actorData?.experiences) {
    context.experiences = actorData.experiences.sort(function (xp1, xp2) {
      const timestamp1 = xp1?.timestamp || 0
      const timestamp2 = xp2?.timestamp || 0

      return timestamp2 - timestamp1
    })
  }
  const derived = actor.derivedData || {};
  context.exp = actorData.exp
  context.derivedXP = derived.derivedXP || actorData.derivedXP

  return context
}

export const prepareFeaturesContext = async function (context, actor) {
  const actorData = actor.system
  const actorHeaders = actorData.headers || {}

  // Tab data
  context.tab = context.tabs.features

  // Part-specific data
  context.concept = actorHeaders.concept
  context.chronicle = actorHeaders.chronicle
  context.ambition = actorHeaders.ambition
  context.desire = actorHeaders.desire
  // NÃO reatribuir a partir de `actorData.features`: `actor.system` é um getter que devolve
  // um objeto NOVO a cada acesso (não cacheado), então `actorData` aqui nunca passou pelo
  // `prepareItems()` que populou `context.features` de verdade em `_prepareContext()` — sempre
  // vinha `undefined` e a aba de Antecedente/Vantagens ficava vazia mesmo com o dado certo salvo.
  context.tenets = actorHeaders.tenets
  context.enrichedTenets = await Loom.applications.ux.TextEditor.implementation.enrichHTML(
    actorHeaders.tenets
  )
  context.touchstones = actorHeaders.touchstones
  context.enrichedTouchstones = await Loom.applications.ux.TextEditor.implementation.enrichHTML(
    actorHeaders.touchstones
  )
  // `derivedData.gamesystem` primeiro — `system.gamesystem` de um SPC fica travado no
  // valor de quando o ator foi criado (ver comentário em `actor.js`/`prepareDerivedData`).
  const gamesystem = actor.derivedData?.gamesystem ?? actorData.gamesystem
  context.showAmbitionDesire = gamesystem !== 'werewolf' && actor.type !== 'group'

  if (gamesystem === 'werewolf') {
    const tribe = context.tribe

    context.favor = tribe?.system?.patronSpirit?.favor || ''
    context.enrichedFavor = await Loom.applications.ux.TextEditor.implementation.enrichHTML(
      context.favor
    )
    context.ban = tribe?.system?.patronSpirit?.ban || ''
    context.enrichedBan = await Loom.applications.ux.TextEditor.implementation.enrichHTML(
      context.ban
    )
  }

  return context
}

export const prepareEquipmentContext = async function (context, actor) {
  const actorData = actor.system

  // Tab data
  context.tab = context.tabs.equipment

  // Part-specific data
  context.equipment = actorData.equipment
  context.enrichedEquipment = await Loom.applications.ux.TextEditor.implementation.enrichHTML(
    actorData.equipment
  )
  // `equipmentItems` já vem computado em `context` pelo `prepareItems()` — mesmo motivo
  // do comentário em `prepareStatsContext` acima, não reatribuir daqui.

  return context
}

export const prepareBiographyContext = async function (context, actor) {
  const actorData = actor.system

  // Tab data
  context.tab = context.tabs.biography

  // Part-specific data
  context.bio = actorData.bio
  context.biography = actorData.biography
  context.enrichedBiography = await Loom.applications.ux.TextEditor.implementation.enrichHTML(
    actorData.biography
  )
  context.appearance = actorData.appearance
  context.enrichedAppearance = await Loom.applications.ux.TextEditor.implementation.enrichHTML(
    actorData.appearance
  )

  return context
}

export const prepareNotepadContext = async function (context, actor) {
  const actorData = actor.system

  // Tab data
  context.tab = context.tabs.notepad

  // Part-specific data
  context.notes = actorData.notes
  context.enrichedNotes = await Loom.applications.ux.TextEditor.implementation.enrichHTML(
    actorData.notes
  )
  context.privatenotes = actorData.privatenotes
  context.enrichedPrivateNotes = await Loom.applications.ux.TextEditor.implementation.enrichHTML(
    actorData.privatenotes
  )

  return context
}

export const prepareSettingsContext = async function (context, actor) {
  const actorData = actor.system
  const actorsWithPowers = ['vampire', 'hunter', 'werewolf']

  // Tab data
  context.tab = context.tabs.settings

  if (
    context.baseActorType === 'spc' &&
    actorsWithPowers.indexOf(context.currentActorType) === -1
  ) {
    context.showOptionalPowers = true

    context.enableDisciplines = actorData.settings.enableDisciplines
    context.enableEdges = actorData.settings.enableEdges
    context.enableGifts = actorData.settings.enableGifts
  }

  return context
}

export const prepareLimitedContext = async function (context, actor) {
  const actorData = actor.system
  const actorHeaders = actorData.headers || {}

  // Part-specific data
  context.enrichedNotes = await Loom.applications.ux.TextEditor.implementation.enrichHTML(
    actorData.notes
  )
  context.enrichedAppearance = await Loom.applications.ux.TextEditor.implementation.enrichHTML(
    actorData.appearance
  )
  context.enrichedTenets = await Loom.applications.ux.TextEditor.implementation.enrichHTML(
    actorHeaders.tenets
  )
  context.enrichedTouchstones = await Loom.applications.ux.TextEditor.implementation.enrichHTML(
    actorHeaders.touchstones
  )
  context.enrichedBiography = await Loom.applications.ux.TextEditor.implementation.enrichHTML(
    actorData.biography
  )

  return context
}

export const prepareSpcStatsContext = async function (context, actor) {
  const actorData = actor.system
  // `actor.system.disciplines/edges/gifts` só guarda {visible, selected, value} —
  // nome/label (`displayName`) só existe na versão computada em `actor.derivedData`
  // (populada em `actor.js`/`prepareDerivedData`, gated por `gamesystem`). Sem este
  // fallback (mesmo padrão que `prepareDisciplinesContext`/`prepareEdgesContext` já
  // usam nas fichas de Vampire/Hunter), a categoria aparecia na árvore do SPC com o
  // nome em branco.
  const derived = actor.derivedData || {}
  // `context.gamesystem` (de `wod-actor-base.js`) pode estar travado no valor de quando
  // o ator foi criado — mesmo motivo do comentário acima sobre `disciplines`/`edges`.
  // Só importa pro segundo ramo de cada `if` abaixo (SPC com um segundo conjunto de
  // poderes ligado via `enableX`, além do `currentActorType` principal).
  const gamesystem = derived.gamesystem ?? context.gamesystem

  // Tab data
  context.tab = context.tabs.stats

  // Part-specific data
  context.standardPools = actorData.standarddicepools
  context.exceptionalPools = actorData.exceptionaldicepools

  // `traits`/`conditions` já vêm computados em `context` — mesmo motivo do comentário
  // em `prepareStatsContext`, não reatribuir a partir de `actor.system` aqui.

  if (
    context.currentActorType === 'vampire' ||
    (gamesystem === 'vampire' && context.settings.enableDisciplines === true)
  ) {
    context.showDisciplines = true
    context.disciplines = await prepareDisciplinePowers(derived.disciplines || actorData.disciplines)
  }

  if (
    context.currentActorType === 'hunter' ||
    (gamesystem === 'hunter' && context.settings.enableEdges === true)
  ) {
    context.showEdges = true
    context.edges = await prepareEdgePowers(derived.edges || actorData.edges)
  }

  if (
    context.currentActorType === 'werewolf' ||
    (gamesystem === 'werewolf' && context.settings.enableGifts === true)
  ) {
    context.showGifts = true
    context.gifts = await prepareGiftPowers(actorData.gifts)
  }

  if (context.currentActorType === 'spirit') {
    context.manifestation = actorData.manifestation
    context.enrichedManifestation =
      await Loom.applications.ux.TextEditor.implementation.enrichHTML(actorData.manifestation)
  }

  return context
}

export const prepareGroupMembersContext = async function (context, actor) {
  const actorData = actor.system

  // Tab data
  context.tab = context.tabs.members

  // Part-specific data
  // Push each group member's data to the groupMembers list\
  context.groupMembers = []
  if (actorData.members) {
    actorData.members.forEach((actorID) => {
      const actor = Loom.fromUuidSync(actorID)
      if (actor) context.groupMembers.push(actor)
    })
  }

  return context
}

export const prepareGroupFeaturesContext = async function (context, actor) {
  const actorData = actor.system
  const actorHeaders = actorData.headers || {}

  // Tab data
  context.tab = context.tabs.features

  // Part-specific data
  context.concept = actorHeaders.concept
  context.chronicle = actorHeaders.chronicle
  // `features` já vem computado em `context` — mesmo motivo do comentário em
  // `prepareStatsContext`, não reatribuir a partir de `actor.system` aqui.
  context.tenets = actorHeaders.tenets
  context.enrichedTenets = await Loom.applications.ux.TextEditor.implementation.enrichHTML(
    actorHeaders.tenets
  )
  context.biography = actorData.biography
  context.enrichedBiography = await Loom.applications.ux.TextEditor.implementation.enrichHTML(
    actorData.biography
  )

  return context
}
