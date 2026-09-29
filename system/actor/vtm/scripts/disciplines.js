import { applySystemPatch } from '../../scripts/counters.js'
import { updateItemData, getActorItems } from '../../../scripts/embedded-items.js'
import { Disciplines } from '../../../api/def/disciplines.js'
/** Handle adding a new discipline to the sheet */
export const _onAddDiscipline = async function (event) {
  event.preventDefault()

  // Top-level variables
  const actor = this.actor

  // Secondary variables
  const disciplineList = WOD5E.Disciplines.getList({})

  // Build a simple { key: "Label" } map that StringField.choices understands
  const disciplineChoices = Object.fromEntries(
    Object.entries(disciplineList).map(([key, val]) => [key, val.displayName || val.label || key])
  )

  // Build the options for the select dropdown
  const content = new Loom.fields_v14.StringField({
    choices: disciplineChoices,
    label: Loom.i18n.localize('WOD5E.VTM.SelectDiscipline'),
    required: true
  }).toFormGroup(
    {},
    {
      name: 'discipline'
    }
  ).outerHTML


  // Prompt a dialog to determine which discipline we're adding
  const disciplineSelected = await Loom.LoomDialog.prompt({
    window: {
      title: Loom.i18n.localize('WOD5E.VTM.AddDiscipline')
    },
    classes: ['wod5e', 'dialog', 'vampire', 'dialog'],
    content,
    ok: {
      callback: (event, button, dialog) =>
        new Loom.LoomFormData(dialog.getBody()).object.discipline
    },
    modal: true
  })

  if (disciplineSelected) {
    // Make the discipline visible
    const systemData = applySystemPatch(actor.systemData, [
      [['disciplines', disciplineSelected, 'visible'], true]
    ])
    await actor.update({ systemData })

    // Update the currently selected discipline and power — sequenciado: as duas chamadas
    // abaixo fazem `actor.update()` no mesmo ator, e disparadas em paralelo cada uma computa
    // seu merge a partir do mesmo estado desatualizado, apagando a mudança da outra sem erro
    // nenhum no console (mesma corrida já corrigida em `_updateSelectedDisciplinePower`).
    await _updateSelectedDiscipline(actor, disciplineSelected)
    await _updateSelectedDisciplinePower(actor, '')
  }
  await this._reloadDocument?.()
}

/** Handle removing a discipline from an actor */
export const _onRemoveDiscipline = async function (event, target) {
  event.preventDefault()

  // Top-level variables
  const actor = this.actor
  const discipline = target.getAttribute('data-discipline')

  const systemData = applySystemPatch(actor.systemData, [
    [['disciplines', discipline, 'visible'], false]
  ])
  await actor.update({ systemData })
  await this._reloadDocument?.()
}

/** Post Discipline description to the chat */
export const _onDisciplineToChat = async function (event, target) {
  event.preventDefault()

  // Top-level variables
  const actor = this.actor
  const key = target.getAttribute('data-discipline')
  const derived = actor.derivedData || {}
  const discipline = derived.disciplines?.[key] || actor.system.disciplines[key]
  // `derivedData` nunca vem populado no client (confirmado ao vivo) e
  // `actor.system.disciplines[key]` só guarda {visible, selected, value} —
  // nome/label vem da lista estática (mesma fonte do dropdown de "Adicionar
  // Disciplina"), por isso `discipline.displayName` sempre vinha undefined.
  const disciplineDef = Disciplines.getList({})[key] || {}

  Loom.messages.create({
    // Sem isto, a mensagem saía sem falante (mesmo bug já corrigido em
    // `_onFormToChat`) e o card do chat mostrava o card vazio/"Gamemaster".
    speaker: Loom.ChatMessage.getSpeaker({ actor }),
    flags: {
      wod5e: {
        name: discipline.displayName || disciplineDef.displayName || disciplineDef.label || key,
        // `icons/svg/dice-target.svg` é caminho do sistema original — não existe neste
        // projeto (o servidor devolve o fallback de SPA, HTML, não a imagem).
        img: 'marketplace/rulesets/wod5e/assets/icons/items/discipline.png',
        description: discipline?.description
      }
    }
  })
}

// Clicar várias vezes rápido no mesmo poder/disciplina (ou em vários diferentes) enquanto o
// ciclo anterior ainda está em voo disparava outro update completo por cima — cada um faz
// vários PUTs sequenciais, então 2 cliques rápidos já beiravam o limite do disjuntor de loop
// do servidor. Ignora clique novo enquanto o ator ainda tem uma seleção em andamento.
const _selectionInFlight = new Set()

/** Select a discipline to display */
export const _onSelectDiscipline = async function (event, target) {
  event.preventDefault()

  // Top-level variables
  const actor = this.actor
  const discipline = target.getAttribute('data-discipline')

  if (_selectionInFlight.has(actor.id)) return
  _selectionInFlight.add(actor.id)
  try {
    await _updateSelectedDiscipline(actor, discipline)
    if (typeof this._reloadDocument === 'function') await this._reloadDocument()
  } finally {
    _selectionInFlight.delete(actor.id)
  }
}

/** Select a power to display */
export const _onSelectDisciplinePower = async function (event, target) {
  event.preventDefault()

  // Top-level variables
  const actor = this.actor
  const power = target.getAttribute('data-power')

  if (_selectionInFlight.has(actor.id)) return
  _selectionInFlight.add(actor.id)
  try {
    await _updateSelectedDisciplinePower(actor, power)
    // Nada nesse fluxo força um re-render depois dos PUTs (item novo selected:true,
    // item antigo selected:false, actor.selectedDisciplinePower) — o `getActorItems()`
    // usado aqui lê o array local cacheado, que só fica correto de novo depois de um
    // reload real. Sem isso, dependendo do timing do WS, dois poderes podiam aparecer
    // marcados como selecionados ao mesmo tempo na tela (o servidor ficava certo, a
    // ficha aberta não). `_reloadDocument` é GET, não conta pro disjuntor de loop.
    if (typeof this._reloadDocument === 'function') await this._reloadDocument()
  } finally {
    _selectionInFlight.delete(actor.id)
  }
}

export const _updateSelectedDisciplinePower = async function (actor, power) {
  // Variable de saída pro campo selectedDisciplinePower do ator
  let selectedDisciplinePower = ''

  // `getActorItems()` em vez de `actor.items`: este último às vezes é um array de rows
  // cruas (sem o acessor `.system`), dependendo do caminho por onde o ator foi carregado —
  // `powerItem.system.discipline` estourava "Cannot read properties of undefined".
  const items = getActorItems(actor)

  // Make sure we actually have a valid power defined
  const powerItem = power ? items.find((item) => item.id === power) : null
  if (powerItem) {
    const discipline = powerItem.system?.discipline

    // Update the selected power
    selectedDisciplinePower = power
    // Sequenciado (await) — os três updates abaixo tocam o mesmo ator; disparados em
    // paralelo, cada um calcula seu merge a partir do mesmo estado desatualizado e o
    // que responder por último apaga a mudança do outro, sem erro nenhum no console.
    await updateItemData(powerItem, { data: applySystemPatch(powerItem.data, [[['selected'], true]]) })

    // Update the selected disciplines
    await _updateSelectedDiscipline(actor, discipline)
  }

  // Unselect the previously selected power
  const previouslySelectedPower = actor.systemData?.selectedDisciplinePower
  const prevItem = previouslySelectedPower && previouslySelectedPower !== power
    ? items.find((item) => item.id === previouslySelectedPower)
    : null
  if (prevItem) {
    await updateItemData(prevItem, { data: applySystemPatch(prevItem.data, [[['selected'], false]]) })
  }

  // Update the actor data
  const systemData = applySystemPatch(actor.systemData, [
    [['selectedDisciplinePower'], selectedDisciplinePower]
  ])
  await actor.update({ systemData })
}

export const _updateSelectedDiscipline = async function (actor, discipline) {
  const patches = []

  // Make sure we actually have a discipline defined
  if (discipline && actor.system.disciplines[discipline]) {
    patches.push([['selectedDiscipline'], discipline])
    patches.push([['disciplines', discipline, 'selected'], true])
  } else {
    // Revert to an empty string
    patches.push([['selectedDiscipline'], ''])
  }

  // Unselect the previously selected discipline
  const previouslySelectedDiscipline = actor.system?.selectedDiscipline
  if (previouslySelectedDiscipline && previouslySelectedDiscipline !== discipline) {
    patches.push([['disciplines', previouslySelectedDiscipline, 'selected'], false])
  }

  // Update the actor data
  const systemData = applySystemPatch(actor.systemData, patches)
  await actor.update({ systemData })
}
