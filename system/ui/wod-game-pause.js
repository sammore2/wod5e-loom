export class WoDPause extends Loom.applications.ui.GamePause {
  async _onRender(context, options) {
    await super._onRender(context, options)

    const html = this.element
    if (!html) return

    html.classList.add('wod-game-pause')

    const updatedPauseImage = `
        <img class="fa-spin pause-border" src="marketplace/rulesets/wod5e/assets/ui/Pause_Border.webp" alt="Pause Border">
        <img class="pause-overlay" src="marketplace/rulesets/wod5e/assets/ui/Pause_Overlay.webp" alt="Pause Overlay">
        <figcaption>${Loom.i18n.localize('WOD5E.GamePaused')}</figcaption>
    `

    html.innerHTML = updatedPauseImage
  }
}
