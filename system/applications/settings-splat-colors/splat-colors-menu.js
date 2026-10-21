import { _updateCSSVariable, cssVariablesRecord } from '../../scripts/update-css-variables.js'
const { BaseWindow, LoomHandlebarsMixin } = Loom

export class SplatColorsMenu extends LoomHandlebarsMixin(BaseWindow) {
  static DEFAULT_OPTIONS = {
    id: 'wod5e-splat-colors',
    classes: ['wod5e', 'dialog-app', 'sheet', 'application'],
    window: {
      title: 'WOD5E.Settings.SplatColorsMenu',
      resizable: true
    },
    position: {
      width: 500,
      height: 450
    }
  }

  static PARTS = {
    form: {
      template: 'marketplace/rulesets/wod5e/display/ui/splat-colors-menu.hbs'
    }
  }

  get title() {
    return Loom.i18n.localize(this.options?.window?.title || 'WOD5E.Settings.SplatColorsMenu')
  }

  /** @override */
  async _prepareContext(options) {
    const data = (await super._prepareContext?.(options)) ?? {}
    const cssVariables = cssVariablesRecord()

    data.cssVariablesRecord = cssVariables

    // Go through the available themes
    Object.keys(cssVariables).forEach((theme) => {
      const settings = cssVariables[theme].settings

      // Iterate over each setting in the theme
      Object.keys(settings).forEach((settingKey) => {
        const { settingId } = settings[settingKey]

        // Get the setting and assign it, making it available within the menu
        data[settingId] = Loom.settings.get('wod5e', settingId)
      })
    })

    return data
  }

  /** @override */
  async _onRender(context, options) {
    if (typeof super._onRender === 'function') await super._onRender(context, options)

    const root = this.element
    if (!root) return

    // Initialize the JSColor library if available
    if (typeof JSColor !== 'undefined' && typeof JSColor.install === 'function') {
      JSColor.install()
    } else if (typeof jscolor !== 'undefined' && typeof jscolor.install === 'function') {
      jscolor.install(root)
    }

    // On input change, update colours
    root.querySelectorAll('.color-input').forEach((input) => {
      input.addEventListener('change', function (event) {
        event.preventDefault()

        const setting = event.target.dataset.settingId
        const cssVariable = event.target.dataset.cssVariable
        const value = event.target.value

        _updateCSSVariable(setting, cssVariable, value)
      })
    })

    root.querySelectorAll('.reset-color').forEach((resetBtn) => {
      resetBtn.addEventListener('click', async (event) => {
        event.preventDefault()

        const inputId = event.currentTarget.dataset.inputId
        const settingId = event.currentTarget.dataset.settingId
        const cssVariable = event.currentTarget.dataset.cssVariable

        if (inputId && settingId) {
          const inputElement = root.querySelector(`#${inputId}`) || document.querySelector(`#${inputId}`)
          const defaultColor = Loom.settings.settings.get(`wod5e.${settingId}`)?.default

          if (inputElement?.jscolor && defaultColor) {
            inputElement.jscolor.fromString(defaultColor)
          }
          if (defaultColor) {
            _updateCSSVariable(settingId, cssVariable, defaultColor)
          }
        }
      })
    })
  }

  // Compatibilidade com chamadas legadas
  async getData() {
    return this._prepareContext({})
  }
}
