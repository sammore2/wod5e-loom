export class AutomationMenu extends Loom.BaseWindow {
  static get defaultOptions() {
    return Loom.utils.mergeObject(super.defaultOptions, {
      title: Loom.i18n.localize('WOD5E.Settings.AutomationSettings'),
      id: 'wod5e-automation',
      classes: ['wod5e'],
      template: 'marketplace/rulesets/wod5e/display/ui/automation-menu.hbs',
      width: 500,
      height: 'auto',
      resizable: true,
      closeOnSubmit: false
    })
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    const data = await super.getData()

    // Encrich editor content
    data.disableAutomation = Loom.settings.get('wod5e', 'disableAutomation')
    data.automatedWillpower = Loom.settings.get('wod5e', 'automatedWillpower')
    data.automatedHunger = Loom.settings.get('wod5e', 'automatedHunger')
    data.automatedOblivion = Loom.settings.get('wod5e', 'automatedOblivion')
    data.automatedRage = Loom.settings.get('wod5e', 'automatedRage')

    return data
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    html[0].querySelectorAll('input').forEach((input) => {
      input.addEventListener('change', function (event) {
        event.preventDefault()
        const data = event.target.dataset

        if (data?.id) {
          const settingId = data.id
          const value = event.target.checked

          Loom.settings.set('wod5e', settingId, value)
        }
      })
    })
  }
}
