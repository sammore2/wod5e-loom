const isGM = () => (Loom.user?.role ?? 0) >= 4

export async function RollPromptSockets() {
  Loom.socket.on('system.wod5e', async (data) => {
    if (!data || !data.action) return

    if (data.action === 'updateRollPrompt') {
      // Only the GM or the owner of the rolled actor may apply the update
      const actor = Loom.actors.get(data.actorID)
      const isOwner =
        actor &&
        typeof actor.testUserPermission === 'function' &&
        actor.testUserPermission(Loom.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)

      if (isGM() || isOwner) updateRollPrompt(data)
    }

    if (data.action === 'removeActor' && isGM())
      removeActorFromRollPrompt(data)
  })
}

export async function updateRollPrompt(data) {
  const chatMessage = Loom.messages.get(data.messageID)
  const promptedRollsList = chatMessage?.flags?.wod5e?.promptedRolls
  if (!promptedRollsList || !promptedRollsList[data.actorID]) return

  const updatedList = Loom.utils.mergeObject(promptedRollsList, {
    [data.actorID]: {
      rolled: true,
      roll: Loom.Roll.fromData(data.roll)
    }
  })

  await chatMessage.setFlag('wod5e', 'promptedRolls', updatedList)
}

export async function removeActorFromRollPrompt(data) {
  const chatMessage = Loom.messages.get(data.messageID)

  const updatedList = { ...(chatMessage?.flags?.wod5e?.promptedRolls ?? {}) }
  delete updatedList[data.actorID]

  await chatMessage.setFlag('wod5e', 'promptedRolls', updatedList)
}
