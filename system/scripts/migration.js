import { MigrateLegacySheets } from './migration/migrate-legacy-sheets.js'
import { MigrateSpecialties } from './migration/migrate-specialties.js'
import { MigrateItemImages } from './migration/migrate-item-images.js'
import { MigrateAnimalKen } from './migration/migrate-animal-ken.js'
import { MigrateGroupSheets } from './migration/migrate-group-sheets.js'
import { MigrateAbilitiesToAttributes } from './migration/migrate-abilities-to-attributes.js'
import { MigrateRolldataToDicepools } from './migration/migrate-rolldata-to-dicepools.js'
import { MigrateOldDetailsToNewItems } from './migration/migrate-old-details-to-new-items.js'
import { MigrateGeneralDifficulty } from './migration/migrate-general-difficulty.js'
import { MigrateSystemFlags } from './migration/migrate-system-flags.js'
import { RestoreOldWorldSettings } from './migration/restore-vtm5e-world-settings.js'

const migrationSteps = [
  { id: 'legacy-sheets-v1', run: MigrateLegacySheets },
  { id: 'specialties-v1', run: MigrateSpecialties },
  { id: 'item-images-v1', run: MigrateItemImages },
  { id: 'animal-ken-v1', run: MigrateAnimalKen },
  { id: 'group-sheets-v1', run: MigrateGroupSheets },
  { id: 'abilities-to-attributes-v1', run: MigrateAbilitiesToAttributes },
  { id: 'rolldata-to-dicepools-v1', run: MigrateRolldataToDicepools },
  { id: 'old-details-to-new-items-v1', run: MigrateOldDetailsToNewItems },
  { id: 'general-difficulty-v1', run: MigrateGeneralDifficulty },
  { id: 'system-flags-v1', run: MigrateSystemFlags },
  { id: 'restore-vtm5e-world-settings-v1', run: RestoreOldWorldSettings }
]

let migrationRun

export const migrateWorld = async () => {
  if (!Loom.user.isGM) return

  // Saved world settings load after registration. Wait before reading the ledger.
  await Loom.settings.whenReady?.('wod5e')

  // Prevent duplicate runs if the ready hook invokes this more than once in this client.
  if (migrationRun) return migrationRun
  migrationRun = runPendingMigrations()

  try {
    await migrationRun
  } finally {
    migrationRun = null
  }
}

async function runPendingMigrations() {
  const currentVersion =
    Loom.system?.version ||
    Loom.ruleset?.version ||
    Loom.systems?.get?.('wod5e')?.version ||
    '5.3.23'
  const savedMigrations = Loom.settings.get('wod5e', 'completedMigrations')
  const completedMigrations = Array.isArray(savedMigrations)
    ? [...new Set(savedMigrations.filter((id) => typeof id === 'string'))]
    : []
  const updates = []
  let failedMigration = null

  for (const migration of migrationSteps) {
    if (completedMigrations.includes(migration.id)) continue

    try {
      const migrationUpdates = await migration.run()
      if (Array.isArray(migrationUpdates)) updates.push(...migrationUpdates)

      completedMigrations.push(migration.id)
      await Loom.settings.set('wod5e', 'completedMigrations', completedMigrations)
      console.log(`World of Darkness 5e | Completed migration ${migration.id}.`)
    } catch (error) {
      failedMigration = migration.id
      console.error(
        `World of Darkness 5e | Migration ${migration.id} failed; it will be retried next time the world opens.`,
        error
      )
      break
    }
  }

  if (updates.length > 0) {
    Loom.ui?.notifications.info(`Upgrade complete (${updates.length} updates applied).`)
  }

  if (failedMigration) {
    Loom.ui?.notifications.error(
      Loom.i18n.format('WOD5E.Notifications.MigrationFailed', { string: failedMigration })
    )
    return
  }

  try {
    await Loom.settings.set('wod5e', 'worldVersion', currentVersion)
  } catch (error) {
    console.warn('World of Darkness 5e | Could not save worldVersion setting:', error)
  }
}
