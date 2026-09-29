export const getItems = async function ({ types = [], text = '', disabledSources = {} }) {
  let allReturnedItems = []

  /**
   * Handle getting items from compendiums MATERIALIZADOS NO MUNDO (`Loom.packs`).
   * Isto é normalmente uma lista vazia — o conteúdo de verdade dos rulesets/addons
   * (disciplinas, clãs, tipos de predador etc) nunca é "importado" pro mundo, fica
   * disponível direto como "compendium source" (ver bloco abaixo). Mantido pra quando
   * o GM materializa um pack manualmente, mas não é o caminho comum.
   */
  const compendiumsItemsList = Loom.packs.filter(
    (compendium) => compendium.type === 'Item'
  )
  for (const compendium of compendiumsItemsList) {
    if (disabledSources.includes(compendium.id))
      continue

    const pack = await Loom.api.get(`/compendium/${compendium.id}`)
    const docs = pack?.entries ?? []
    const compendiumItems = await filterDocuments(docs, types, text)

    // Marca de onde cada item veio — sem isto, abrir a ficha (on-open-item.js) não tem
    // como saber se deve resolver como item de mundo (Loom.items) ou entrada de
    // compêndio (que precisa do pack pra montar a rota /compendium/:id/entries/:id,
    // já que Loom.fromUuidSync nunca resolve Compendium.* — só WorldCollection).
    for (const item of compendiumItems) {
      item.uuid = item.uuid ?? `Compendium.${compendium.id}.${item.id}`
      item._sourcePack = { id: compendium.id, type: compendium.type, worldId: compendium.worldId }
    }

    // If there's any items we need from here, push them to our 'all returned items' list
    if (compendiumItems.length > 0) {
      allReturnedItems.push(...compendiumItems)
    }
  }

  /**
   * Handle getting items from COMPENDIUM SOURCES — o conteúdo de verdade de
   * rulesets/addons (ex: "Tipos de Predador" do vampire-v5-ptbr), nunca materializado
   * como pack de mundo. Sem isto, o navegador de compêndio só via `Loom.packs`
   * (normalmente vazio) e nunca achava nada — confirmado ao vivo: `Loom.packs` tinha
   * 0 entradas, enquanto `/api/compendium/sources` tinha 9, incluindo os "Tipos de
   * Predador" que o filtro procurava.
   */
  const sourcesRes = await Loom.api.get('/compendium/sources')
  const itemSources = (sourcesRes ?? []).filter((source) => source.type === 'Item')
  for (const source of itemSources) {
    if (disabledSources.includes(source.sourceId))
      continue

    // Rota de LISTAGEM (`/entries`) é diferente da rota que a FICHA usa pra ler/gravar
    // uma entrada específica (`/entries-sheet/:id`, ver `compendium.ts` no core — comentário
    // lá explica: GET/PUT não podem cair na mesma rota que a listagem usa). Confundir as
    // duas faz a ficha abrir vazia/errada mesmo com o item certo selecionado.
    const listRoute = `/compendium/sources/${encodeURIComponent(source.sourceId)}/entries`
    const sheetApiRoute = `/compendium/sources/${encodeURIComponent(source.sourceId)}/entries-sheet`
    const sourcePack = await Loom.api.get(listRoute)
    const docs = sourcePack?.entries ?? []
    const sourceItems = await filterDocuments(docs, types, text)

    for (const item of sourceItems) {
      // Mesmo formato de uuid usado em `compendium-source-window.ts` (drag&drop de
      // source pack) — não é só estética, mantém compatibilidade com qualquer código
      // que já espere esse formato pra uma entrada de compendium source.
      item.uuid = item.uuid ?? `Compendium.${source.sourceId}.${item.id}`
      item._sourcePack = { id: source.sourceId, type: source.type, worldId: Loom.world?.id, apiRoute: sheetApiRoute }
    }

    if (sourceItems.length > 0) {
      allReturnedItems.push(...sourceItems)
    }
  }

  /**
   * Handle getting items from the world itself (not in any compendiums)
   * We don't need to be as verbose as we were with the ones inside compendiums
   *
   * Also includes a filter - if 'world' is disabled in sources, we don't need
   * to look up any world items.
   */
  if (!disabledSources.includes('world')) {
    const worldItemsList = await filterDocuments(Loom.items, types, text)
    allReturnedItems.push(...worldItemsList)
  }

  return allReturnedItems
}

export const filterDocuments = function (documents, types = [], text = '') {
  // Normalize the text provided
  const normalizedText = text.toLowerCase().trim()
  // Map types to something sane to use
  const typeMap = new Map(types.map((type) => [type.id, type]))

  return documents.filter((item) => {
    // Determine which type filter we need to pull from the map
    const typeFilter = typeMap.get(item.type)

    // If type filters exist and this item type is not enabled, exclude it
    if (types.length > 0 && !typeFilter) return false

    // Text filter
    if (normalizedText && !item.name.toLowerCase().includes(normalizedText)) {
      return false
    }

    // Permission filter (must have at least "limited" permissions)
    if (item.permission <= 0) return false

    // If we don't have a type filter, then we don't need subtype filtering and
    // just return the item
    if (!typeFilter) return true

    // If we don't have any subtype filters, just return the item
    if (!typeFilter.subtypes?.length) return true

    // If subtype filters exist but this type has no subtype path, return the item
    if (!typeFilter.subtypePath) return true

    // Grab the subtype value
    const itemSubtype = Loom.utils.getProperty(item.system, typeFilter.subtypePath)

    // Match the subtype against the subtype list
    return typeFilter.subtypes.includes(itemSubtype)
  })
}
