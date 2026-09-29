/**
 * Define all Dice So Nice presets
 * @return {Promise}
 */
export const loadDiceSoNice = async function (dice3d) {
  dice3d.addSystem({ id: 'wod5e', name: 'wod5e' }, true)
  dice3d.addDicePreset(
    {
      type: 'dm',
      labels: [
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-crit-dsn.png'
      ],
      bumpMaps: [
        '',
        '',
        '',
        '',
        '',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-crit-dsn-bump.png'
      ],
      colorset: 'black',
      system: 'wod5e'
    },
    'd10'
  )

  dice3d.addDicePreset(
    {
      type: 'dv',
      labels: [
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-crit-dsn.png'
      ],
      bumpMaps: [
        '',
        '',
        '',
        '',
        '',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-crit-dsn-bump.png'
      ],
      colorset: 'black',
      system: 'wod5e'
    },
    'd10'
  )

  dice3d.addColorset(
    {
      name: 'hunger',
      description: 'V5 Hunger Dice',
      category: 'V5',
      foreground: '#fff',
      background: '#6e0000',
      texture: 'none',
      edge: '#6e0000',
      material: 'plastic',
      font: 'Arial Black',
      fontScale: {
        d6: 1.1,
        df: 2.2,
        dv: 0.8,
        dg: 0.8
      }
    },
    'default'
  )

  dice3d.addDicePreset(
    {
      type: 'dg',
      labels: [
        '/marketplace/rulesets/wod5e/assets/icons/dsn/bestial-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/red-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/red-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/red-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/red-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/red-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/red-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/red-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/red-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/red-crit-dsn.png'
      ],
      bumpMaps: [
        '/marketplace/rulesets/wod5e/assets/icons/dsn/bestial-fail-dsn-bump.png',
        '',
        '',
        '',
        '',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/red-crit-dsn-bump.png'
      ],
      colorset: 'hunger',
      system: 'wod5e'
    },
    'd10'
  )

  dice3d.addDicePreset(
    {
      type: 'dh',
      labels: [
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-crit-dsn.png'
      ],
      bumpMaps: [
        '',
        '',
        '',
        '',
        '',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-crit-dsn.png'
      ],
      colorset: 'hunterdice',
      system: 'wod5e'
    },
    'd10'
  )

  dice3d.addColorset(
    {
      name: 'hunterdice',
      description: 'Hunter Dice',
      category: 'V5',
      foreground: '#000000',
      background: '#cb650f',
      texture: 'none',
      edge: '#cb650f',
      material: 'plastic',
      font: 'Arial Black',
      fontScale: {
        d6: 1.1,
        df: 2.2,
        dv: 0.8,
        dg: 0.8,
        dh: 0.7
      }
    },
    'default'
  )

  dice3d.addColorset(
    {
      name: 'desperation',
      description: 'Desperation Dice',
      category: 'V5',
      foreground: '#fff',
      background: '#ee7e1f',
      texture: 'none',
      edge: '#ee7e1f',
      material: 'plastic',
      font: 'Arial Black',
      fontScale: {
        d6: 1.1,
        df: 2.5,
        dv: 0.8,
        dg: 0.8,
        dh: 0.7
      }
    },
    'default'
  )

  dice3d.addDicePreset(
    {
      type: 'ds',
      labels: [
        '/marketplace/rulesets/wod5e/assets/icons/dsn/desperation-fail-dsnc.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/red-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/red-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/red-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/red-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsnc.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsnc.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsnc.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsnc.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-crit-dsnc.png'
      ],
      bumpMaps: [
        '/marketplace/rulesets/wod5e/assets/icons/dsn/desperation-fail-dsn-bump.png',
        '',
        '',
        '',
        '',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-crit-dsn.png'
      ],
      colorset: 'black',
      system: 'wod5e'
    },
    'd10'
  )

  dice3d.addDicePreset(
    {
      type: 'dw',
      labels: [
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-crit-dsn.png'
      ],
      bumpMaps: [
        '',
        '',
        '',
        '',
        '',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-crit-dsn-bump.png'
      ],
      colorset: 'werewolf',
      system: 'wod5e'
    },
    'd10'
  )

  dice3d.addDicePreset(
    {
      type: 'dr',
      labels: [
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-brutal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-brutal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-crit-dsn.png'
      ],
      bumpMaps: [
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-brutal-fail-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-brutal-fail-dsn-bump.png',
        '',
        '',
        '',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-crit-dsn-bump.png'
      ],
      colorset: 'rage',
      system: 'wod5e'
    },
    'd10'
  )

  dice3d.addColorset(
    {
      name: 'werewolf',
      description: 'Werewolf Dice',
      category: 'V5',
      foreground: '#000000',
      background: '#4a5115',
      texture: 'none',
      edge: '#4a5115',
      material: 'plastic',
      font: 'Arial Black'
    },
    'default'
  )

  dice3d.addColorset(
    {
      name: 'rage',
      description: 'Rage Dice',
      category: 'V5',
      foreground: '#000000',
      background: '#820900',
      texture: 'none',
      edge: '#820900',
      material: 'plastic',
      font: 'Arial Black'
    },
    'default'
  )

  dice3d.addSystem({ id: 'vtm5x', name: 'wod5e Custom' }, true)
  dice3d.addDicePreset(
    {
      type: 'dv',
      labels: [
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-crit-dsn.png'
      ],
      bumpMaps: [
        '',
        '',
        '',
        '',
        '',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-crit-dsn-bump.png'
      ],
      system: 'vtm5x'
    },
    'd10'
  )

  dice3d.addDicePreset(
    {
      type: 'dg',
      labels: [
        '/marketplace/rulesets/wod5e/assets/icons/dsn/bestial-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/red-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/red-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/red-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/red-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/red-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/red-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/red-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/red-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/red-crit-dsn.png'
      ],
      bumpMaps: [
        '/marketplace/rulesets/wod5e/assets/icons/dsn/bestial-fail-dsn-bump.png',
        '',
        '',
        '',
        '',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/red-crit-dsn-bump.png'
      ],
      system: 'vtm5x'
    },
    'd10'
  )

  dice3d.addDicePreset(
    {
      type: 'dh',
      labels: [
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-crit-dsn.png'
      ],
      bumpMaps: [
        '',
        '',
        '',
        '',
        '',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-crit-dsn.png'
      ],
      system: 'vtm5x'
    },
    'd10'
  )

  dice3d.addDicePreset(
    {
      type: 'ds',
      labels: [
        '/marketplace/rulesets/wod5e/assets/icons/dsn/desperation-fail-dsnc.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/red-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/red-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/red-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/red-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsnc.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsnc.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsnc.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsnc.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-crit-dsnc.png'
      ],
      bumpMaps: [
        '/marketplace/rulesets/wod5e/assets/icons/dsn/desperation-fail-dsn-bump.png',
        '',
        '',
        '',
        '',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-crit-dsn.png'
      ],
      system: 'vtm5x'
    },
    'd10'
  )

  dice3d.addDicePreset(
    {
      type: 'dw',
      labels: [
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-crit-dsn.png'
      ],
      bumpMaps: [
        '',
        '',
        '',
        '',
        '',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-crit-dsn-bump.png'
      ],
      system: 'vtm5x'
    },
    'd10'
  )

  dice3d.addDicePreset(
    {
      type: 'dr',
      labels: [
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-brutal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-brutal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-crit-dsn.png'
      ],
      bumpMaps: [
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-brutal-fail-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-brutal-fail-dsn-bump.png',
        '',
        '',
        '',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/werewolf-crit-dsn-bump.png'
      ],
      system: 'vtm5x'
    },
    'd10'
  )

  dice3d.addSystem({ id: 'vtm5y', name: 'wod5e Colors' }, true)
  dice3d.addDicePreset(
    {
      type: 'dv',
      labels: [
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-crit-dsn.png'
      ],
      bumpMaps: [
        '',
        '',
        '',
        '',
        '',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-crit-dsn-bump.png'
      ],
      system: 'vtm5y'
    },
    'd10'
  )

  dice3d.addDicePreset(
    {
      type: 'dg',
      labels: [
        '/marketplace/rulesets/wod5e/assets/icons/dsn/bestial-fail-dsnc.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/red-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/red-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/red-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/red-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/red-success-dsnc.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/red-success-dsnc.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/red-success-dsnc.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/red-success-dsnc.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/red-crit-dsnc.png'
      ],
      bumpMaps: [
        '/marketplace/rulesets/wod5e/assets/icons/dsn/bestial-fail-dsn-bump.png',
        '',
        '',
        '',
        '',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-success-dsn-bump.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/red-crit-dsn-bump.png'
      ],
      system: 'vtm5y'
    },
    'd10'
  )

  dice3d.addDicePreset(
    {
      type: 'dh',
      labels: [
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/normal-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-crit-dsn.png'
      ],
      bumpMaps: [
        '',
        '',
        '',
        '',
        '',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-crit-dsn.png'
      ],
      system: 'vtm5y'
    },
    'd10'
  )

  dice3d.addDicePreset(
    {
      type: 'ds',
      labels: [
        '/marketplace/rulesets/wod5e/assets/icons/dsn/desperation-fail-dsnc.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/red-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/red-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/red-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/red-fail-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsnc.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsnc.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsnc.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsnc.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-crit-dsnc.png'
      ],
      bumpMaps: [
        '/marketplace/rulesets/wod5e/assets/icons/dsn/desperation-fail-dsn-bump.png',
        '',
        '',
        '',
        '',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-success-dsn.png',
        '/marketplace/rulesets/wod5e/assets/icons/dsn/hunter-normal-crit-dsn.png'
      ],
      system: 'vtm5y'
    },
    'd10'
  )
}

// Mapeamento dos tipos de dados do WoD5e para os presets do Dice So Nice
const SPLAT_DICE_MAP = {
  vampire: {
    basic: { denom: 'v', name: 'VampireDie' },
    advanced: { denom: 'g', name: 'VampireHungerDie' }
  },
  werewolf: {
    basic: { denom: 'w', name: 'WerewolfDie' },
    advanced: { denom: 'r', name: 'WerewolfRageDie' }
  },
  hunter: {
    basic: { denom: 'h', name: 'HunterDie' },
    advanced: { denom: 's', name: 'HunterDesperationDie' }
  },
  mortal: {
    basic: { denom: 'm', name: 'MortalDie' },
    advanced: null
  }
}

// Hook do Dice So Nice para sincronizar os dados 3D com os resultados reais do WoD5e
if (typeof Loom !== 'undefined' && Loom.LoomHooks) {
  Loom.LoomHooks.on('diceSoNiceRollStart', (messageID, context) => {
    const roll = context?.roll
    if (!roll?.meta?.wod5e || !roll.meta.diceData) return

    const diceData = roll.meta.diceData
    const system = diceData.system || 'mortal'
    const splat = SPLAT_DICE_MAP[system] || SPLAT_DICE_MAP.mortal
    const dice = []

    // Dados basicos (ex: dv para vampiro, dw para lobisomem, etc.)
    const basicResults = (diceData.basicDice?.results || []).filter((d) => !d.discarded)
    if (basicResults.length > 0) {
      dice.push({
        faces: 10,
        number: basicResults.length,
        results: basicResults.map((d) => ({ result: d.result })),
        constructor: {
          name: splat.basic.name,
          DENOMINATION: splat.basic.denom
        }
      })
    }

    // Dados avancados (ex: dg para fome, dr para furia, ds para desespero)
    if (splat.advanced) {
      const advResults = (diceData.advancedDice?.results || []).filter((d) => !d.discarded)
      if (advResults.length > 0) {
        dice.push({
          faces: 10,
          number: advResults.length,
          results: advResults.map((d) => ({ result: d.result })),
          constructor: {
            name: splat.advanced.name,
            DENOMINATION: splat.advanced.denom
          }
        })
      }
    }

    if (dice.length > 0) {
      context.roll = {
        dice,
        total: diceData.totalResult ?? roll.total ?? 0
      }
    }
  })
}
