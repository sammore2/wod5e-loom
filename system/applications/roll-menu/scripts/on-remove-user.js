export const _onRemoveUser = async function (event, target) {
  event.preventDefault()

  // Grab the user and the chat message we're working with
  const actorID = target.closest('.user-roll').getAttribute('data-actor-id')
  const messageID = target.closest('.chat-message').getAttribute('data-message-id')
  const chatMessage = Loom.messages.get(messageID)

  // Remove the user from the promptedRolls flag
  if (true) {
    chatMessage.update({ [`flags.wod5e.promptedRolls.-=${actorID}`]: null })
  } else {
    const socketData = {
      action: 'removeActor',
      actorID,
      messageID
    }

    Loom.socket.emit('system.wod5e', socketData)
  }
}
