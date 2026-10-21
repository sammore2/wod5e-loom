export const _onOpenRollBuilder = async function () {
  await Loom.users.current.setFlag('wod5e', 'rollMenuActiveRoll', 'temp')

  // Re-render the application window once settings are updated
  const RollMenuApplication = Loom.windowManager.get('wod5e-roll-menu')
  if (RollMenuApplication) {
    RollMenuApplication.render()
  }
}
