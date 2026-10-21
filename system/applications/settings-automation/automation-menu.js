const { BaseWindow, LoomHandlebarsMixin } = Loom

export class AutomationMenu extends LoomHandlebarsMixin(BaseWindow) {
  static DEFAULT_OPTIONS = {
    id: 'wod5e-automation',
    classes: ['wod5e', 'dialog-app', 'sheet', 'application'],
    window: {
      title: 'WOD5E.Settings.AutomationSettings',
      resizable: true
    },
    position: {
      width: 500,
      height: 'auto'
    }
  }

  static PARTS = {
    form: {
      template: 'marketplace/rulesets/wod5e/display/ui/automation-menu.hbs'
    }
  }

  get title() {
    return Loom.i18n.localize(this.options?.window?.title || 'WOD5E.Settings.AutomationSettings')
  }

  /** @override */
  async _prepareContext(options) {
    const data = (await super._prepareContext?.(options)) ?? {}

    data.disableAutomation = Loom.settings.get('wod5e', 'disableAutomation')
    data.automatedWillpower = Loom.settings.get('wod5e', 'automatedWillpower')
    data.automatedHunger = Loom.settings.get('wod5e', 'automatedHunger')
    data.automatedOblivion = Loom.settings.get('wod5e', 'automatedOblivion')
    data.automatedRage = Loom.settings.get('wod5e', 'automatedRage')

    return data
  }

  /** @override */
  async _onRender(context, options) {
    if (typeof super._onRender === 'function') await super._onRender(context, options)

    const root = this.element
    if (!root) return

    root.querySelectorAll('input').forEach((input) => {
      input.addEventListener('change', async (event) => {
        event.preventDefault()
        const data = event.target.dataset

        if (data?.id) {
          const settingId = data.id
          const value = event.target.checked

          await Loom.settings.set('wod5e', settingId, value)
          if (settingId === 'disableAutomation') {
            this.render(false)
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
