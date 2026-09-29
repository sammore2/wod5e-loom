export const MigrateSpecialties = async function () {
  // Legacy cleanup of "invalid" embedded specialty documents. Loom's
  // collections don't track invalid documents, so there's nothing to migrate.
  return []
}
