export const _onRemoveSavedRoll = async function (event, target) {
  // Grab all the variables we need upfront
  const rollToRemove = target.closest('.saved-roll').getAttribute('data-id')
  const currentActiveRoll = Loom.users.current.getFlag('wod5e', 'rollMenuActiveRoll')
  const savedRolls = Loom.utils.duplicate(
    Loom.users.current.getFlag('wod5e', 'rollMenuSavedRolls')
  )

  // Define the content of the Dialog
  const content = `<p>
    ${Loom.i18n.format('WOD5E.ConfirmDeleteDescription', {
      string: savedRolls[currentActiveRoll].name
    })}
  </p>`

  // Prompt a dialog for the user to confirm they want to delete the item
  const confirmDelete = await Loom.LoomDialog.wait({
    window: {
      title: Loom.i18n.localize('WOD5E.ConfirmDelete')
    },
    classes: ['wod5e', 'dialog'],
    content,
    modal: true,
    buttons: [
      {
        label: Loom.i18n.localize('WOD5E.Confirm'),
        action: true
      },
      {
        label: Loom.i18n.localize('WOD5E.Cancel'),
        action: false
      }
    ]
  })

  if (confirmDelete) {
    // Remove the roll
    delete savedRolls[rollToRemove]

    // If the roll was the one currently being viewed, reset the active roll to the first
    // set roll, or just nothing
    if (rollToRemove === currentActiveRoll) {
      const keys = Object.keys(savedRolls)
      const newActiveRoll = keys.length ? keys[0] : ''

      await Loom.users.current.setFlag('wod5e', 'rollMenuActiveRoll', newActiveRoll)
    }

    // Update the saved rolls flag
    await Loom.users.current.update({ [`flags.wod5e.rollMenuSavedRolls.-=${rollToRemove}`]: null })

    // Re-render the application window once settings are updated
    const RollMenuApplication = Loom.windowManager.get('wod5e-roll-menu')
    if (RollMenuApplication) {
      RollMenuApplication.render()
    }
  }
}
