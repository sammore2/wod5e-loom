export const _onSelectSavedRoll = async function (event, target) {
  const newActiveRoll = target.closest('.saved-roll').getAttribute('data-id')

  await Loom.users.current.setFlag('wod5e', 'rollMenuActiveRoll', newActiveRoll)

  // Re-render the application window once settings are updated
  const RollMenuApplication = Loom.windowManager.get('wod5e-roll-menu')
  if (RollMenuApplication) {
    RollMenuApplication.render()
  }
}
