export const cssVariablesRecord = () => {
  const record = {
    vampire: {
      label: Loom.i18n.format('WOD5E.Settings.StringStyling', {
        string: Loom.i18n.localize('TYPES.Actor.vampire')
      }),
      settings: {
        vampireBaseColor: {
          id: 'vampire-base-color',
          settingName: Loom.i18n.format('WOD5E.Settings.StringBaseColor', {
            string: Loom.i18n.localize('TYPES.Actor.vampire')
          }),
          settingId: 'vampireBaseColor',
          cssVariable: '--vampire-theme-filter',
          defaultColor: '#FF2B2B80'
        },
        vampirePrimaryColor: {
          id: 'vampire-primary-color',
          settingName: Loom.i18n.format('WOD5E.Settings.StringPrimaryColor', {
            string: Loom.i18n.localize('TYPES.Actor.vampire')
          }),
          settingId: 'vampirePrimaryColor',
          cssVariable: '--vampire-color-1',
          defaultColor: '#650202'
        },
        vampireSecondaryColor: {
          id: 'vampire-secondary-color',
          settingName: Loom.i18n.format('WOD5E.Settings.StringSecondaryColor', {
            string: Loom.i18n.localize('TYPES.Actor.vampire')
          }),
          settingId: 'vampireSecondaryColor',
          cssVariable: '--vampire-color-2',
          defaultColor: '#d84343'
        },
        vampireTertiaryColor: {
          id: 'vampire-tertiary-color',
          settingName: Loom.i18n.format('WOD5E.Settings.StringTertiaryColor', {
            string: Loom.i18n.localize('TYPES.Actor.vampire')
          }),
          settingId: 'vampireTertiaryColor',
          cssVariable: '--vampire-color-3',
          defaultColor: '#f51f1f'
        }
      }
    },
    hunter: {
      label: Loom.i18n.format('WOD5E.Settings.StringStyling', {
        string: Loom.i18n.localize('TYPES.Actor.hunter')
      }),
      settings: {
        hunterBaseColor: {
          id: 'hunter-base-color',
          settingName: Loom.i18n.format('WOD5E.Settings.StringBaseColor', {
            string: Loom.i18n.localize('TYPES.Actor.hunter')
          }),
          settingId: 'hunterBaseColor',
          cssVariable: '--hunter-theme-filter',
          defaultColor: '#D18125'
        },
        hunterPrimaryColor: {
          id: 'hunter-primary-color',
          settingName: Loom.i18n.format('WOD5E.Settings.StringPrimaryColor', {
            string: Loom.i18n.localize('TYPES.Actor.hunter')
          }),
          settingId: 'hunterPrimaryColor',
          cssVariable: '--hunter-color-1',
          defaultColor: '#cc6d28'
        },
        hunterSecondaryColor: {
          id: 'hunter-secondary-color',
          settingName: Loom.i18n.format('WOD5E.Settings.StringSecondaryColor', {
            string: Loom.i18n.localize('TYPES.Actor.hunter')
          }),
          settingId: 'hunterSecondaryColor',
          cssVariable: '--hunter-color-2',
          defaultColor: '#ffb762'
        },
        hunterTertiaryColor: {
          id: 'hunter-tertiary-color',
          settingName: Loom.i18n.format('WOD5E.Settings.StringTertiaryColor', {
            string: Loom.i18n.localize('TYPES.Actor.hunter')
          }),
          settingId: 'hunterTertiaryColor',
          cssVariable: '--hunter-color-3',
          defaultColor: '#ff8f00'
        }
      }
    },
    werewolf: {
      label: Loom.i18n.format('WOD5E.Settings.StringStyling', {
        string: Loom.i18n.localize('TYPES.Actor.werewolf')
      }),
      settings: {
        werewolfBaseColor: {
          id: 'werewolf-base-color',
          settingName: Loom.i18n.format('WOD5E.Settings.StringBaseColor', {
            string: Loom.i18n.localize('TYPES.Actor.werewolf')
          }),
          settingId: 'werewolfBaseColor',
          cssVariable: '--werewolf-theme-filter',
          defaultColor: '#BE660080'
        },
        werewolfPrimaryColor: {
          id: 'werewolf-primary-color',
          settingName: Loom.i18n.format('WOD5E.Settings.StringPrimaryColor', {
            string: Loom.i18n.localize('TYPES.Actor.werewolf')
          }),
          settingId: 'werewolfPrimaryColor',
          cssVariable: '--werewolf-color-1',
          defaultColor: '#4e2100'
        },
        werewolfSecondaryColor: {
          id: 'werewolf-secondary-color',
          settingName: Loom.i18n.format('WOD5E.Settings.StringSecondaryColor', {
            string: Loom.i18n.localize('TYPES.Actor.werewolf')
          }),
          settingId: 'werewolfSecondaryColor',
          cssVariable: '--werewolf-color-2',
          defaultColor: '#994101'
        },
        werewolfTertiaryColor: {
          id: 'werewolf-tertiary-color',
          settingName: Loom.i18n.format('WOD5E.Settings.StringTertiaryColor', {
            string: Loom.i18n.localize('TYPES.Actor.werewolf')
          }),
          settingId: 'werewolfTertiaryColor',
          cssVariable: '--werewolf-color-3',
          defaultColor: '#e97244'
        }
      }
    }
  }

  return record
}

export const _updateCSSVariable = async (settingName, cssVariableName, newColor) => {
  let validColor = true
  // If no value is being provided for cssVariableName or settingName, we do nothing
  if (!cssVariableName || !settingName) return

  // If this isn't a valid hexcode, show the error message
  if (!validateColor(newColor)) {
    Loom.ui?.notifications.error(
      `Invalid hexcode or color name "${newColor}" given for setting ID wod5e.${settingName}`
    )
    validColor = true
  }

  // If no color is provided or the color is invalid, reset to the default color
  if (!newColor || !validColor) {
    const defaultColor = Loom.settings.settings.get(`wod5e.${settingName}`).default
    document.documentElement.style.setProperty(cssVariableName, defaultColor)
    Loom.settings.set('wod5e', settingName, defaultColor)
  } else {
    // Update the variable with the new color
    document.documentElement.style.setProperty(cssVariableName, newColor)

    // Only update the setting if we need to; this is mainly for the initial load, so we're
    // not unnecessarily re-setting a variable without changes
    if (newColor !== Loom.settings.get('wod5e', settingName)) {
      Loom.settings.set('wod5e', settingName, newColor)
    }
  }
}

// Quick way to validate a hexcode
function validateColor(hexcode) {
  // A list of every valid CSS color name to check through
  const cssColorNames = [
    'aliceblue',
    'antiquewhite',
    'aqua',
    'aquamarine',
    'azure',
    'beige',
    'bisque',
    'black',
    'blanchedalmond',
    'blue',
    'blueviolet',
    'brown',
    'burlywood',
    'cadetblue',
    'chartreuse',
    'chocolate',
    'coral',
    'cornflowerblue',
    'cornsilk',
    'crimson',
    'cyan',
    'darkblue',
    'darkcyan',
    'darkgoldenrod',
    'darkgray',
    'darkgreen',
    'darkgrey',
    'darkkhaki',
    'darkmagenta',
    'darkolivegreen',
    'darkorange',
    'darkorchid',
    'darkred',
    'darksalmon',
    'darkseagreen',
    'darkslateblue',
    'darkslategray',
    'darkslategrey',
    'darkturquoise',
    'darkviolet',
    'deeppink',
    'deepskyblue',
    'dimgray',
    'dimgrey',
    'dodgerblue',
    'firebrick',
    'floralwhite',
    'forestgreen',
    'fuchsia',
    'gainsboro',
    'ghostwhite',
    'gold',
    'goldenrod',
    'gray',
    'green',
    'greenyellow',
    'grey',
    'honeydew',
    'hotpink',
    'indianred',
    'indigo',
    'ivory',
    'khaki',
    'lavender',
    'lavenderblush',
    'lawngreen',
    'lemonchiffon',
    'lightblue',
    'lightcoral',
    'lightcyan',
    'lightgoldenrodyellow',
    'lightgray',
    'lightgreen',
    'lightgrey',
    'lightpink',
    'lightsalmon',
    'lightseagreen',
    'lightskyblue',
    'lightslategray',
    'lightslategrey',
    'lightsteelblue',
    'lightyellow',
    'lime',
    'limegreen',
    'linen',
    'magenta',
    'maroon',
    'mediumaquamarine',
    'mediumblue',
    'mediumorchid',
    'mediumpurple',
    'mediumseagreen',
    'mediumslateblue',
    'mediumspringgreen',
    'mediumturquoise',
    'mediumvioletred',
    'midnightblue',
    'mintcream',
    'mistyrose',
    'moccasin',
    'navajowhite',
    'navy',
    'oldlace',
    'olive',
    'olivedrab',
    'orange',
    'orangered',
    'orchid',
    'palegoldenrod',
    'palegreen',
    'paleturquoise',
    'palevioletred',
    'papayawhip',
    'peachpuff',
    'peru',
    'pink',
    'plum',
    'powderblue',
    'purple',
    'rebeccapurple',
    'red',
    'rosybrown',
    'royalblue',
    'saddlebrown',
    'salmon',
    'sandybrown',
    'seagreen',
    'seashell',
    'sienna',
    'silver',
    'skyblue',
    'slateblue',
    'slategray',
    'slategrey',
    'snow',
    'springgreen',
    'steelblue',
    'tan',
    'teal',
    'thistle',
    'tomato',
    'turquoise',
    'violet',
    'wheat',
    'white',
    'whitesmoke',
    'yellow',
    'yellowgreen'
  ]

  if (!hexcode || typeof hexcode !== 'string') return false

  const isHex = /^#?([0-9A-F]{3}|[0-9A-F]{4}|[0-9A-F]{6}|[0-9A-F]{8})$/i.test(hexcode)
  const isColorName = cssColorNames.includes(hexcode.toLowerCase())

  return isHex || isColorName
}
