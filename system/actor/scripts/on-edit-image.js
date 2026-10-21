export const _onEditImage = async function (event) {
  event.preventDefault()

  // Top-level variables
  const actor = this.actor

  // Preferred: the layered portrait and token editor (picking a plain file is one of its options).
  // Older Loom builds do not have it, so they keep the direct file picker below.
  if (typeof Loom.openPortraitEditor === 'function' && actor?.id) {
    Loom.openPortraitEditor(actor)
    return
  }

  if (Loom.windowManager?.open && Loom.windows?.FilePickerWindow) {
    Loom.windowManager.open('file-picker', Loom.windows.FilePickerWindow, {
      onSelect: async (path) => {
        // The actor portrait field is `avatarUrl` in LoomVTT
        await actor.update({
          avatarUrl: path
        })
      }
    })
  } else {
    console.error('FilePickerWindow not found in Loom.windows')
  }
}
