import { generateLocalizedLabel } from '../api/generate-localization.js'
import { timeSinceShort } from './time-since-short.js'

/**
 * Define any helpers necessary for working with Handlebars
 * @return {Promise}
 */
export const loadHelpers = async function () {
  // Allow templates to read prototype-backed properties (e.g. `system`
  // getters on live documents) without Handlebars denying access
  if (!Handlebars.__wod5eProtoPatched) {
    Handlebars.__wod5eProtoPatched = true
    const originalCompile = Handlebars.compile.bind(Handlebars)
    Handlebars.compile = function (source, options) {
      const template = originalCompile(source, options)
      return function (context, runtimeOptions) {
        return template(context, {
          ...runtimeOptions,
          allowProtoPropertiesByDefault: true,
          allowProtoMethodsByDefault: true
        })
      }
    }
  }

  // Helper to define skills lists
  Handlebars.registerHelper('concat', function () {
    let outStr = ''
    for (const arg in arguments) {
      if (typeof arguments[arg] !== 'object') {
        outStr += arguments[arg]
      }
    }
    return outStr
  })

  Handlebars.registerHelper('ifeq', function (a, b, options) {
    if (a === b) {
      return options.fn(this)
    }

    return options.inverse(this)
  })

  Handlebars.registerHelper('ifnoteq', function (a, b, options) {
    if (a !== b) {
      return options.fn(this)
    }

    return options.inverse(this)
  })

  Handlebars.registerHelper('ifgr', function (a, b, options) {
    if (a > b) {
      return options.fn(this)
    }

    return options.inverse(this)
  })

  Handlebars.registerHelper('ifless', function (a, b, options) {
    if (a < b) {
      return options.fn(this)
    }

    return options.inverse(this)
  })

  Handlebars.registerHelper('or', function () {
    for (let i = 0; i < arguments.length - 1; i++) {
      if (arguments[i]) {
        return true
      }
    }

    return false
  })

  Handlebars.registerHelper('and', function (bool1, bool2) {
    return bool1 && bool2
  })

  Handlebars.registerHelper('x2', function (int) {
    return Number(int) * 2
  })

  // Render a <select> options list. Choices can be an object or array whose
  // values are either strings or objects with a label/displayName/name field.
  Handlebars.registerHelper('selectOptions', function (choices, options) {
    const hash = options?.hash ?? {}
    const selected = hash.selected
    // Localizes by default, matching the legacy select-options behavior
    const shouldLocalize = hash.localize !== false
    const localizeStr = (str) =>
      shouldLocalize && Loom?.i18n && typeof str === 'string' && str.startsWith('WOD5E.')
        ? Loom.i18n.localize(str)
        : str

    let entries
    if (Array.isArray(choices)) {
      entries = choices.map((choice, index) => [
        String(choice?.value ?? choice?.key ?? index),
        typeof choice === 'object' ? choice.label ?? choice.displayName ?? choice.name ?? '' : String(choice)
      ])
    } else {
      entries = Object.entries(choices ?? {}).map(([key, value]) => [
        String(value?.value ?? key),
        typeof value === 'object' ? value.label ?? value.displayName ?? value.name ?? key : String(value)
      ])
    }

    let html = ''
    for (const [key, label] of entries) {
      const isSelected = Array.isArray(selected)
        ? selected.map(String).includes(key)
        : selected !== undefined && String(selected) === key
      html += `<option value="${key}"${isSelected ? ' selected' : ''}>${localizeStr(label)}</option>`
    }
    return new Handlebars.SafeString(html)
  })


  Handlebars.registerHelper('toLowerCase', function (str) {
    return str.toLowerCase()
  })

  Handlebars.registerHelper('toUpperCaseFirstLetter', function (str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
  })

  Handlebars.registerHelper('splitArray', function (arr) {
    if (!Array.isArray(arr)) {
      return ''
    }

    return arr.join(',')
  })

  // Helper to define attributes lists
  Handlebars.registerHelper('getAttributesList', function () {
    return WOD5E.Attributes.getList({})
  })

  // Helper to define skills lists
  Handlebars.registerHelper('getSkillsList', function () {
    return WOD5E.Skills.getList({})
  })

  // Helper to define disciplines lists
  Handlebars.registerHelper('getDisciplinesList', function () {
    return WOD5E.Disciplines.getList({})
  })

  // Check whether an object is empty or not
  Handlebars.registerHelper('isNotEmpty', function (obj) {
    return !!obj && Object.keys(obj).length > 0
  })

  Handlebars.registerHelper('generateLocalizedLabel', function (string, type) {
    return generateLocalizedLabel(string, type)
  })

  Handlebars.registerHelper('attrIf', function (attr, value, test) {
    if (value === undefined) return ''
    return value === test ? attr : ''
  })

  Handlebars.registerHelper('sortAbilities', function (unordered = {}) {
    if (!Loom.settings.get('wod5e', 'chatRollerSortAbilities')) {
      return unordered
    }
    return Object.keys(unordered)
      .sort()
      .reduce((obj, key) => {
        obj[key] = unordered[key]
        return obj
      }, {})
  })

  Handlebars.registerHelper('numLoop', function (num, options) {
    let ret = ''

    for (let i = 0, j = num; i < j; i++) {
      ret = ret + options.fn(i)
    }

    return ret
  })

  // A separate helper from the native 'timeSince' helper
  // specifically to limit the terms to only 1
  Handlebars.registerHelper('timeSinceShort', function (timeStamp) {
    return timeSinceShort(timeStamp)
  })
}
