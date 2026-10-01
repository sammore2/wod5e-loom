export const MigrateLegacySheets = async function () {
  const invalidActorsList = Loom.actors.invalidDocumentIds
  const totalIterations = invalidActorsList.size
  const migrationIDs = []

  // If there's nothing to go through, then just resolve and move on.
  if (totalIterations === 0) {
    return []
  }

  // Collect invalid actors and correct them (v3.0.0)
  for (const id of invalidActorsList) {
    const actor = Loom.actors.get(id)

    // Migrate any legacy sheets to vampire sheets
    if (actor.type === 'character') {
      Loom.ui?.notifications.info(`Fixing actor ${actor.name}: Changing Legacy Sheet to Vampire Sheet.`)

      migrationIDs.push(id)
      await actor.update({ type: 'vampire' })
    }
  }

  return migrationIDs
}
