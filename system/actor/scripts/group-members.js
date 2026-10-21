export const _addActor = async function (group, uuid) {
  // Define the actor data
  const actor = Loom.fromUuidSync(uuid)

  if (!actor) {
    console.warn(`World of Darkness 5e | Cannot add missing actor with UUID ${uuid} to a group.`)
    return
  }

  if (!group?.system) return

  // Don't let group sheets be added to group sheets
  if (actor.type === 'group') return

  const actorReferences = new Set([actor.uuid, actor.id, uuid].filter(Boolean))
  const groupMembers = Array.isArray(group.system.members) ? group.system.members : []

  // Check if the actor is unique in the already existing list;
  // Returns false if it's found, or true if it's not found
  const actorIsntUnique = groupMembers.some((member) => actorReferences.has(getActorReference(member)))
  if (actorIsntUnique) {
    Loom.ui?.notifications.warn(`Actor ${actor.name} is already part of this group.`)

    return
  }

  // Check if the actor is already in a group and if the group still exists as well
  // as whether the actor is in the group

  // We do this weirdness because there's circumstances, either through data mani-
  // pulation or just bad data in general, where the actor's "group" value or the
  // group's "members" array can get out of sync. Software is great.

  // Anyway, if any of these three are false, we can allow the actor to be put onto
  // a new group.

  const actorHasGroup = actor.system?.group
  const groupExists = actorHasGroup ? Loom.actors.get(actorHasGroup) : null
  const existingGroupMembers = Array.isArray(groupExists?.system?.members)
    ? groupExists.system.members
    : []
  const actorIsInGroup = existingGroupMembers.some((member) =>
    actorReferences.has(getActorReference(member))
  )

  if (actorHasGroup && groupExists && actorIsInGroup) {
    Loom.ui?.notifications.warn(`Actor ${actor.name} is already in an existing group.`)

    return
  }

  // If we determined that the actor wasn't in the group, but the group existed
  // we should clean up the bad data
  if (groupExists && !actorIsInGroup) {
    await _removeMemberFromGroup(actor, groupExists)
  }

  // If the actor exists, is unique, and does not already belong to an existing group, continue
  // Define the current members list
  const membersList = [...groupMembers]

  // Push actor to the list
  membersList.push(uuid)

  // Update the group sheet with the new actor
  await group.update({ 'system.members': membersList })

  // Set the actor's group to the group's ID
  await actor.update({ 'system.group': group.id })

  // Update the group's permissions to include the players as limited by default if the default ownership is "none"
  // Otherwise keep whatever default ownership the storyteller has set
  if (actor.hasPlayerOwner && group.ownership.default === 0) {
    await group.update({ ownership: { default: 1 } })
  }

  // `Loom.actors.render()` não existe no LoomVTT (estourava
  // "Loom.actors.render is not a function"). A sidebar já se re-renderiza sozinha
  // ao receber `actor.updated`/`actor.created` via WS.
}

export const _removeActor = async function (event, target) {
  event.preventDefault()

  // Era `if (!this.true) return` — `this.true` nunca existe (não é uma
  // propriedade real), então a condição dava sempre `true` e a função
  // retornava ANTES de fazer qualquer coisa: "Remover" num membro do grupo
  // nunca funcionava, silenciosamente. `this.isEditable` é o guard real
  // (mesmo usado em `_canDragStart`/`_canDragDrop` nesta mesma ficha).
  if (!this.isEditable) return

  // Define variables
  const uuid = target.getAttribute('data-uuid')
  const group = this.actor
  const actor = Loom.fromUuidSync(uuid)

  if (!actor || !group) {
    console.warn(`World of Darkness 5e | Cannot remove missing actor with UUID ${uuid} from a group.`)
    return
  }

  await _removeMemberFromGroup(actor, group)
}

export const _removeMemberFromGroup = async function (actor, group) {
  if (!actor || !group?.system) return

  const actorReferences = new Set([actor.uuid, actor.id].filter(Boolean))
  const groupMembers = Array.isArray(group.system.members) ? group.system.members : []
  const membersList = groupMembers.filter(
    (member) => !actorReferences.has(getActorReference(member))
  )

  // Update the group sheet with the new members list
  await group.update({ 'system.members': membersList })

  // Empty the group field on the actor
  await actor.update({ 'system.group': '' })
}

function getActorReference(member) {
  if (typeof member === 'string') return member
  return member?.uuid ?? member?.id ?? null
}

export const _openActorSheet = async function (event, target) {
  event.preventDefault()

  // Define variables
  const uuid = target.getAttribute('data-uuid')
  const actor = Loom.fromUuidSync(uuid)
  if (!actor) return

  if (typeof actor.sheet?.render === 'function') {
    actor.sheet.render(true)
  } else if (typeof actor.render === 'function') {
    actor.render(true)
  }
}
