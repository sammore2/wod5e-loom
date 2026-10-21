export const AdjustRage = async function () {
  // Actors of the tokens selected on the canvas (linked casts only, see Loom.canvas.getControlledActors)
  const { actors: actorsList, skippedUnlinked } = Loom.canvas.getControlledActors()
  if (skippedUnlinked > 0) {
    Loom.ui.notifications.warn(`${skippedUnlinked} unlinked token(s) skipped: their data lives on the token, not the actor.`)
  }
  if (actorsList.length === 0) return

  // Build the options for the select dropdown
  const content = new Loom.fields_v14.NumberField({
    label: Loom.i18n.localize('WOD5E.Compendiums.Macros.AdjustRageBy'),
    required: true,
    nullable: false,
    initial: 0,
    min: -5,
    max: 5
  }).toFormGroup(
    {},
    {
      name: 'mod'
    }
  ).outerHTML

  // Prompt a dialog to determine which edge we're adding
  const rageModifier = await Loom.LoomDialog.prompt({
    window: {
      title: Loom.i18n.localize('WOD5E.Compendiums.Macros.AdjustRage')
    },
    classes: ['wod5e', 'macro', 'dialog', 'werewolf', 'dialog'],
    content,
    ok: {
      callback: (event, button, dialog) => new Loom.LoomFormData(dialog.getBody()).object.mod
    },
    modal: true
  })

  if (Number(rageModifier)) {
    for (const actor of actorsList) {
      // If the actor isn't a werewolf or doesn't have rage, skip them
      if (actor.system.gamesystem !== 'werewolf' || !actor.system?.rage) continue

      // Grab the actor's current rage
      const oldValue = Number(actor.system.rage.value)

      // Add the rage modifier to the actor's old vlaue
      let newValue = oldValue + Number(rageModifier)

      // Check to make sure the input doesn't go over or below max/min values
      if (newValue > 5) newValue = 5
      if (newValue < 0) newValue = 0

      actor.update({ 'system.rage.value': newValue })
    }
  }
}
