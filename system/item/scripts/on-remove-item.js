import { deleteItem } from '../../scripts/embedded-items.js'

export const _onRemoveItem = async function (event) {
  event.preventDefault()

  const item = this.item

  // Define the content of the Dialog
  const content = `<p>
    ${Loom.i18n.format('WOD5E.ConfirmDeleteDescription', {
      string: item.name
    })}
  </p>`

  // Prompt a dialog for the user to confirm they want to delete the item
  const confirmDelete = await Loom.LoomDialog.wait({
    window: {
      title: Loom.i18n.localize('WOD5E.ConfirmDelete')
    },
    classes: ['wod5e', 'dialog'],
    content,
    modal: true,
    buttons: [
      {
        label: Loom.i18n.localize('WOD5E.Confirm'),
        action: true
      },
      {
        label: Loom.i18n.localize('WOD5E.Cancel'),
        action: false
      }
    ]
  })

  if (confirmDelete) {
    await deleteItem(item.id)
  }
}
