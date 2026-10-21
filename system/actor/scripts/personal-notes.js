const PERSONAL_NOTES_FLAG = 'actorPersonalNotes'

const getActorNotesKey = (actor) => actor?.uuid || actor?.id || null

export const getActorPersonalNotes = async (actor) => {
  const user = Loom.users?.current
  const actorKey = getActorNotesKey(actor)
  if (!user || !actorKey) return ''

  const notesByActor = await user.getFlag('wod5e', PERSONAL_NOTES_FLAG)
  const notes = notesByActor?.[actorKey]
  return typeof notes === 'string' ? notes : ''
}

export const saveActorPersonalNotes = async (actor, value) => {
  const user = Loom.users?.current
  const actorKey = getActorNotesKey(actor)
  if (!user || !actorKey) return

  const storedNotes = await user.getFlag('wod5e', PERSONAL_NOTES_FLAG)
  const notesByActor =
    storedNotes && typeof storedNotes === 'object' && !Array.isArray(storedNotes)
      ? { ...storedNotes }
      : {}
  notesByActor[actorKey] = typeof value === 'string' ? value : ''

  await user.setFlag('wod5e', PERSONAL_NOTES_FLAG, notesByActor)
}
