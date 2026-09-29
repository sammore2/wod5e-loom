import { prepareEdgePowers } from './prepare-data.js'
import { getActorItems } from '../../../scripts/embedded-items.js'

export const prepareEdgesContext = async function (context, actor) {
  const actorData = actor.system

  // Tab data
  context.tab = context.tabs.edges

  // Part-specific data
  const derived = actor.derivedData || {}
  const edges = derived.edges || actorData.edges
  context.edges = await prepareEdgePowers(edges)

  // Get discipline data if any discipline is currently selected
  if (actorData?.selectedEdge) {
    context.selectedEdge = edges[actorData.selectedEdge]
    context.enrichedSelectedEdgeDescription =
      await Loom.applications.ux.TextEditor.implementation.enrichHTML(
        context.selectedEdge?.description || ''
      )
  }

  // Get power data if any power is currently selected
  if (actorData?.selectedEdgePerk) {
    // `getActorItems()` em vez de `actor.items` — mesma causa já corrigida em
    // vtm/scripts/prepare-partials.js: itens crus não têm `.system`, e a descrição/ícone
    // de rolar dados do perk sumiam calado.
    context.selectedEdgePerk = getActorItems(actor).find((item) => item.id === actorData.selectedEdgePerk)

    if (context.selectedEdgePerk?.system?.description) {
      context.selectedEdgePerkDescription =
        await Loom.applications.ux.TextEditor.implementation.enrichHTML(
          context.selectedEdgePerk.system.description
        )
    }
  }

  return context
}
