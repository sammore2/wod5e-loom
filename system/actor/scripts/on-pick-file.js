import { applySystemPatch } from './counters.js'

/**
 * Handle opening the Loom FilePicker for actor background and header settings
 * @param {Event} event
 * @param {HTMLElement} target
 */
export const _onPickFile = async function (event, target) {
  event.preventDefault()
  const btn = target || event.currentTarget
  const dataPath = btn.dataset.target
  if (!dataPath) return

  const actor = this.actor
  const currentVal = Loom.utils.getProperty(actor.systemData || actor.system, dataPath) || ''

  const onSelectPath = async (path) => {
    if (!path) return
    const pathParts = dataPath.split('.')
    const systemData = applySystemPatch(actor.systemData || {}, [[pathParts, path]])
    actor.systemData = systemData
    if (typeof this._scheduleActorSave === 'function') {
      this._scheduleActorSave()
    } else {
      await actor.update({ systemData })
    }
    this.render(false)
  }

  if (Loom.windowManager?.open && Loom.windows?.FilePickerWindow) {
    Loom.windowManager.open(`file-picker-${Date.now()}`, Loom.windows.FilePickerWindow, {
      currentDir: currentVal ? currentVal.substring(0, currentVal.lastIndexOf('/')) : undefined,
      onSelect: onSelectPath
    })
  } else if (Loom.applications?.FilePicker?.implementation) {
    const fp = new Loom.applications.FilePicker.implementation({
      type: 'image',
      current: currentVal,
      callback: onSelectPath
    })
    await fp.browse()
  }
}
