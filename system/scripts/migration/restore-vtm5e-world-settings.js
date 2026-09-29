export const RestoreOldWorldSettings = async function () {
  // Get world settings from storage that start with 'vtm5e'
  
  // Fallback for LoomVTT: there is no Loom.settings.storage.get('world')
  let rawSettings = [];
  if (Loom.settings.storage) {
    rawSettings = [...Loom.settings.storage.get('world').values()];
  } else {
    // LoomVTT stores it in Loom.settings.settings Map directly
    rawSettings = Array.from(Loom.settings.settings.entries()).map(([k, v]) => ({ key: k, value: v }));
  }
  const worldSettings = rawSettings.filter((setting) =>

    setting.key.startsWith('vtm5e.')
  )

  // Check to make sure there's at least one setting we need to update
  if (worldSettings.length > 0 && !Loom.settings.get('wod5e', 'settingsMigrationComplete')) {
    // Begin migration
    Loom.ui?.notifications.info(
      'Migrating old vtm5e world settings. Please do not shut down your world until this is complete.'
    )

    // Restore world settings from inactive settings by accessing Loom.settings.storage
    // We have to do this because the 'vtm5e' scope isn't active when the world is migrated over
    worldSettings.forEach((setting) => {
      // Snip out the 'vtm5e' part to get the right 'wod5e' key, and then set the value
      // to complete the migration
      Loom.settings.set('wod5e', setting.key.replace('vtm5e.', ''), setting.value)
    })

    // Complete migration
    Loom.ui?.notifications.info('World settings migration complete.')
    Loom.settings.set('wod5e', 'settingsMigrationComplete', true)
  }
}
