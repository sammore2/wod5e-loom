export const getActorTypes = async function (actor) {
  const currentActorType = actor.type

  const playerTypes = {
    mortal: 'TYPES.Actor.mortal',
    vampire: 'TYPES.Actor.vampire',
    ghoul: 'TYPES.Actor.ghoul',
    werewolf: 'TYPES.Actor.werewolf',
    hunter: 'TYPES.Actor.hunter'
  }

  const spcTypes = {
    mortal: 'TYPES.Actor.mortal',
    ghoul: 'TYPES.Actor.ghoul',
    vampire: 'TYPES.Actor.vampire',
    werewolf: 'TYPES.Actor.werewolf',
    spirit: 'WOD5E.WTA.Spirit',
    hunter: 'TYPES.Actor.hunter'
  }

  const groupTypes = {
    coterie: 'WOD5E.VTM.Coterie',
    cell: 'WOD5E.HTR.Cell',
    pack: 'WOD5E.WTA.Pack'
  }

  const localizeTypes = (types) =>
    Object.fromEntries(Object.entries(types).map(([id, key]) => [id, Loom.i18n.localize(key)]))

  if (currentActorType in playerTypes) {
    return {
      baseActorType: currentActorType,
      currentActorType,
      currentTypeLabel: Loom.i18n.localize(playerTypes[currentActorType]),
      typePath: 'type',
      types: localizeTypes(playerTypes)
    }
  } else if (currentActorType === 'spc') {
    return {
      baseActorType: 'spc',
      currentActorType: actor.system.spcType,
      currentTypeLabel: Loom.i18n.localize(spcTypes[actor.system.spcType]),
      typePath: 'system.spcType',
      types: localizeTypes(spcTypes)
    }
  } else if (currentActorType === 'group') {
    return {
      baseActorType: 'group',
      currentActorType: actor.system.groupType,
      currentTypeLabel: Loom.i18n.localize(groupTypes[actor.system.groupType]),
      typePath: 'system.groupType',
      types: localizeTypes(groupTypes)
    }
  } else {
    // The default is an object that has only the current type in it
    return {
      baseActorType: currentActorType,
      currentActorType,
      currentTypeLabel: currentActorType,
      typePath: 'type',
      types: {
        [currentActorType]: currentActorType
      }
    }
  }
}
