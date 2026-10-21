export const _onOpenItem = function (event, target) {
  const itemUuid = target.getAttribute('data-uuid')

  // `.sheet` não existe em documento nenhum do Loom (convenção do sistema original, nunca
  // implementada aqui) — e pra entradas de compêndio, `Loom.fromUuidSync` nunca resolve
  // (só olha WorldCollections em memória, documentado nele mesmo). Acha o item de volta
  // na última lista carregada (guardada em `this._lastItemsInList`) pra saber se é item
  // de mundo ou de compêndio, e abre pelo caminho certo em cada caso.
  const item = this._lastItemsInList?.find((i) => i.uuid === itemUuid)
  if (!item) {
    console.warn(`World of Darkness 5e | Item não encontrado na lista pra abrir: ${itemUuid}`)
    return
  }

  if (item._sourcePack) {
    Loom.openCompendiumEntrySheet(item._sourcePack, { id: item.id, type: item.type })
    return
  }

  // Item de mundo — mesmo caminho de `actor/scripts/item-actions.js:_onItemOpen`.
  const SheetClass = Loom.sheets.get('item', item.type) || Loom.sheets.get('item')
  if (!SheetClass) {
    console.warn(`World of Darkness 5e | Nenhuma ficha registrada pro tipo de item "${item.type}".`)
    return
  }
  Loom.windowManager.open(`item-sheet-${item.id}`, SheetClass, { itemId: item.id })
}
