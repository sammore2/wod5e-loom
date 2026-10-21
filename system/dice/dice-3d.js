/**
 * How the system's dice look in the native 3D dice: the colour of each die and the symbol
 * printed on each face. The engine owns the physics and rendering; this file only supplies data.
 */
const ICONS = '/marketplace/rulesets/wod5e/assets/icons/dsn/'

// Which splat uses which letters, to turn the roll's recorded dice into dice to throw.
const SPLAT_DICE_MAP = {
  vampire: { basic: 'v', advanced: 'g' },
  werewolf: { basic: 'w', advanced: 'r' },
  hunter: { basic: 'h', advanced: 's' },
  mortal: { basic: 'm', advanced: null }
}

/**
 * Face images keyed by the label printed on the face of a d10 ("1".."9", and "0" for the ten).
 * `one` and `two` are the lowest faces, which some dice show differently (bestial failure, brutal failure).
 */
function faces({ one, two, fail, success, crit }) {
  const file = (name) => `${ICONS}${name}.png`
  const map = { 1: file(one), 2: file(two) }
  for (const n of [3, 4, 5]) map[n] = file(fail)
  for (const n of [6, 7, 8, 9]) map[n] = file(success)
  map[0] = file(crit)
  return map
}

/** The colored style swaps the hunger and desperation symbols for their colored versions. */
function definitions(style) {
  const colored = style === 'colored' ? 'c' : ''
  const normal = { one: 'normal-fail-dsn', two: 'normal-fail-dsn', fail: 'normal-fail-dsn', success: 'normal-success-dsn', crit: 'normal-crit-dsn' }
  return {
    // Mortal and vampire (non-hunger) dice: black body, plain symbols
    m: { color: '#1c1c1c', ink: '#ffffff', faceImages: faces(normal) },
    v: { color: '#1c1c1c', ink: '#ffffff', faceImages: faces(normal) },
    // Hunger dice
    g: {
      color: '#6e0000',
      ink: '#ffffff',
      faceImages: faces({
        one: `bestial-fail-dsn${colored}`,
        two: 'red-fail-dsn',
        fail: 'red-fail-dsn',
        success: `red-success-dsn${colored}`,
        crit: `red-crit-dsn${colored}`
      })
    },
    // Hunter dice
    h: {
      color: '#cb650f',
      ink: '#000000',
      faceImages: faces({ one: 'normal-fail-dsn', two: 'normal-fail-dsn', fail: 'normal-fail-dsn', success: 'hunter-normal-success-dsn', crit: 'hunter-normal-crit-dsn' })
    },
    // Desperation dice (always the colored symbols)
    s: {
      color: '#ee7e1f',
      ink: '#ffffff',
      faceImages: faces({ one: 'desperation-fail-dsnc', two: 'red-fail-dsn', fail: 'red-fail-dsn', success: 'hunter-normal-success-dsnc', crit: 'hunter-normal-crit-dsnc' })
    },
    // Werewolf dice
    w: {
      color: '#4a5115',
      ink: '#000000',
      faceImages: faces({ one: 'normal-fail-dsn', two: 'normal-fail-dsn', fail: 'normal-fail-dsn', success: 'werewolf-success-dsn', crit: 'werewolf-crit-dsn' })
    },
    // Rage dice
    r: {
      color: '#820900',
      ink: '#000000',
      faceImages: faces({ one: 'werewolf-brutal-fail-dsn', two: 'werewolf-brutal-fail-dsn', fail: 'normal-fail-dsn', success: 'werewolf-success-dsn', crit: 'werewolf-crit-dsn' })
    }
  }
}

/** Registers (or re-registers, when the style setting changes) every die of the system. */
export const registerNativeDice = function () {
  if (!Loom.dice3d) return

  let style = 'plain'
  try {
    style = Loom.settings.get('wod5e', 'diceStyle') || 'plain'
  } catch (e) {
    // Setting not registered yet: keep the default style
  }

  Loom.dice3d.unregisterDie('wod5e')
  for (const [denomination, look] of Object.entries(definitions(style))) {
    Loom.dice3d.registerDie(denomination, { base: 'd10', ...look }, 'wod5e')
  }
}

// A roll that carries its own record of basic and advanced dice (hunger, rage, desperation) tells the
// 3D dice which of the throw is which, since the server only sees plain d10s.
Loom.LoomHooks.on('dice3dRollItems', (roll, items) => {
  if (!roll?.meta?.wod5e || !roll.meta.diceData) return

  const diceData = roll.meta.diceData
  const splat = SPLAT_DICE_MAP[diceData.system || 'mortal'] || SPLAT_DICE_MAP.mortal

  const add = (denomination, results) => {
    if (!denomination) return
    for (const die of (results || []).filter((d) => !d.discarded)) {
      items.push({ denomination, faces: 10, value: die.result })
    }
  }

  add(splat.basic, diceData.basicDice?.results)
  add(splat.advanced, diceData.advancedDice?.results)
})
