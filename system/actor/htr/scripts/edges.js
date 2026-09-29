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

// Mesma proteção de disciplines.js (vtm) / gifts.js (wta): clicar rápido demais enquanto o
// ciclo anterior ainda está em voo disparava outro update completo por cima, e sem forçar
// reload depois o array local de itens ficava desatualizado até o próximo re-render — dois
// edges/perks podiam aparecer selecionados ao mesmo tempo, e cliques repetidos esbarravam
// no disjuntor de loop do servidor.
const _edgeSelectionInFlight = new Set()

/** Select a edge to display */
export const _onSelectEdge = async function (event, target) {
  event.preventDefault()

  // Top-level variables
  const actor = this.actor
  const edge = target.getAttribute('data-edge')

  if (_edgeSelectionInFlight.has(actor.id)) return
  _edgeSelectionInFlight.add(actor.id)
  try {
    await _updateSelectedEdge(actor, edge)
    if (typeof this._reloadDocument === 'function') await this._reloadDocument()
  } finally {
    _edgeSelectionInFlight.delete(actor.id)
  }
}

/** Select a perk to display */
export const _onSelectEdgePerk = async function (event, target) {
  event.preventDefault()

  // Top-level variables
  const actor = this.actor
  const perk = target.getAttribute('data-perk')

  if (_edgeSelectionInFlight.has(actor.id)) return
  _edgeSelectionInFlight.add(actor.id)
  try {
    await _updateSelectedPerk(actor, perk)
    if (typeof this._reloadDocument === 'function') await this._reloadDocument()
  } finally {
    _edgeSelectionInFlight.delete(actor.id)
  }
}

export const _updateSelectedPerk = async function (actor, perk) {
  // Variável de saída pro campo selectedEdgePerk do ator
  let selectedEdgePerk = ''

  // `getActorItems()` em vez de `actor.items`: este último às vezes é um array de rows
  // cruas (sem o acessor `.system`), dependendo do caminho por onde o ator foi carregado —
  // mesmo bug já corrigido em `gifts.js`/`disciplines.js` (`Cannot read properties of
  // undefined`).
  const items = getActorItems(actor)

  // Make sure we actually have a valid perk defined
  const perkItem = perk ? items.find((item) => item.id === perk) : null
  if (perkItem) {
    const edge = perkItem.system?.edge

    // Update the selected perk
    selectedEdgePerk = perk
    // Sequenciado (await) — os updates abaixo tocam o mesmo ator; disparados em
    // paralelo (como antes), cada um calcula seu merge a partir do mesmo estado
    // desatualizado e o que responder por último apaga a mudança do outro, sem erro
    // nenhum no console — e alternar seleção rápido (clique duplo em edges diferentes)
    // dispara a guarda de loop do core (mutation-loop-guard), travando a ficha.
    await updateItemData(perkItem, { data: applySystemPatch(perkItem.data, [[['selected'], true]]) })

    // Update the selected edge
    await _updateSelectedEdge(actor, edge)
  }

  // Unselect the previously selected perk
  const previouslySelectedPerk = actor.system?.selectedEdgePerk
  const prevItem = previouslySelectedPerk && previouslySelectedPerk !== perk
    ? items.find((item) => item.id === previouslySelectedPerk)
    : null
  if (prevItem) {
    await updateItemData(prevItem, { data: applySystemPatch(prevItem.data, [[['selected'], false]]) })
  }

  // Update the actor data — único `actor.update()` juntando visibilidade + seleção
  const systemData = applySystemPatch(actor.systemData, [
    [['selectedEdgePerk'], selectedEdgePerk]
  ])
  await actor.update({ systemData })
}

export const _updateSelectedEdge = async function (actor, edge) {
  const patches = []

  // Make sure we actually have an edge defined
  if (edge && actor.system.edges[edge]) {
    patches.push([['selectedEdge'], edge])
    patches.push([['edges', edge, 'selected'], true])
  } else {
    // Revert to an empty string
    patches.push([['selectedEdge'], ''])
  }

  // Unselect the previously selected edge
  const previouslySelectedEdge = actor.system?.selectedEdge
  if (previouslySelectedEdge && previouslySelectedEdge !== edge) {
    patches.push([['edges', previouslySelectedEdge, 'selected'], false])
  }

  // Update the actor data — único `actor.update()` (ver comentário em
  // `_updateSelectedPerk`, mesma proteção contra mutation-loop-guard)
  const systemData = applySystemPatch(actor.systemData, patches)
  await actor.update({ systemData })
}
