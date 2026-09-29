// Preparation functions
import { getActorHeader } from './scripts/get-actor-header.js'
import { getActorBackground } from './scripts/get-actor-background.js'
import { getActorTypes } from './scripts/get-actor-types.js'
// Actor UX functions
import { ActorUX } from './scripts/actor-ux.js'
// Resource functions
import {
  _onResourceChange,
  _setupDotCounters,
  _setupSquareCounters,
  _onDotCounterChange,
  _onDotCounterEmpty,
  _onSquareCounterChange,
  _onRemoveSquareCounter,
  applySystemPatch
} from './scripts/counters.js'
// Various button functions
import { _onEditImage } from './scripts/on-edit-image.js'
import { _onToggleLock } from './scripts/on-toggle-lock.js'
import { getActorItems } from '../scripts/embedded-items.js'
import {
  _onCreateItem,
  _onItemChat,
  _onItemOpen,
  _onItemDelete,
  _onSearchItem
} from './scripts/item-actions.js'
import { _onToggleCollapse } from './scripts/on-toggle-collapse.js'
import { _addActor, _openActorSheet, _removeActor } from './scripts/group-members.js'
import {
  prepareGroupFeaturesContext,
  prepareEquipmentContext,
  prepareNotepadContext,
  prepareSettingsContext,
  prepareGroupMembersContext
} from './scripts/prepare-partials.js'
// Mixin
const { LoomHandlebarsMixin } = Loom

/**
 * Extend the ActorSheetV2 document
 * @extends {ActorSheetV2}
 */
export class GroupActorSheet extends LoomHandlebarsMixin(
  Loom.LoomActorSheet
) {
  get title() {
    return this.actor.isToken ? `[Token] ${this.actor.name}` : this.actor.name
  }

  constructor(options = {}) {
    super(options)

    this._collapsibleStates = new Map()
  }

  static DEFAULT_OPTIONS = {
    form: {
      submitOnChange: true,
      handler: GroupActorSheet.onSubmitActorForm
    },
    window: {
      icon: 'rpg-d10',
      resizable: true
    },
    classes: ['wod5e', 'actor', 'group', 'sheet'],
    position: {
      width: 700,
      height: 600
    },
    actions: {
      // Item actions
      createItem: _onCreateItem,
      searchItem: _onSearchItem,
      itemChat: _onItemChat,
      itemOpen: _onItemOpen,
      itemDelete: _onItemDelete,

      // Members functions
      openActorSheet: _openActorSheet,
      removeMember: _removeActor,

      // Various other sheet functions
      dotCounterChange: _onDotCounterChange,
      dotCounterEmpty: _onDotCounterEmpty,
      editImage: _onEditImage,
      toggleLock: _onToggleLock,
      toggleCollapse: _onToggleCollapse
    },
    dragDrop: [
      {
        dragSelector: '[data-drag]',
        dropSelector: null
      }
    ]
  }

  _getHeaderControls() {
    const controls = super._getHeaderControls()

    return controls
  }

  static PARTS = {
    header: {
      template: 'marketplace/rulesets/wod5e/display/shared/actors/group-sheet.hbs'
    },
    tabs: {
      template: 'marketplace/rulesets/wod5e/display/shared/actors/parts/tab-navigation.hbs'
    },
    members: {
      template: 'marketplace/rulesets/wod5e/display/shared/actors/parts/group/group-members.hbs'
    },
    features: {
      template: 'marketplace/rulesets/wod5e/display/shared/actors/parts/group/features.hbs'
    },
    equipment: {
      template: 'marketplace/rulesets/wod5e/display/shared/actors/parts/equipment.hbs'
    },
    notepad: {
      template: 'marketplace/rulesets/wod5e/display/shared/actors/parts/notepad.hbs'
    },
    settings: {
      template: 'marketplace/rulesets/wod5e/display/shared/actors/parts/actor-settings.hbs'
    },
    banner: {
      template: 'marketplace/rulesets/wod5e/display/shared/actors/parts/type-banner.hbs'
    }
  }

  tabGroups = {
    primary: 'members'
  }

  tabs = {
    members: {
      id: 'members',
      group: 'primary',
      title: 'WOD5E.Tabs.Members',
      icon: '<i class="fa-solid fa-person"></i>'
    },
    features: {
      id: 'features',
      group: 'primary',
      title: 'WOD5E.Tabs.Features',
      icon: '<i class="fas fa-gem"></i>'
    },
    equipment: {
      id: 'equipment',
      group: 'primary',
      title: 'WOD5E.Tabs.Equipment',
      icon: '<i class="fa-solid fa-toolbox"></i>'
    },
    notepad: {
      id: 'notepad',
      group: 'primary',
      title: 'WOD5E.Tabs.Notes',
      icon: '<i class="fas fa-sticky-note"></i>'
    },
    settings: {
      id: 'settings',
      group: 'primary',
      title: 'WOD5E.Tabs.Settings',
      icon: '<i class="fa-solid fa-gears"></i>'
    }
  }

  getTabs() {
    const tabs = this.tabs

    // Remove hidden tabs
    for (const key in tabs) {
      if (tabs[key].hidden) delete tabs[key]
    }

    for (const tab of Object.values(tabs)) {
      tab.active = this.tabGroups[tab.group] === tab.id
      tab.cssClass = tab.active ? 'active' : ''
    }

    return tabs
  }

  async _prepareContext() {
    // Top-level variables
    const data = await super._prepareContext()
    const actor = this.actor
    if (!actor) return data || {}

    // Carrega itens diretamente na ficha via API do ator (?populate=true)
    if (actor.id) {
      try {
        const fresh = await Loom.api.get(`/actors/${actor.id}?populate=true`)
        if (fresh && Array.isArray(fresh.items)) {
          this._embeddedItems = fresh.items
          actor._embeddedItems = fresh.items
        }
      } catch (err) {
        console.warn('World of Darkness 5e | Falha ao carregar itens direto na ficha do grupo:', err)
      }
    }

    if (this._embeddedItems) {
      const wrappedItems = this._embeddedItems.map((item) => {
        if (!item.system && (item.systemData || item.data)) {
          return new Proxy(item, {
            get(target, prop, receiver) {
              if (prop === 'system') return target.systemData ?? target.data ?? {}
              return Reflect.get(target, prop, receiver)
            }
          })
        }
        return item
      })
      this._embeddedItems = wrappedItems
      actor._embeddedItems = wrappedItems
      try {
        Object.defineProperty(actor, 'items', {
          value: wrappedItems,
          configurable: true,
          writable: true
        })
      } catch (_) {}
    }

    const actorData = actor.system

    // Prepare tabs
    data.tabs = this.getTabs()

    // Define the data the template needs

    // Prepare items against a plain context object (the live actor's `items`
    // is a getter-only prototype property and can't be reassigned).
    // `getActorItems()` em vez de `actor.items` cru — este último às vezes devolve
    // rows sem o acessor `.system` hidratado (mesma causa já corrigida em
    // gifts.js/disciplines.js/edges.js), e `item.system.featuretype` em
    // `prepareItems` estourava "Cannot read properties of undefined" ao abrir
    // qualquer Group com itens/membros.
    await this.prepareItems({
      system: actorData,
      items: getActorItems(actor)
    })

    // Actor types that can be swapped to and data prep for it
    const actorTypeData = await getActorTypes(actor)

    // Handle figuring out hunting difficulty
    if (actorData.groupType === 'coterie') {
      data.huntingDifficulty = 7 - actorData.chasse.value
    }

    // Handle defining out the guiding spirit
    if (actorData.groupType === 'pack') {
      // Filters for the guiding spirit item, if one xists
      // `getActorItems()` em vez de `actor.items` — mesma causa já corrigida em
      // vampire-actor-sheet.js: itens da atualização reativa via WS não têm `.system`.
      const guidingSpiritFilter = getActorItems(actor).filter((item) => item.type === 'guidingspirit')

      data.guidingSpirit = guidingSpiritFilter[0]
    }

    let locked = true
    const userOwnsActor =
      actor?.testUserPermission(Loom.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER) ?? false
    if (userOwnsActor) {
      locked = actorData.locked
    }

    // Transform any data needed for sheet rendering
    return {
      ...data,

      name: actor.name,
      // Mesmo fallback já aplicado em wod-actor-base.js — sem isto o grupo nascia sem
      // nenhum retrato (nem o padrão), `avatarUrl` vem como string vazia, não `null`.
      img: actor.img || actor.avatarUrl || 'icons/svg/adventurer.svg',

      settings: actorData.settings,

      isOwner: true,
      locked,

      features: actorData.features,

      displayBanner: Loom.settings.get('wod5e', 'actorBanner'),

      headerbg: await getActorHeader(actor),
      actorbg: actor.system?.settings?.background,

      baseActorType: actorTypeData.baseActorType,
      currentActorType: actorTypeData.currentActorType,
      currentTypeLabel: actorTypeData.currentTypeLabel,
      actorTypePath: actorTypeData.typePath,
      actorOptions: actorTypeData.types,

      chasse: actorData.chasse,
      lien: actorData.lien,
      portillon: actorData.portillon,

      desperation: actorData.desperation,
      danger: actorData.danger,

      territory: actorData.territory,
      community: actorData.community,
      spirit: actorData.spirit
    }
  }

  async prepareItems(sheetData) {
    // Convert live item instances to plain objects so template access to
    // `system` (a prototype getter) resolves instead of being denied
    sheetData.items = (sheetData.items ?? []).map((item) => ({
      ...item,
      id: item.id,
      system: item.system
    }))

    // Make an array to store item-based modifiers
    // These are not currently used in group sheets because group sheets
    // do not roll anything.
    sheetData.system.itemModifiers = []

    // Do data manipulation we need to do for ALL items here
    sheetData.items.forEach(async (item) => {
      // Enrich item descriptions
      if (item.system?.description) {
        item.system.enrichedDescription =
          await Loom.applications.ux.TextEditor.implementation.enrichHTML(
            item.system.description
          )
      }

      // Calculate item modifiers and shuffle them into system.itemModifiers
      if (!Loom.utils.isEmpty(item.system?.bonuses) && !item?.system?.suppressed) {
        sheetData.system.itemModifiers = sheetData.system.itemModifiers.concat(item.system.bonuses)
      }
    })

    // Features
    sheetData.system.features = sheetData.items.reduce(
      (acc, item) => {
        if (item.type === 'feature') {
          // Assign to featuretype container, default to 'background' if unset
          const featuretype = item.system.featuretype || 'background'
          if (acc[featuretype]) {
            acc[featuretype].push(item)
          } else {
            // Create new array if it doesn't exist
            acc[featuretype] = [item]
          }
        } else if (item.type === 'boon') {
          acc.boon.push(item)
        }

        return acc
      },
      {
        // Containers for features
        background: [],
        merit: [],
        flaw: [],
        boon: []
      }
    )

    // Remove Boons if we have no boons and the actor isn't a coterie
    if (sheetData.system.features.boon.length === 0 && sheetData.system.groupType !== 'coterie')
      delete sheetData.system.features.boon

    // Equipment
    sheetData.system.equipmentItems = sheetData.items.reduce(
      (acc, item) => {
        switch (item.type) {
          case 'armor':
            acc.armor.push(item)
            break
          case 'weapon':
            acc.weapon.push(item)
            break
          case 'gear':
            acc.gear.push(item)
            break
          case 'talisman':
            acc.talisman.push(item)
            break
        }

        return acc
      },
      {
        // Containers for equipment
        armor: [],
        weapon: [],
        gear: [],
        talisman: []
      }
    )

    // Remove Talismans if we have no boons and the group type is not a pack
    if (
      sheetData.system.equipmentItems.talisman.length === 0 &&
      sheetData.system.groupType !== 'pack'
    )
      delete sheetData.system.equipmentItems.talisman
  }

  async _preparePartContext(partId, context, options) {
    // Inherit any preparation from the extended class
    context = { ...(await super._preparePartContext(partId, context, options)) }

    // Top-level variables
    const actor = this.actor

    // Prepare each page context
    switch (partId) {
      // Group members
      case 'members':
        return prepareGroupMembersContext(context, actor)

      // Features
      case 'features':
        return prepareGroupFeaturesContext(context, actor)

      // Equipment
      case 'equipment':
        return prepareEquipmentContext(context, actor)

      // Notepad
      case 'notepad':
        return prepareNotepadContext(context, actor)

      // Settings
      case 'settings':
        return prepareSettingsContext(context, actor)
    }

    return context
  }

  static async onSubmitActorForm(event, form, formData) {
    // Process submit data
    const submitData =
      typeof this._prepareSubmitData === 'function'
        ? this._prepareSubmitData(event, form, formData)
        : (formData?.object || formData || {})

    // Overrides
    const overrides = Loom.utils.flattenObject(this.actor?.overrides ?? {})
    for (const k of Object.keys(overrides)) delete submitData[k]

    // Converter qualquer chave 'system.*' para 'systemData' para compatibilidade nativa LoomVTT
    const systemPatches = []
    const topLevelUpdates = {}

    for (const [key, val] of Object.entries(submitData)) {
      if (key.startsWith('system.')) {
        const path = key.replace(/^system\./, '').split('.')
        systemPatches.push([path, val])
      } else if (key === 'system' && typeof val === 'object' && val !== null) {
        for (const [subKey, subVal] of Object.entries(Loom.utils.flattenObject(val))) {
          systemPatches.push([subKey.split('.'), subVal])
        }
      } else {
        topLevelUpdates[key] = val
      }
    }

    if (systemPatches.length > 0) {
      topLevelUpdates.systemData = applySystemPatch(this.actor.systemData, systemPatches)
    }

    // Update the actor data
    if (Object.keys(topLevelUpdates).length > 0) {
      await this.actor.update(topLevelUpdates)
    }
  }

  _preRender() {
    ActorUX._saveScrollPositions(this)
    ActorUX._saveCollapsibleStates(this)
  }

  async _onRender() {
    const html = this.element

    // Update the window title (since ActorSheetV2 doesn't do it automatically)
    this.window.title.textContent = this.title

    // Update the actor background if it's not the default
    const actorBackground = await getActorBackground(this.actor)
    if (actorBackground) {
      html.querySelector('section.window-content').style.background = `url("${actorBackground}")`
    } else {
      html.querySelector('section.window-content').style.background = ''
    }

    html.querySelectorAll('.actor-header-bg-filepicker input').forEach((input) => {
      input.addEventListener('focusout', function (event) {
        event.preventDefault()

        const filepicker = event.target.parentElement
        const value = event?.target?.value

        filepicker.value = value
      })
    })

    html.querySelectorAll('.actor-background-filepicker input').forEach((input) => {
      input.addEventListener('focusout', function (event) {
        event.preventDefault()

        const filepicker = event.target.parentElement
        const value = event?.target?.value

        filepicker.value = value
      })
    })

    // Toggle whether the sheet is locked or not
    if (this.actor.system.locked) {
      html.classList.add('locked')
    } else {
      html.classList.remove('locked')
    }

    // Resource square counters
    html.querySelectorAll('.resource-counter.editable .resource-counter-step').forEach((el) => {
      el.addEventListener('click', _onSquareCounterChange.bind(this))
      el.addEventListener('contextmenu', _onRemoveSquareCounter.bind(this))
    })
    html.querySelectorAll('.resource-plus').forEach((el) => {
      el.addEventListener('click', _onResourceChange.bind(this))
    })
    html.querySelectorAll('.resource-minus').forEach((el) => {
      el.addEventListener('click', _onResourceChange.bind(this))
    })

    // Activate the setup for the counters
    _setupDotCounters(html)
    _setupSquareCounters(html)

    // Add a new sheet styling depending on the type of sheet
    const groupType = this.actor.system.groupType
    if (groupType === 'coterie') {
      html.classList.remove('hunter', 'werewolf', 'mortal')
      html.classList.add('vampire')
    } else if (groupType === 'cell') {
      html.classList.remove('vampire', 'werewolf', 'mortal')
      html.classList.add('hunter')
    } else if (groupType === 'pack') {
      html.classList.remove('hunter', 'vampire', 'mortal')
      html.classList.add('werewolf')
    } else {
      // Default to mortal styling
      html.classList.remove('hunter', 'vampire', 'werewolf')
      html.classList.add('mortal')
    }

    // Listener para o seletor de tipo de grupo (Coterie, Célula, Alcateia)
    html.querySelectorAll('.actor-type-selector').forEach((select) => {
      select.addEventListener('change', async (event) => {
        event.preventDefault()
        event.stopPropagation()
        const newGroupType = event.target.value
        if (!newGroupType) return

        const systemData = applySystemPatch(this.actor.systemData, [[['groupType'], newGroupType]])
        await this.actor.update({ systemData })
      })
    })

    // Drag and drop: `Application.wireDragDrop()` (core) já lê `this.options.dragDrop`
    // e liga `_onDrop`/etc automaticamente a cada render — bindar de novo aqui manualmente
    // criava um SEGUNDO listener idêntico no mesmo elemento (mesmo bug corrigido em
    // wod-actor-base.js: um único drop físico disparava `_onDrop` mais de uma vez).

    // Keep scroll positions from resetting on sheet update
    ActorUX._restoreScrollPositions(this)
    ActorUX._restoreCollapsibleStates(this)
  }

  _canDragStart() {
    return this.isEditable
  }

  _canDragDrop() {
    return this.isEditable
  }

  _onDragStart(event) {
    const dataset = event.target.dataset
    if ('link' in dataset) return

    // Extract the data you need
    const dragData = {
      type: dataset.type,
      uuid: dataset.documentUuid
    }

    if (!dragData) return

    // Set data transfer
    event.dataTransfer.setData('text/plain', JSON.stringify(dragData))
  }

  _onDragOver() {}

  async _onDrop(event) {
    const data = Loom.applications.ux.getDragEventData(event)

    // Handle different data types
    switch (data.type) {
      case 'Item':
        return ActorUX._onDropItem(event, this.actor, data)
      case 'Actor':
        return _addActor(this.actor, data.uuid)
    }
  }
}

// Handle actor updates
Loom.LoomHooks.on('actor.updated', (actor) => {
  // `Loom.actors.render()` não existe
  // no LoomVTT (`Loom.actors` é só a coleção, sem método de UI) e estourava
  // "Loom.actors.render is not a function" a cada update de um Group. A sidebar já
  // se re-renderiza sozinha ao receber `actor.updated` via WS (`sidebar.ts`), então
  // a chamada também era redundante, não só quebrada.

  // Only do this if the actor has an associated group with them
  if (actor.system?.group) {
    // Update the group sheet
    Loom.actors.get(actor.system.group)?.sheet?.render()
  }
})
