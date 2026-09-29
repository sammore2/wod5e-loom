export const _onEditImage = async function (event) {
  event.preventDefault()

  // Top-level variables
  const item = this.item
  if (Loom.windowManager?.open && Loom.windows?.FilePickerWindow) {
    Loom.windowManager.open('file-picker', Loom.windows.FilePickerWindow, {
      onSelect: async (path) => {
        // Loom chama esse campo `imgUrl` (não `img`, convenção do sistema original) — mandar `img`
        // fazia a rota de PUT não reconhecer nenhum campo válido e devolver 400.
        await item.update({
          imgUrl: path
        })
      }
    })
  } else {
    console.error('FilePickerWindow not found in Loom.windows')
  }
}
