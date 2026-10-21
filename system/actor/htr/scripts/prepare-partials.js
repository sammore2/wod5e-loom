import { prepareEdgePowers } from './prepare-data.js'
import { getActorItems } from '../../../scripts/embedded-items.js'

export const prepareEdgesContext = async function (context, actor) {
  const actorData = actor?.systemData || actor?.system || {}
  const selectedEdgeKey = actor?.systemData?.selectedEdge ?? actor?.system?.selectedEdge
  const selectedPerkId = actor?.systemData?.selectedEdgePerk ?? actor?.system?.selectedEdgePerk

  // Tab data
  context.tab = context.tabs.edges

  // Part-specific data
  const derived = actor.derivedData || {}
  const edges = derived.edges || actorData.edges
  context.edges = await prepareEdgePowers(edges)

  // Get edge data if any edge is currently selected
  if (selectedEdgeKey) {
    context.selectedEdge = edges[selectedEdgeKey]
    context.enrichedSelectedEdgeDescription =
      await Loom.applications.ux.TextEditor.implementation.enrichHTML(
        context.selectedEdge?.description || ''
      )
  }

  // Ensure selection state is synchronized across the edges list and perks
  if (context.edges) {
    for (const [key, edge] of Object.entries(context.edges)) {
      edge.selected = (selectedEdgeKey === key)
      if (Array.isArray(edge.perks)) {
        for (const perk of edge.perks) {
          if (!perk.system) perk.system = {}
          perk.system.selected = Boolean(selectedPerkId && perk.id === selectedPerkId)
        }
      }
    }
  }

  // Get power data if any power is currently selected
  if (selectedPerkId) {
    // `getActorItems()` em vez de `actor.items` — mesma causa já corrigida em
    // vtm/scripts/prepare-partials.js: itens crus não têm `.system`, e a descrição/ícone
    // de rolar dados do perk sumiam calado.
    context.selectedEdgePerk = getActorItems(actor).find((item) => item.id === selectedPerkId)

    if (context.selectedEdgePerk?.system?.description) {
      context.selectedEdgePerkDescription =
        await Loom.applications.ux.TextEditor.implementation.enrichHTML(
          context.selectedEdgePerk.system.description
        )
    }
  }

  return context
}
