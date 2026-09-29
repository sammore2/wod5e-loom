export const _onAddSelectedTokens = async function (event, target) {
  event.preventDefault()

  // Grab the chat message we're modifying
  const messageID = target.closest('.chat-message').getAttribute('data-message-id')
  const chatMessage = Loom.messages.get(messageID)

  // Use the list of currently controlled tokens to generate a map and make the necessary user objects
  const tokens = canvas.tokens.controlled
  const actorsList = tokens.map((i) => i.actor)
  const oldActorsList = chatMessage?.flags?.wod5e?.promptedRolls
  const newActorsList = {}
  actorsList.forEach((actor) => {
    if (oldActorsList[actor.id]) return

    newActorsList[actor.id] = {
      actor,
      rolled: false
    }
  })

  // Update the promptedRolls flag of the chat message with the new object we've created
  chatMessage.setFlag(
    'wod5e',
    'promptedRolls',
    Loom.utils.mergeObject(oldActorsList, newActorsList)
  )
}
