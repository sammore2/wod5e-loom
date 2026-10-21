import { updateItemData, getActorItems } from '../../../scripts/embedded-items.js'
import { applySystemPatch } from '../../scripts/counters.js'
import { Edges } from '../../../api/def/edges.js'
/** Handle adding a new edge to the sheet */
export const _onAddEdge = async function (event) {
  event.preventDefault()

  // Top-level variables
  const actor = this.actor

  // Secondary variables
  const edgeList = WOD5E.Edges.getList({})
  // `StringField.choices` espera string por chave — `getList()` devolve um
  // objeto ({label, displayName, ...}) por chave, igual `disciplines.js` do
  // vampiro já tratava. Sem isto, o dropdown mostrava "[object Object]".
  const edgeChoices = Object.fromEntries(
    Object.entries(edgeList).map(([key, val]) => [key, val.displayName || val.label || key])
  )

  // Build the options for the select dropdown
  const content = new Loom.fields_v14.StringField({
    choices: edgeChoices,
    label: Loom.i18n.localize('WOD5E.HTR.SelectEdge'),
    required: true
  }).toFormGroup(
    {},
    {
      name: 'edge'
    }
  ).outerHTML

  // Prompt a dialog to determine which edge we're adding
  const edgeSelected = await Loom.LoomDialog.prompt({
    window: {
      title: Loom.i18n.localize('WOD5E.HTR.AddEdge')
    },
    classes: ['wod5e', 'dialog', 'hunter', 'dialog'],
    content,
    ok: {
      callback: (event, button, dialog) =>
        new Loom.LoomFormData(dialog.getBody()).object.edge
    },
    modal: true
  })

  if (edgeSelected) {
    // Um único `actor.update()` juntando visibilidade + seleção — do contrário
    // 3 updates separados em sequência disparam a guarda de loop do core
    // (mutation-loop-guard) e cada um sobrescreve `system` sem levar o anterior
    // em conta, fazendo o edge "aparecer e sumir" da ficha.
    const systemData = applySystemPatch(actor.systemData, [
      [['edges', edgeSelected, 'visible'], true],
      [['edges', edgeSelected, 'selected'], true],
      [['selectedEdge'], edgeSelected],
      [['selectedEdgePerk'], '']
    ])

    const previouslySelectedEdge = actor.system?.selectedEdge
    if (previouslySelectedEdge && previouslySelectedEdge !== edgeSelected) {
      systemData.edges[previouslySelectedEdge] ??= {}
      systemData.edges[previouslySelectedEdge].selected = false
    }

    await actor.update({ systemData })
  }
}

/** Handle removing an Edge from an actor */
export const _onRemoveEdge = async function (event, target) {
  event.preventDefault()

  // Top-level variables
  const actor = this.actor
  const edge = target.getAttribute('data-edge')

  actor.update({
    [`system.edges.${edge}.visible`]: false
  })
}

/** Post an Edge description to the chat */
export const _onEdgeToChat = async function (event, target) {
  event.preventDefault()

  // Top-level variables
  const actor = this.actor
  const key = target.getAttribute('data-edge')
  const edge = actor.system.edges[key]
  // `actor.system.edges[key]` só guarda {visible, selected} — nome/label vem
  // da lista estática (mesma fonte usada no dropdown de "Adicionar Trunfo"),
  // por isso `edge.displayName` sempre vinha undefined (card sem título).
  const edgeDef = Edges.getList({})[key] || {}

  Loom.ChatMessage.create({
    // Sem isto, a mensagem saía sem falante (mesmo bug já corrigido em
    // `_onFormToChat`) e o card do chat mostrava o card vazio/"Gamemaster".
    speaker: Loom.ChatMessage.getSpeaker({ actor }),
    flags: {
      wod5e: {
        name: edgeDef.displayName || edgeDef.label || key,
        // `icons/svg/dice-target.svg` é caminho do sistema original — não existe neste
        // projeto (o servidor devolve o fallback de SPA, HTML, não a imagem).
        img: 'marketplace/rulesets/wod5e/assets/icons/items/edge.png',
        description: edge?.description || ''
      }
    }
  })
}

// Fila serializada por ator para persistir a seleção em segundo plano sem disparar
// múltiplos PUTs simultâneos e sem congelar ou atrasar a interface do usuário.
const _actorEdgeSelectionQueues = new Map()

function enqueueActorEdgeSelection(actor, updateFn) {
  const actorId = actor?.id || 'default'
  const current = _actorEdgeSelectionQueues.get(actorId) || Promise.resolve()
  const next = current
    .then(async () => {
      await updateFn()
    })
    .catch((err) => {
      console.error('World of Darkness 5e | Error persisting edge selection:', err)
    })
    .finally(() => {
      if (_actorEdgeSelectionQueues.get(actorId) === next) {
        _actorEdgeSelectionQueues.delete(actorId)
      }
    })
  _actorEdgeSelectionQueues.set(actorId, next)
  return next
}

/** Select an edge to display */
export const _onSelectEdge = async function (event, target) {
  event?.preventDefault?.()

  // Top-level variables
  const actor = this.actor
  const element = target || event?.currentTarget || event?.target?.closest?.('[data-edge]')
  const edge = element?.getAttribute?.('data-edge') || element?.dataset?.edge

  if (!actor || !edge) return

  // Atualização otimista imediata em memória (0ms de latência percebida)
  const prev = actor.systemData?.selectedEdge || actor.system?.selectedEdge
  if (actor.systemData) {
    actor.systemData.selectedEdge = edge
    if (actor.systemData.edges?.[edge]) {
      actor.systemData.edges[edge].selected = true
    }
    if (prev && prev !== edge && actor.systemData.edges?.[prev]) {
      actor.systemData.edges[prev].selected = false
    }
  }
  if (actor.system) {
    actor.system.selectedEdge = edge
    if (actor.system.edges?.[edge]) {
      actor.system.edges[edge].selected = true
    }
    if (prev && prev !== edge && actor.system.edges?.[prev]) {
      actor.system.edges[prev].selected = false
    }
  }

  // Re-renderiza a tela localmente no mesmo instante
  if (typeof this.rerenderBody === 'function') {
    this.rerenderBody()
  } else if (typeof this.render === 'function') {
    this.render(false)
  }

  // Persiste a seleção no servidor em segundo plano de forma enfileirada
  enqueueActorEdgeSelection(actor, async () => {
    await _updateSelectedEdge(actor, edge)
  })
}

/** Select a perk to display */
export const _onSelectEdgePerk = async function (event, target) {
  event?.preventDefault?.()

  // Top-level variables
  const actor = this.actor
  const element = target || event?.currentTarget || event?.target?.closest?.('[data-perk]')
  const perk = element?.getAttribute?.('data-perk') || element?.dataset?.perk

  if (!actor || !perk) return

  const items = getActorItems(actor)
  const perkItem = items.find((item) => item.id === perk)
  const edge = perkItem?.system?.edge

  // Atualização otimista imediata em memória (0ms de latência percebida)
  if (actor.systemData) {
    actor.systemData.selectedEdgePerk = perk
    if (edge) {
      actor.systemData.selectedEdge = edge
      if (actor.systemData.edges?.[edge]) {
        actor.systemData.edges[edge].selected = true
      }
    }
  }
  if (actor.system) {
    actor.system.selectedEdgePerk = perk
    if (edge) {
      actor.system.selectedEdge = edge
      if (actor.system.edges?.[edge]) {
        actor.system.edges[edge].selected = true
      }
    }
  }

  // Re-renderiza a tela localmente no mesmo instante
  if (typeof this.rerenderBody === 'function') {
    this.rerenderBody()
  } else if (typeof this.render === 'function') {
    this.render(false)
  }

  // Persiste a seleção no servidor em segundo plano de forma enfileirada
  enqueueActorEdgeSelection(actor, async () => {
    await _updateSelectedPerk(actor, perk)
  })
}

export const _updateSelectedPerk = async function (actor, perk) {
  let selectedEdgePerk = ''
  const items = getActorItems(actor)
  const perkItem = perk ? items.find((item) => item.id === perk) : null

  const patches = []
  if (perkItem) {
    const edge = perkItem.system?.edge
    selectedEdgePerk = perk

    if (edge) {
      patches.push([['selectedEdge'], edge])
      patches.push([['edges', edge, 'selected'], true])

      const previouslySelectedEdge = actor.system?.selectedEdge || actor.systemData?.selectedEdge
      if (previouslySelectedEdge && previouslySelectedEdge !== edge) {
        patches.push([['edges', previouslySelectedEdge, 'selected'], false])
      }
    }
  }

  patches.push([['selectedEdgePerk'], selectedEdgePerk])

  // Um único update no documento do ator, sem requisições REST adicionais em itens
  const systemData = applySystemPatch(actor.systemData ?? actor.system, patches)
  if (actor.systemData) {
    actor.systemData.selectedEdgePerk = selectedEdgePerk
    if (perkItem?.system?.edge) {
      actor.systemData.selectedEdge = perkItem.system.edge
    }
  }
  if (actor.system) {
    actor.system.selectedEdgePerk = selectedEdgePerk
    if (perkItem?.system?.edge) {
      actor.system.selectedEdge = perkItem.system.edge
    }
  }

  await actor.update({ systemData })
}

export const _updateSelectedEdge = async function (actor, edge) {
  const patches = []

  // Make sure we actually have an edge defined
  if (edge && (actor.system?.edges?.[edge] || actor.systemData?.edges?.[edge])) {
    patches.push([['selectedEdge'], edge])
    patches.push([['edges', edge, 'selected'], true])
  } else {
    // Revert to an empty string
    patches.push([['selectedEdge'], ''])
  }

  // Unselect the previously selected edge
  const previouslySelectedEdge = actor.system?.selectedEdge || actor.systemData?.selectedEdge
  if (previouslySelectedEdge && previouslySelectedEdge !== edge) {
    patches.push([['edges', previouslySelectedEdge, 'selected'], false])
  }

  // Update the actor data
  const systemData = applySystemPatch(actor.systemData ?? actor.system, patches)
  if (actor.systemData) {
    actor.systemData.selectedEdge = edge || ''
  }
  if (actor.system) {
    actor.system.selectedEdge = edge || ''
  }
  await actor.update({ systemData })
}
