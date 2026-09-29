import { updateItemData, getActorItems } from '../../scripts/embedded-items.js'

// Handle all types of resource changes
export const _onResourceChange = async function (event) {
  event.preventDefault()

  // Top-level variables
  let actor
  const element = event.currentTarget
  const dataset = Object.assign({}, element.dataset)
  const resource = dataset.resource
  if (dataset.actorId) {
    actor = Loom.actors.get(dataset.actorId)
  } else {
    actor = this.actor
  }
  // `actor.systemData` é o campo cru, sem os defaults do schema aplicados — um Mortal
  // recém-criado podia não ter `health`/`willpower` ainda, e `systemData[resource].max++`
  // quebrava. `actor.system` é a versão já com os defaults do dataModel mesclados.
  const systemData = Loom.utils.deepClone(actor.system ?? {})

  // Don't let things be edited if the sheet is locked
  if (systemData.locked) {
    Loom.ui?.notifications.warn(
      Loom.i18n.format('WOD5E.Notifications.CannotModifyResourceString', {
        string: actor.name
      })
    )
    return
  }

  // Handle adding and subtracting the number of boxes
  if (dataset.resourceAction === 'plus') {
    systemData[resource].max++
  } else if (dataset.resourceAction === 'minus') {
    systemData[resource].max = Math.max(systemData[resource].max - 1, 0)
  }

  if (
    systemData[resource].aggravated + systemData[resource].superficial >
    systemData[resource].max
  ) {
    systemData[resource].aggravated =
      systemData[resource].max - systemData[resource].superficial
    if (systemData[resource].aggravated <= 0) {
      systemData[resource].aggravated = 0
      systemData[resource].superficial = systemData[resource].max
    }
  }

  // Update the actor with the new data
  await actor.update({ systemData })
  // O `update()` persiste e sincroniza `actor.systemData` local, mas nada re-renderiza a
  // ficha sozinho — sem isto o dot só aparecia certo depois de fechar e reabrir a janela.
  this.rerenderBody?.()
}

// Function to help with counter states
function parseCounterStates(states) {
  return states.split(',').reduce((obj, state) => {
    const [k, v] = state.split(':')
    obj[k] = v
    return obj
  }, {})
}

// O servidor do LoomVTT substitui `data`/`systemData` inteiro no PUT (não faz merge
// profundo) — mandar só a folha que mudou apagaria o resto do documento. Clona o objeto
// atual, aplica um ou mais valores em caminhos de chaves reais (sem prefixo legado
// `system.`) e devolve o objeto completo pronto pra ir no `update()`.
// `patches` é sempre uma lista de pares `[path, value]`, pra permitir setar vários campos
// relacionados (ex: selecionar uma disciplina nova e desselecionar a anterior) numa única
// chamada — sem isso, duas chamadas separadas em paralelo cada uma clonaria o estado
// desatualizado e uma apagaria a mudança da outra.
export function applySystemPatch(source, patches) {
  const clone = Loom.utils.deepClone(source ?? {})
  for (const [path, value] of patches) {
    let cur = clone
    for (let i = 0; i < path.length - 1; i++) {
      if (typeof cur[path[i]] !== 'object' || cur[path[i]] === null) cur[path[i]] = {}
      cur = cur[path[i]]
    }
    cur[path[path.length - 1]] = value
  }
  return clone
}

function _applyPathToClone(source, path, value) {
  return applySystemPatch(source, [[path, value]])
}

// Handle assigning a new value to the appropriate actor field
// `sheet` (opcional): quem chamou, pra re-renderizar depois do save — `update()` sincroniza
// o dado local mas não redesenha a ficha sozinho.
export const _assignToActorField = async (fields, value, actor, sheet) => {
  // Handle updating actor owned items
  if (fields.length === 2 && fields[0] === 'items') {
    const itemId = fields[1]
    const item = getActorItems(actor).find((item) => (item.id ?? item._id) === itemId)
    if (item) {
      // `updateItemData` (não `item.update()` direto): `actor.items` às vezes devolve uma
      // row crua sem `.update()` de verdade — essa função já sabe cair pro fallback REST
      // nesse caso (ver `embedded-items.js`).
      const data = _applyPathToClone(item.data, ['points'], value)
      // `updateItemData` já dispara a cascata do servidor (`cascadeItemToActor`), que
      // reemite o ator dono via WS `actor.updated` — o listener reativo de
      // `document-sheet.ts` pega essa atualização sozinho e já chama `rerenderBody()`.
      // Nada de recarregar o documento aqui na marra (`_reloadDocument`, refetch cheio):
      // isso fazia a ficha inteira piscar a cada clique de ponto.
      await updateItemData(item, { data })
    } else {
      console.warn(`World of Darkness 5e | Item with ID ${itemId} not found.`)
    }
  } else {
    try {
      // `fields[0]` costuma ser o literal `'system'` (vem do atributo `data-name` do
      // template, ex: `system.attributes.strength.value`) — não é mais um prefixo mágico
      // de update, é só o marcador de "isso é campo de sistema"; descarta antes de montar
      // o caminho real dentro de `systemData`.
      const path = fields[0] === 'system' ? fields.slice(1) : fields
      const systemData = _applyPathToClone(actor.systemData, path, value)
      await actor.update({ systemData })
    } catch (error) {
      console.error(`World of Darkness 5e | Error updating actor field: ${error.message}`)
    }
  }
  sheet?.rerenderBody?.()
}

/**
 * DOT COUNTERS
 */

// Handle setting up the dot counters
export const _setupDotCounters = async function (html) {
  const elements = html.querySelectorAll('.resource-value')
  elements.forEach((el) => {
    const value = parseInt(el.dataset.value)
    el.querySelectorAll('.resource-value-step').forEach((step, i) => {
      if (i + 1 <= value) {
        step.classList.add('active')
      }
    })
  })

  const staticElements = html.querySelectorAll('.resource-value-static')
  staticElements.forEach((el) => {
    const value = parseInt(el.dataset.value)
    el.querySelectorAll('.resource-value-static-step').forEach((step, i) => {
      if (i + 1 <= value) {
        step.classList.add('active')
      }
    })
  })
}

// Handle dot counters
export const _onDotCounterChange = async function (event, target) {
  event.preventDefault()

  // Top-level variables
  let actor
  const element = target
  const dataset = target.dataset
  const actorId = target.getAttribute('data-actor-id') || ''
  if (actorId) {
    actor = Loom.actors.get(actorId)
  } else {
    actor = this.actor
  }

  // Secondary variables
  const index = parseInt(dataset.index)
  const parent = element.parentNode
  const fieldStrings = parent.dataset.path || parent.dataset.name
  const fields = fieldStrings.split('.')
  const steps = parent.querySelectorAll('.resource-value-step')

  // Make sure that the dot counter can only be changed if the user has permission
  if (!actor.testUserPermission(Loom.user.id, 3)) {
    Loom.ui?.notifications.warn(
      Loom.i18n.format('WOD5E.Notifications.NoSufficientPermission', {
        string: actor.name
      })
    )
    return
  }

  // Make sure that the dot counter can only be changed if the sheet is
  // unlocked or if it's the hunger/rage track.
  if (
    !(actor.type === 'group') &&
    actor.system.locked &&
    !parent.querySelector('.hunger-value') &&
    !parent.querySelector('.member-hunger') &&
    !parent.querySelector('.rage-value') &&
    !parent.querySelector('.member-rage')
  ) {
    Loom.ui?.notifications.warn(
      Loom.i18n.format('WOD5E.Notifications.CannotModifyResourceString', {
        string: actor.name
      })
    )
    return
  }

  // Don't let us set the counter less than 0 or greater than the max length set
  if (index < 0 || index > steps.length) {
    return
  }

  // Update the actor field
  _assignToActorField(fields, index + 1, actor, this)
}

// Set dot counters to an empty value
export const _onDotCounterEmpty = async function (event, target) {
  event.preventDefault()

  // Top-level variables
  let actor
  const element = target
  const parent = element.parentNode
  const actorId = target.getAttribute('data-actor-id') || ''
  if (actorId) {
    actor = Loom.actors.get(actorId)
  } else {
    actor = this.actor
  }

  // Secondary variables
  const fieldStrings = parent.dataset.path || parent.dataset.name
  const fields = fieldStrings.split('.')
  const steps = parent.querySelectorAll('.resource-value-empty')

  // Make sure that the dot counter can only be changed if the sheet is
  // unlocked or if it's the hunger track.
  // Bypass this if this function is being called from a group sheet
  if (
    !(actor.type === 'group') &&
    actor.system.locked &&
    !parent.querySelector('.hunger-value').length &&
    !parent.querySelector('.member-hunger').length &&
    !parent.querySelector('.rage-value').length &&
    !parent.querySelector('.member-rage').length
  ) {
    Loom.ui?.notifications.warn(
      Loom.i18n.format('WOD5E.Notifications.CannotModifyResourceString', {
        string: actor.name
      })
    )
    return
  }

  // Update the actor field
  steps.forEach((step) => step.classList.remove('active'))
  _assignToActorField(fields, 0, actor, this)
}

/**
 * SQUARE COUNTERS
 */

// Set up the square counters
export const _setupSquareCounters = async function (html) {
  const counters = html.querySelectorAll('.resource-counter')
  counters.forEach((counter) => {
    const data = counter.dataset
    const states = parseCounterStates(data.states)
    const fieldStr = (data.path || data.name || '').replace(/^system\./, '')
    const humanity = fieldStr === 'humanity'
    const despair = fieldStr === 'despair'
    const desperation = fieldStr === 'desperation'
    const danger = fieldStr === 'danger'

    const fulls = parseInt(data[states['-']]) || 0
    const halfs = parseInt(data[states['/']]) || 0
    const crossed = parseInt(data[states.x]) || 0

    let values

    // This is a little messy but it's effective.
    // Effectively we're making sure that each square
    // counter's box-filling tactic is followed properly.
    if (despair) {
      // Hunter-specific
      values = new Array(fulls)

      values.fill('-', 0, fulls)
    } else if (humanity || desperation || danger) {
      // Vampire-specific
      values = new Array(fulls + halfs)

      values.fill('-', 0, fulls)
      values.fill('/', fulls, fulls + halfs)
    } else {
      // General use
      values = new Array(crossed + halfs)

      values.fill('x', 0, crossed)
      values.fill('/', crossed, crossed + halfs)
    }

    // Iterate through the data states now that they're properly defined
    counter.querySelectorAll('.resource-counter-step').forEach((step, i) => {
      step.dataset.state = ''
      if (i < values.length) {
        step.dataset.state = values[i]
      }
    })
  })
}

// Handle changes to square counters
export const _onSquareCounterChange = async function (event) {
  event.preventDefault()

  const element = event.currentTarget
  const dataset = Object.assign({}, element.dataset)
  const index = parseInt(dataset.index)
  const actor = getActor(dataset.actorId, this.actor)

  // Ensure user has permission
  if (!hasSufficientPermission(this.actor)) return

  const parent = element.parentNode
  const data = parent.dataset
  const states = parseCounterStates(data.states)
  const steps = parent.querySelectorAll('.resource-counter-step')

  if (index < 0 || index >= steps.length) return

  const oldState = element.dataset.state || ''
  const allStates = ['', ...Object.keys(states)]
  const currentState = allStates.indexOf(oldState)

  if (currentState < 0) return

  const newState = getNextState(allStates, currentState)
  steps[index].dataset.state = newState

  // Update counters based on old and new state
  updateStateCounters(oldState, newState, data, states, index)

  // Save new state to actor
  const fields = (data.path || data.name).split('.')
  const newValue = calculateNewValue(states, data)
  _assignToActorField(fields, newValue, actor, this)
}

// Function to remove square counter value at clicked index
export const _onRemoveSquareCounter = async function (event) {
  event.preventDefault()

  const element = event.currentTarget
  const dataset = Object.assign({}, element.dataset)
  const index = parseInt(dataset.index)
  const actor = getActor(dataset.actorId, this.actor)

  // Ensure user has permission
  if (!hasSufficientPermission(this.actor)) return

  const parent = element.parentNode
  const data = parent.dataset
  const states = parseCounterStates(data.states)
  const steps = parent.querySelectorAll('.resource-counter-step')

  if (index < 0 || index >= steps.length) return

  const oldState = element.dataset.state || ''
  const allStates = ['', ...Object.keys(states)]
  const currentState = allStates.indexOf(oldState)

  if (currentState < 0) return

  const newState = resetState(allStates, currentState)
  steps[index].dataset.state = newState

  // Update counters based on old and new state
  updateStateCounters(oldState, newState, data, states, index)

  // Save new state to actor
  const fields = (data.path || data.name).split('.')
  const newValue = calculateNewValue(states, data)
  _assignToActorField(fields, newValue, actor, this)
}

/**
 * HELPER FUNCTIONS
 */

// Get actor from dataset or fallback to context actor
function getActor(actorId, fallbackActor) {
  return actorId ? Loom.actors.get(actorId) : fallbackActor
}

// Check if the actor has sufficient permissions (level 3 or higher)
function hasSufficientPermission(actor) {
  if (!actor.testUserPermission(Loom.user.id, 3)) {
    Loom.ui?.notifications.warn(
      Loom.i18n.format('WOD5E.Notifications.NoSufficientPermission', {
        string: actor.name
      })
    )
    return false
  }
  return true
}

// Get the next state from the list of states
function getNextState(allStates, currentState) {
  return allStates[(currentState + 1) % allStates.length]
}

// Get reset the state of the value
function resetState(allStates, currentState) {
  return allStates[(currentState + 1) % 1]
}

// Update state counters when the step changes
function updateStateCounters(oldState, newState, data, states, index) {
  const fieldStr = (data.path || data.name || '').replace(/^system\./, '')
  const humanity = fieldStr === 'humanity'
  const despair = fieldStr === 'despair'
  const desperation = fieldStr === 'desperation'
  const danger = fieldStr === 'danger'

  const fulls = parseInt(data[states['-']]) || 0
  const halfs = parseInt(data[states['/']]) || 0
  const crossed = parseInt(data[states.x]) || 0

  if ((oldState !== '' && oldState !== '-') || humanity || desperation || danger) {
    data[states[oldState]] = (parseInt(data[states[oldState]]) || 0) - 1
  }

  // Adjust maximum count if the step was removed
  if (oldState !== '' && newState === '' && !humanity && !despair && !desperation && !danger) {
    data[states['-']] = (parseInt(data[states['-']]) || 0) - 1
  }

  // Increment new state count
  if (newState !== '') {
    data[states[newState]] =
      (parseInt(data[states[newState]]) || 0) + Math.max(index + 1 - fulls - halfs - crossed, 1)
  }
}

// Calculate new values for all states
function calculateNewValue(states, data) {
  return Object.keys(states).reduce((newValue, stateKey) => {
    newValue[states[stateKey]] = parseInt(data[states[stateKey]]) || 0
    return newValue
  }, {})
}
