/**
 * Flattens an actor's system data into a flat list of leaf-value paths, for the
 * "Caminho a Verificar" (Path to Check) autocomplete on a modifier's "Se for igual a"/
 * "Se o Caminho For" conditions. Unlike getSelectorsList() (roll-selector categories),
 * there's no curated/localized name source for arbitrary schema fields, so the path
 * itself is used as the display name — still far better than typing it blind.
 *
 * @param actor  The actor whose data should be introspected. If the item this dialog
 *               is editing isn't on an actor (a world-level item), there's nothing to
 *               introspect and an empty list is returned — the field still works as
 *               plain text, it just loses the autocomplete.
 */
export const getActorDataPathsList = (actor) => {
  const system = actor?.system || actor?.systemData || {}
  const paths = []

  const walk = (obj, prefix) => {
    for (const [key, value] of Object.entries(obj || {})) {
      const path = prefix ? `${prefix}.${key}` : key

      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        walk(value, path)
      } else if (typeof value !== 'object') {
        paths.push({ id: path, displayName: path })
      }
    }
  }

  walk(system, '')

  return paths
}
