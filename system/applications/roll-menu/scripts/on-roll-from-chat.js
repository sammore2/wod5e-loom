export const _onRollFromChat = async function (event, target) {
  event.preventDefault()

  // Ensure we have a valid actor to roll on
  const actor = Loom.actors.get(
    target.getAttribute('data-actor-id') || Loom.ChatMessage.getSpeaker().actor
  )

  if (!actor) {
    Loom.ui?.notifications.warn(Loom.i18n.localize('WOD5E.Notifications.NoTokenSelected'))
  }

  const dataset = $(target).data()

  // Pipe the roll to our RollFromDataset function
  WOD5E.api.RollFromDataset({
    dataset,
    actor
  })
}
