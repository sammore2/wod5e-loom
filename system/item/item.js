const BaseItemClass = globalThis.Item || window.CONFIG?.Item?.documentClass || Loom?.LoomItem || class {}

/**
 * Extend the base Item document and put all our base functionality here
 * @extends {BaseItemClass}
 */
export class WoDItem extends BaseItemClass {
  // Sem isto, `this.constructor.name` ("WoDItem") vira o `documentName` usado pra montar a
  // rota da API e o nome do campo de sistema em `ClientDocument.update()` — quebra tanto o
  // endpoint (`/woditems` em vez de `/items`) quanto a expansão de `system.*` pra `data`.
  static documentName = 'Item'

  prepareData() {
    super.prepareData()
  }

  // Stage methods must exist on this class itself: when Loom borrows this
  // prototype onto a raw API row, `this.<stage>()` resolves through the row's
  // own prototype chain and would otherwise throw.
  prepareBaseData() {
    super.prepareBaseData()
  }

  prepareEmbeddedDocuments() {
    super.prepareEmbeddedDocuments()
  }

  async prepareDerivedData() {}
}

// Handle setting default item data
Loom.LoomHooks.on('preCreateItem', (document, data) => {
  const alterations = {}

  // Get default item image based on the item type
  if (!data.img || data.img === 'icons/svg/item-bag.svg') {
    const itemsList = WOD5E.ItemTypes.getList({})
    const itemImg = itemsList[data.type]?.img || 'marketplace/rulesets/wod5e/assets/icons/items/item-default.svg'

    // Set the img value to the icon we get back
    alterations.img = itemImg
  }

  // Update the source document
  document.updateSource(alterations)
})
