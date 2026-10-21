export const _onAddNewRoll = async function (event) {
  event.preventDefault()

  // Generate a new ID
  const newRollID = Loom.utils.randomID(8)

  // Build the new roll
  const defaultRollObject = {
    name: Loom.i18n.format('WOD5E.NewString', {
      string: Loom.i18n.localize('WOD5E.RollList.Label')
    }),
    isExtendedRoll: false,
    isContestedRoll: false,
    dice: {
      skill: '',
      attribute: ''
    }
  }

  // Get the current list of saved rolls and create a new object inside of them
  const savedRolls = await Loom.users.current.getFlag('wod5e', 'rollMenuSavedRolls')
  savedRolls[newRollID] = defaultRollObject

  // Persist it back to the user flags
  await Loom.users.current.setFlag('wod5e', 'rollMenuSavedRolls', savedRolls)

  // Update the active roll to the new
  await Loom.users.current.setFlag('wod5e', 'rollMenuActiveRoll', newRollID)

  // Re-render the application window once settings are updated
  const RollMenuApplication = Loom.windowManager.get('wod5e-roll-menu')
  if (RollMenuApplication) {
    RollMenuApplication.render()
  }
}
