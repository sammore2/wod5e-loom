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

// Queue actor field updates with debouncing to prevent network latency and lag on rapid clicks
const _pendingActorUpdates = new Map()

export function queueActorFieldUpdate(actor, fields, value) {
  const path = fields[0] === 'system' ? fields.slice(1) : fields

  // Optimistically update in-memory systemData so synchronous reads and dynamic getter actor.system see new state
  if (actor.systemData) {
    actor.systemData = applySystemPatch(actor.systemData, [[path, value]])
  }

  const actorId = actor.id || actor._id || 'unknown'
  if (!_pendingActorUpdates.has(actorId)) {
    _pendingActorUpdates.set(actorId, { timer: null, patches: new Map() })
  }
  const entry = _pendingActorUpdates.get(actorId)
  if (entry.timer) clearTimeout(entry.timer)

  entry.patches.set(path.join('.'), { path, value })

  entry.timer = setTimeout(async () => {
    _pendingActorUpdates.delete(actorId)
    try {
      const patchList = Array.from(entry.patches.values()).map((p) => [p.path, p.value])
      const systemData = applySystemPatch(actor.systemData ?? actor.system, patchList)
      await actor.update({ systemData })
    } catch (error) {
      console.error(`World of Darkness 5e | Error updating actor resource: ${error.message}`)
    }
  }, 200)
}

// Handle assigning a new value to the appropriate actor field
export const _assignToActorField = async (fields, value, actor, sheet) => {
  // Handle updating actor owned items
  if (fields.length === 2 && fields[0] === 'items') {
    const itemId = fields[1]
    const item = getActorItems(actor).find((item) => (item.id ?? item._id) === itemId)
    if (item) {
      const data = _applyPathToClone(item.data, ['points'], value)
      await updateItemData(item, { data })
    } else {
      console.warn(`World of Darkness 5e | Item with ID ${itemId} not found.`)
    }
  } else {
    try {
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
  const parent = element.parentNode
  const actorId = target.getAttribute('data-actor-id') || parent.dataset?.actorId || ''
  if (actorId) {
    actor = Loom.actors.get(actorId)
  } else {
    actor = this.actor
  }

  // Secondary variables
  const index = parseInt(dataset.index)
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

  // Instant optimistic DOM update
  steps.forEach((step, i) => {
    if (i <= index) step.classList.add('active')
    else step.classList.remove('active')
  })

  // Update actor field with debouncing
  queueActorFieldUpdate(actor, fields, index + 1)
}

// Set dot counters to an empty value
export const _onDotCounterEmpty = async function (event, target) {
  event.preventDefault()

  // Top-level variables
  let actor
  const element = target
  const parent = element.parentNode
  const actorId = target.getAttribute('data-actor-id') || parent.dataset?.actorId || ''
  if (actorId) {
    actor = Loom.actors.get(actorId)
  } else {
    actor = this.actor
  }

  // Secondary variables
  const fieldStrings = parent.dataset.path || parent.dataset.name
  const fields = fieldStrings.split('.')
  const steps = parent.querySelectorAll('.resource-value-step')

  // Make sure that the dot counter can only be changed if the sheet is
  // unlocked or if it's the hunger track.
  if (
    !(actor.type === 'group') &&
    actor.system.locked &&
    !parent.querySelector('.hunger-value')?.length &&
    !parent.querySelector('.member-hunger')?.length &&
    !parent.querySelector('.rage-value')?.length &&
    !parent.querySelector('.member-rage')?.length
  ) {
    Loom.ui?.notifications.warn(
      Loom.i18n.format('WOD5E.Notifications.CannotModifyResourceString', {
        string: actor.name
      })
    )
    return
  }

  // Instant optimistic DOM update
  steps.forEach((step) => step.classList.remove('active'))

  // Update actor field with debouncing
  queueActorFieldUpdate(actor, fields, 0)
}

/**
 * SQUARE COUNTERS
 */

// Optimistically update all steps in a square counter DOM element
export function refreshCounterDOM(counterEl, fieldStr, values) {
  if (!counterEl) return
  const steps = counterEl.querySelectorAll('.resource-counter-step')
  if (fieldStr === 'health' || fieldStr === 'willpower' || fieldStr === 'crinosHealth') {
    counterEl.dataset.superficial = values.superficial ?? 0
    counterEl.dataset.aggravated = values.aggravated ?? 0
    const agg = parseInt(values.aggravated) || 0
    const sup = parseInt(values.superficial) || 0
    steps.forEach((step, i) => {
      if (i < agg) {
        step.dataset.state = 'x'
      } else if (i < agg + sup) {
        step.dataset.state = '/'
      } else {
        step.dataset.state = ''
      }
    })
  } else if (fieldStr === 'humanity') {
    counterEl.dataset.value = values.value ?? 0
    counterEl.dataset.stains = values.stains ?? 0
    const val = parseInt(values.value) || 0
    const stains = parseInt(values.stains) || 0
    steps.forEach((step, i) => {
      if (i < val) {
        step.dataset.state = '-'
      } else if (i < val + stains) {
        step.dataset.state = '/'
      } else {
        step.dataset.state = ''
      }
    })
  } else {
    // General use / Hunter (danger, desperation, despair)
    counterEl.dataset.value = values.value ?? 0
    const val = parseInt(values.value) || 0
    steps.forEach((step, i) => {
      if (i < val) {
        step.dataset.state = '-'
      } else {
        step.dataset.state = ''
      }
    })
  }
}

// Set up the square counters
export const _setupSquareCounters = async function (html) {
  const counters = html.querySelectorAll('.resource-counter')
  counters.forEach((counter) => {
    const data = counter.dataset
    const fieldStr = (data.path || data.name || '').replace(/^system\./, '')
    if (fieldStr === 'health' || fieldStr === 'willpower' || fieldStr === 'crinosHealth') {
      const agg = parseInt(data.aggravated) || 0
      const sup = parseInt(data.superficial) || 0
      refreshCounterDOM(counter, fieldStr, { superficial: sup, aggravated: agg })
    } else if (fieldStr === 'humanity') {
      const val = parseInt(data.value) || 0
      const stains = parseInt(data.stains) || 0
      refreshCounterDOM(counter, fieldStr, { value: val, stains })
    } else {
      const val = parseInt(data.value) || 0
      refreshCounterDOM(counter, fieldStr, { value: val })
    }
  })
}

// Handle changes to square counters (Left-click: mark / upgrade / cycle)
export const _onSquareCounterChange = async function (event) {
  event.preventDefault()
  event.stopPropagation()

  const element = event.currentTarget
  const parent = element.parentNode
  const dataset = element.dataset
  const index = parseInt(dataset.index)
  const actorId = dataset.actorId || parent.dataset?.actorId
  const actor = getActor(actorId, this.actor)

  // Ensure user has permission
  if (!hasSufficientPermission(actor)) return

  const parentData = parent.dataset
  const fieldStr = (parentData.path || parentData.name || '').replace(/^system\./, '')
  const steps = parent.querySelectorAll('.resource-counter-step')
  const max = steps.length

  if (index < 0 || index >= max) return

  if (fieldStr === 'health' || fieldStr === 'willpower' || fieldStr === 'crinosHealth') {
    let agg = parseInt(parentData.aggravated) || 0
    let sup = parseInt(parentData.superficial) || 0

    // Left-click interaction on damage track:
    // If clicked on empty box: mark superficial damage
    if (index >= agg + sup) {
      sup = Math.min(index + 1 - agg, max - agg)
    } else if (index >= agg) {
      // Clicked on superficial box: upgrade to aggravated damage!
      if (agg < max) {
        agg += 1
        sup = Math.max(0, sup - 1)
      }
    } else {
      // Clicked on aggravated box: cycle to empty (heal 1 aggravated damage)!
      agg = Math.max(0, agg - 1)
    }

    const newValues = { superficial: sup, aggravated: agg }
    refreshCounterDOM(parent, fieldStr, newValues)
    queueActorFieldUpdate(actor, [fieldStr], newValues)
    return
  }

  if (fieldStr === 'humanity') {
    let val = parseInt(parentData.value) || 0
    let stains = parseInt(parentData.stains) || 0

    if (index >= val + stains) {
      // Clicou no vazio: adiciona mancha (marca '/')
      stains = Math.min(stains + 1, 10 - val)
    } else if (index >= val) {
      // Clicou na mancha ('/'): vira caixa colorida ('-')! Aumenta a humanidade
      const total = val + stains
      val = index + 1
      stains = Math.max(0, total - val)
    } else {
      // Clicou na caixa colorida ('-'): se for a última reduz 1, senão ajusta o valor
      if (index === val - 1) {
        val = Math.max(0, val - 1)
      } else {
        val = index + 1
      }
      stains = Math.min(stains, 10 - val)
    }

    const newValues = { value: val, stains }
    refreshCounterDOM(parent, fieldStr, newValues)
    queueActorFieldUpdate(actor, [fieldStr], newValues)
    return
  }

  // Generic / Hunter tracks (danger, desperation, despair)
  let val = parseInt(parentData.value) || 0
  if (index >= val) {
    val = index + 1
  } else if (index === val - 1) {
    val = Math.max(0, val - 1)
  } else {
    val = index + 1
  }
  const newValues = { value: val }
  refreshCounterDOM(parent, fieldStr, newValues)
  queueActorFieldUpdate(actor, [fieldStr], newValues)
}

// Function to remove square counter value at clicked index (Right-click: heal / clear directly)
export const _onRemoveSquareCounter = async function (event) {
  event.preventDefault()
  event.stopPropagation()

  const element = event.currentTarget
  const parent = element.parentNode
  const dataset = element.dataset
  const index = parseInt(dataset.index)
  const actorId = dataset.actorId || parent.dataset?.actorId
  const actor = getActor(actorId, this.actor)

  // Ensure user has permission
  if (!hasSufficientPermission(actor)) return

  const parentData = parent.dataset
  const fieldStr = (parentData.path || parentData.name || '').replace(/^system\./, '')
  const steps = parent.querySelectorAll('.resource-counter-step')
  const max = steps.length

  if (index < 0 || index >= max) return

  if (fieldStr === 'health' || fieldStr === 'willpower' || fieldStr === 'crinosHealth') {
    let agg = parseInt(parentData.aggravated) || 0
    let sup = parseInt(parentData.superficial) || 0

    if (index >= agg + sup) {
      // Right-clicked on empty: heal last superficial or aggravated
      if (sup > 0) sup -= 1
      else if (agg > 0) agg -= 1
    } else if (index >= agg) {
      // Right-clicked on superficial box: heal 1 superficial damage!
      sup = Math.max(0, sup - 1)
    } else {
      // Right-clicked on aggravated box: heal 1 aggravated damage!
      agg = Math.max(0, agg - 1)
    }

    const newValues = { superficial: sup, aggravated: agg }
    refreshCounterDOM(parent, fieldStr, newValues)
    queueActorFieldUpdate(actor, [fieldStr], newValues)
    return
  }

  if (fieldStr === 'humanity') {
    let val = parseInt(parentData.value) || 0
    let stains = parseInt(parentData.stains) || 0

    if (index >= val + stains) {
      // Botão direito no vazio: adiciona direto caixa colorida ('-') até este índice!
      val = Math.min(10, index + 1)
      stains = Math.min(stains, 10 - val)
    } else if (index >= val) {
      // Botão direito na mancha: remove a mancha!
      stains = Math.max(0, stains - 1)
    } else {
      // Botão direito na caixa colorida: reduz a humanidade em 1!
      val = Math.max(0, val - 1)
    }

    const newValues = { value: val, stains }
    refreshCounterDOM(parent, fieldStr, newValues)
    queueActorFieldUpdate(actor, [fieldStr], newValues)
    return
  }

  // Generic / Hunter tracks
  let val = parseInt(parentData.value) || 0
  val = Math.max(0, val - 1)
  const newValues = { value: val }
  refreshCounterDOM(parent, fieldStr, newValues)
  queueActorFieldUpdate(actor, [fieldStr], newValues)
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
  if (!actor?.testUserPermission?.(Loom.user.id, 3)) {
    Loom.ui?.notifications.warn(
      Loom.i18n.format('WOD5E.Notifications.NoSufficientPermission', {
        string: actor?.name ?? 'Actor'
      })
    )
    return false
  }
  return true
}

// Get the next state from the list of states (legacy compatibility)
function getNextState(allStates, currentState) {
  return allStates[(currentState + 1) % allStates.length]
}

// Reset the state of the value (legacy compatibility)
function resetState(allStates, currentState) {
  return allStates[(currentState + 1) % 1]
}

// Update state counters when the step changes (legacy compatibility)
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
    if (states[oldState]) {
      data[states[oldState]] = (parseInt(data[states[oldState]]) || 0) - 1
    }
  }

  // Adjust maximum count if the step was removed
  if (oldState !== '' && newState === '' && !humanity && !despair && !desperation && !danger) {
    if (states['-']) {
      data[states['-']] = (parseInt(data[states['-']]) || 0) - 1
    }
  }

  // Increment new state count
  if (newState !== '' && states[newState]) {
    data[states[newState]] =
      (parseInt(data[states[newState]]) || 0) + Math.max(index + 1 - fulls - halfs - crossed, 1)
  }
}

// Calculate new values for all states (legacy compatibility)
function calculateNewValue(states, data) {
  return Object.keys(states).reduce((newValue, stateKey) => {
    newValue[states[stateKey]] = parseInt(data[states[stateKey]]) || 0
    return newValue
  }, {})
}
