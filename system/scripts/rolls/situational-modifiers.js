/**
 * Function to help collect any situational modifiers
 *
 * @param actor                     The actor that the modifiers are being looked up from
 * @param selectors                 All selectors that the function will look for
 */
export async function getSituationalModifiers({ actor, selectors }) {
  // Variables
  const data = actor.system
  // `actor.system` is a getter recomputed fresh on every access (never cached — see the
  // `gamesystem` comment in `actor.js`'s `prepareDerivedData`), so the splat bonuses (Blood
  // Surge, etc.) and item-based bonuses that `prepareDerivedData` computes never actually
  // survive on it: they're written into `actor.derivedData`, a plain persistent property,
  // which is the only place they can reliably be read back from.
  const hasDerivedItemModifiers = Array.isArray(actor.derivedData?.itemModifiers)
  const derivedBonuses = [
    ...(Array.isArray(actor.derivedData?.bonuses) ? actor.derivedData.bonuses : []),
    ...(hasDerivedItemModifiers
      ? actor.derivedData.itemModifiers
      : Array.isArray(data?.itemModifiers)
        ? data.itemModifiers
        : [])
  ]
  const allModifiers = getModifiers(data, selectors, derivedBonuses)
  const activeModifiers = filterModifiers(data, allModifiers)

  // Return the array of modifiers to whatever called for it
  return activeModifiers

  // Function to parse through the actor's data and retrieve any modifiers
  // that match any of the selectors given
  function getModifiers(data, selectors, extraModifiers = []) {
    const modifiers = []

    // Collect from one canonical source. Item modifiers in `actor.system` may be
    // a stale copy of the same item bonuses already recomputed into `derivedData`.
    // Reading both lists caused each Quality/Defect bonus to appear twice and the
    // same bonus to be included twice in the dice pool.
    if (extraModifiers.length > 0) {
      const matchingExtra = extraModifiers.filter(
        (bonus) =>
          selectors.some((selector) => bonus?.paths?.includes(selector)) ||
          bonus?.paths?.includes('all')
      )

      if (matchingExtra.length > 0) {
        modifiers.push(...matchingExtra)
      }
    }

    // NOTA: havia aqui uma busca recursiva por qualquer `.bonuses` dentro de `actor.system`
    // (o snapshot efêmero). Removida: `extraModifiers` acima já cobre exatamente os mesmos
    // bônus (splat + item) a partir de `actor.derivedData`, a fonte que realmente persiste.
    // Manter os dois caminhos duplicava cada bônus sempre que `actor.system.bonuses` também
    // tinha o mesmo valor gravado (o que acontecia sempre que um `update()` anterior tinha
    // "assado" por acidente o snapshot antigo no banco — ver comentário em `actor.js`).

    return modifiers
  }

  // Filter out only modifiers that apply to the roll we're doing
  function filterModifiers(data, modifiers) {
    return modifiers.filter((modifier) => {
      const { check, path, value } = modifier?.activeWhen || {}
      const displayWhenInactive = modifier?.displayWhenInactive || ''
      const unless = modifier?.unless || ''
      let showModifier = false

      // Check if any 'unless' strings are present in the 'selectors' array
      if (unless && unless.some((value) => selectors.indexOf(value) !== -1)) {
        modifier.isActive = false
        return false
      }

      // As long as the path is found, the modifier will be active
      if (check === 'always') {
        modifier.isActive = true
        showModifier = true
      }

      // If the path has a qualifier, it's checked for here
      if (check === 'isEqual') {
        const pathValue = path.split('.').reduce((obj, key) => obj[key], data)
        modifier.isActive = true

        // Check both number and string values
        showModifier = String(pathValue) === String(value) || Number(pathValue) === Number(value)
      }

      // If the qualifier is the path, the modifier will be active
      if (check === 'isPath' && selectors.indexOf(path) > -1) {
        modifier.isActive = true
        showModifier = true
      }

      // If the modifier should be shown no matter what, still show it but don't make it active
      if (displayWhenInactive && !modifier.isActive) {
        modifier.isActive = false
        showModifier = true
      }

      return showModifier
    })
  }
}

/**
 * A function that wraps around getSituationalModifiers, but returns
 * the total active modifiers amount as a number instead of an array
 * of all the modifiers as objects
 *
 * @param actor                     The actor that the modifiers are being looked up from
 * @param selectors                 All selectors that the function will look for
 */
export async function getActiveModifiers({ actor, selectors }) {
  const situationalModifiers = await getSituationalModifiers({
    actor,
    selectors
  })
  const activeModifiers = situationalModifiers.filter((modifier) => modifier.isActive === true)
  let totalValue = 0
  let totalACDValue = 0

  activeModifiers.forEach((modifier) => {
    totalValue += parseInt(modifier.value)

    if (modifier.advancedCheckDice) {
      totalACDValue += parseInt(modifier.advancedCheckDice)
    }
  })

  return {
    totalValue,
    totalACDValue
  }
}
