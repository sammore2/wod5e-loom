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

// Fila serializada por ator para persistir a seleção em segundo plano sem disparar
// múltiplos PUTs simultâneos e sem congelar ou atrasar a interface do usuário.
const _actorSelectionQueues = new Map()

function enqueueActorSelection(actor, updateFn) {
  const actorId = actor?.id || 'default'
  const current = _actorSelectionQueues.get(actorId) || Promise.resolve()
  const next = current
    .then(async () => {
      await updateFn()
    })
    .catch((err) => {
      console.error('World of Darkness 5e | Error persisting discipline selection:', err)
    })
    .finally(() => {
      if (_actorSelectionQueues.get(actorId) === next) {
        _actorSelectionQueues.delete(actorId)
      }
    })
  _actorSelectionQueues.set(actorId, next)
  return next
}

/** Select a discipline to display */
export const _onSelectDiscipline = async function (event, target) {
  event?.preventDefault?.()

  // Top-level variables
  const actor = this.actor
  const element = target || event?.currentTarget || event?.target?.closest?.('[data-discipline]')
  const discipline = element?.getAttribute?.('data-discipline') || element?.dataset?.discipline

  if (!actor || !discipline) return

  // Atualização otimista imediata em memória (0ms de latência percebida)
  const prev = actor.systemData?.selectedDiscipline || actor.system?.selectedDiscipline
  if (actor.systemData) {
    actor.systemData.selectedDiscipline = discipline
    if (actor.systemData.disciplines?.[discipline]) {
      actor.systemData.disciplines[discipline].selected = true
    }
    if (prev && prev !== discipline && actor.systemData.disciplines?.[prev]) {
      actor.systemData.disciplines[prev].selected = false
    }
  }
  if (actor.system) {
    actor.system.selectedDiscipline = discipline
    if (actor.system.disciplines?.[discipline]) {
      actor.system.disciplines[discipline].selected = true
    }
    if (prev && prev !== discipline && actor.system.disciplines?.[prev]) {
      actor.system.disciplines[prev].selected = false
    }
  }

  // Re-renderiza a tela localmente no mesmo instante
  if (typeof this.rerenderBody === 'function') {
    this.rerenderBody()
  } else if (typeof this.render === 'function') {
    this.render(false)
  }

  // Persiste a seleção no servidor em segundo plano de forma enfileirada
  enqueueActorSelection(actor, async () => {
    await _updateSelectedDiscipline(actor, discipline)
  })
}

/** Select a power to display */
export const _onSelectDisciplinePower = async function (event, target) {
  event?.preventDefault?.()

  // Top-level variables
  const actor = this.actor
  const element = target || event?.currentTarget || event?.target?.closest?.('[data-power]')
  const power = element?.getAttribute?.('data-power') || element?.dataset?.power

  if (!actor || !power) return

  const items = getActorItems(actor)
  const powerItem = items.find((item) => item.id === power)
  const discipline = powerItem?.system?.discipline

  // Atualização otimista imediata em memória (0ms de latência percebida)
  if (actor.systemData) {
    actor.systemData.selectedDisciplinePower = power
    if (discipline) {
      actor.systemData.selectedDiscipline = discipline
      if (actor.systemData.disciplines?.[discipline]) {
        actor.systemData.disciplines[discipline].selected = true
      }
    }
  }
  if (actor.system) {
    actor.system.selectedDisciplinePower = power
    if (discipline) {
      actor.system.selectedDiscipline = discipline
      if (actor.system.disciplines?.[discipline]) {
        actor.system.disciplines[discipline].selected = true
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
  enqueueActorSelection(actor, async () => {
    await _updateSelectedDisciplinePower(actor, power)
  })
}

export const _updateSelectedDisciplinePower = async function (actor, power) {
  let selectedDisciplinePower = ''
  const items = getActorItems(actor)
  const powerItem = power ? items.find((item) => item.id === power) : null

  const patches = []
  if (powerItem) {
    const discipline = powerItem.system?.discipline
    selectedDisciplinePower = power

    if (discipline) {
      patches.push([['selectedDiscipline'], discipline])
      patches.push([['disciplines', discipline, 'selected'], true])
      patches.push([['disciplines', discipline, 'visible'], true])

      const previouslySelectedDiscipline = actor.system?.selectedDiscipline || actor.systemData?.selectedDiscipline
      if (previouslySelectedDiscipline && previouslySelectedDiscipline !== discipline) {
        patches.push([['disciplines', previouslySelectedDiscipline, 'selected'], false])
      }
    }
  }

  patches.push([['selectedDisciplinePower'], selectedDisciplinePower])

  // Um único update no documento do ator, sem requisições REST adicionais em itens
  const systemData = applySystemPatch(actor.systemData ?? actor.system, patches)
  if (actor.systemData) {
    actor.systemData.selectedDisciplinePower = selectedDisciplinePower
    if (powerItem?.system?.discipline) {
      actor.systemData.selectedDiscipline = powerItem.system.discipline
    }
  }
  if (actor.system) {
    actor.system.selectedDisciplinePower = selectedDisciplinePower
    if (powerItem?.system?.discipline) {
      actor.system.selectedDiscipline = powerItem.system.discipline
    }
  }

  await actor.update({ systemData })
}

export const _updateSelectedDiscipline = async function (actor, discipline) {
  const patches = []
  const disciplineList = Disciplines.getList({})
  const isValid = Boolean(
    discipline && (
      disciplineList[discipline] ||
      actor.derivedData?.disciplines?.[discipline] ||
      actor.system?.disciplines?.[discipline] ||
      actor.systemData?.disciplines?.[discipline]
    )
  )

  // Make sure we actually have a discipline defined
  if (isValid) {
    patches.push([['selectedDiscipline'], discipline])
    patches.push([['disciplines', discipline, 'selected'], true])
    patches.push([['disciplines', discipline, 'visible'], true])
  } else {
    // Revert to an empty string
    patches.push([['selectedDiscipline'], ''])
  }

  // Unselect the previously selected discipline
  const previouslySelectedDiscipline = actor.system?.selectedDiscipline || actor.systemData?.selectedDiscipline
  if (previouslySelectedDiscipline && previouslySelectedDiscipline !== discipline) {
    patches.push([['disciplines', previouslySelectedDiscipline, 'selected'], false])
  }

  // Update the actor data
  const systemData = applySystemPatch(actor.systemData ?? actor.system, patches)
  if (actor.systemData) {
    actor.systemData.selectedDiscipline = isValid ? discipline : ''
  }
  if (actor.system) {
    actor.system.selectedDiscipline = isValid ? discipline : ''
  }
  await actor.update({ systemData })
}
