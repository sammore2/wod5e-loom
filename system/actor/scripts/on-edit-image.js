export const _onEditImage = async function (event) {
  event.preventDefault()

  // Top-level variables
  const actor = this.actor
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
