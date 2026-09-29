export const AdjustHunger = async function () {
  // Actors of the tokens selected on the canvas (linked casts only, see Loom.canvas.getControlledActors)
  const { actors: actorsList, skippedUnlinked } = Loom.canvas.getControlledActors()
  if (skippedUnlinked > 0) {
    Loom.ui.notifications.warn(`${skippedUnlinked} unlinked token(s) skipped: their data lives on the token, not the actor.`)
  }
  if (actorsList.length === 0) return

  // Build the options for the select dropdown
  const content = new Loom.fields_v14.NumberField({
    label: Loom.i18n.localize('WOD5E.Compendiums.Macros.AdjustHungerBy'),
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
  const hungerModifier = await Loom.LoomDialog.prompt({
    window: {
      title: Loom.i18n.localize('WOD5E.Compendiums.Macros.AdjustHunger')
    },
    classes: ['wod5e', 'macro', 'dialog', 'vampire', 'dialog'],
    content,
    ok: {
      callback: (event, button, dialog) => new Loom.LoomFormData(dialog.getBody()).object.mod
    },
    modal: true
  })

  if (Number(hungerModifier)) {
    for (const actor of actorsList) {
      // If the actor isn't a vampire or doesn't have hunger, skip them
      if (actor.system.gamesystem !== 'vampire' || !actor.system?.hunger) continue

      // Grab the actor's current hunger
      const oldValue = Number(actor.system.hunger.value)

      // Add the hunger modifier to the actor's old vlaue
      let newValue = oldValue + Number(hungerModifier)

      // Check to make sure the input doesn't go over or below max/min values
      if (newValue > 5) newValue = 5
      if (newValue < 0) newValue = 0

      actor.update({ 'system.hunger.value': newValue })
    }
  }
}
