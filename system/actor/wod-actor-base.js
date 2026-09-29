// Data preparation functions
import { getActorHeader } from './scripts/get-actor-header.js'
import { getActorBackground } from './scripts/get-actor-background.js'
import { getActorTypes } from './scripts/get-actor-types.js'
// Actor UX functions
import { ActorUX } from './scripts/actor-ux.js'
// Roll function
import { _onRoll } from './scripts/roll.js'
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
import { _onRollItem } from './scripts/item-roll.js'
import { _onEditImage } from './scripts/on-edit-image.js'
import { _onToggleLock } from './scripts/on-toggle-lock.js'
import { _onEditSkill } from './scripts/on-edit-skill.js'
import { _onAddExperience, _onRemoveExperience, _onEditExperience } from './scripts/experience.js'
import {
  _onCreateItem,
  _onItemChat,
  _onItemOpen,
  _onItemDelete,
  _onSearchItem
} from './scripts/item-actions.js'
import { _onWillpowerRoll } from './scripts/on-willpower-roll.js'
import { _onToggleCollapse } from './scripts/on-toggle-collapse.js'
import { _onToggleLimited } from './scripts/on-toggle-limited.js'
import { _onRestoreItemUses, _onExpendItemUse } from './scripts/item-uses.js'
import {
  prepareBiographyContext,
  prepareEquipmentContext,
  prepareExperienceContext,
  prepareFeaturesContext,
  prepareLimitedContext,
  prepareNotepadContext,
  prepareSettingsContext,
  prepareSpcStatsContext,
  prepareStatsContext
} from './scripts/prepare-partials.js'
import { _onToggleConditionSuppression } from './scripts/toggle-condition-suppression.js'
import { getActorItems } from '../scripts/embedded-items.js'
// Mixin
const { LoomHandlebarsMixin } = Loom

/**
 * Extend the base ActorSheetV2 document
 * @extends {Loom.LoomActorSheet}
 */
export class WoDActorBase extends LoomHandlebarsMixin(
  Loom.LoomActorSheet
) {


  constructor(options = {}) {
    super(options)

    this._collapsibleStates = new Map()
  }

  /**
   * Post-submit flow: re-run the actor document's native prepareData
   * so re-renders keep disciplines, skills, derived calculations, etc.
   */
  async submit(options) {
    const result = await super.submit(options)
    try {
      if (this.document) {
        if (typeof this.document.prepareData === 'function') {
          await this.document.prepareData()
        } else if (typeof this.document.prepareDerivedData === 'function') {
          await this.document.prepareDerivedData()
        }
        if (typeof this.rerenderBody === 'function' && this.element?.isConnected) this.rerenderBody()
      }
    } catch (e) {
      console.error('World of Darkness 5e | Post-submit data preparation failed:', e)
    }
    return result
  }

  /**
   * Busca o documento fresco (com itens embutidos) e re-renderiza — mesmo padrão usado
   * pelo wod6e (sistema nativo, já testado) depois de criar/editar/apagar item embutido.
   * Não depende do WS reativo do core: chamada direta, determinística.
   */
  async _reloadDocument() {
    if (!this.document?.id) return
    const row = await Loom.api.get(`/actors/${this.document.id}?populate=true`)

    if (row.items && Array.isArray(row.items)) {
      this._embeddedItems = row.items
    }

    // Purga os itens desse ator da coleção global Loom.items (itens de mundo)
    // para que itens criados na ficha fiquem restritos ao ator e não apareçam na barra lateral
    if (Loom.items?.contents) {
      const itemsToPurge = Loom.items.contents.filter(
        (i) => i.actorId === this.document.id || i.parent?.id === this.document.id
      )
      for (const item of itemsToPurge) {
        Loom.items.delete(item.id)
      }
    }

    Loom.actors.delete(this.document.id)
    this.document = Loom.actors.add(row)

    // Garante que o array de itens do ator tenha o getter .system funcionando
    if (this._embeddedItems && Array.isArray(this._embeddedItems)) {
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
      this.document._embeddedItems = wrappedItems
      try {
        Object.defineProperty(this.document, 'items', {
          value: wrappedItems,
          configurable: true,
          writable: true
        })
      } catch (_) {}
    }

    if (typeof this.document.prepareData === 'function') {
      await this.document.prepareData()
    } else if (typeof this.document.prepareDerivedData === 'function') {
      await this.document.prepareDerivedData()
    }
    if (typeof this.rerenderBody === 'function' && this.element?.isConnected) this.rerenderBody()
  }

  static DEFAULT_OPTIONS = {
    form: {
      submitOnChange: true,
      handler: WoDActorBase.onSubmitActorForm
    },
    window: {
      icon: 'rpg-d10',
      resizable: true
    },
    classes: [...new Set(['wod5e', 'actor', 'sheet'])],
    position: {
      width: 1000,
      height: 800
    },
    actions: {
      // Rollable actions
      roll: _onRoll,
      willpowerRoll: _onWillpowerRoll,

      // Item actions
      createItem: _onCreateItem,
      searchItem: _onSearchItem,
      rollItem: _onRollItem,
      itemChat: _onItemChat,
      itemOpen: _onItemOpen,
      itemDelete: _onItemDelete,
      expendItemUse: _onExpendItemUse,
      restoreItemUses: _onRestoreItemUses,

      // Various other sheet functions
      dotCounterChange: _onDotCounterChange,
      dotCounterEmpty: _onDotCounterEmpty,
      editImage: _onEditImage,
      editSkill: _onEditSkill,
      toggleLock: _onToggleLock,
      toggleLimited: _onToggleLimited,
      toggleCollapse: _onToggleCollapse,
      addExperience: _onAddExperience,
      removeExperience: _onRemoveExperience,
      editExperience: _onEditExperience,
      toggleConditionSuppression: _onToggleConditionSuppression,

      // [LoomVTT Native] Tab switching handled by the sheet itself (wod6e pattern)
      tab: function (event, target) { this._onTabSelect(event, target) }
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

  tabGroups = {
    primary: 'stats'
  }

  tabs = {}

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

  get actor() {
    return this.document || this._actor || (typeof Loom !== 'undefined' && Loom.actors?.get ? Loom.actors.get(this.options?.actorId || this.actorId || this.documentId) : null)
  }

  async _prepareContext() {
    const data = await super._prepareContext()

    // LoomVTT Polyfill: Inject ApplicationV2 classes directly into the window frame
    if (this.options && Array.isArray(this.options.classes) && this.element) {
      this.options.classes.forEach(c => {
        if (c) this.element.classList.add(c);
      });
    }

    const actor = this.actor
    if (!actor) {
      console.warn('World of Darkness 5e | Actor document is not available yet for sheet:', this.id)
      return data || {}
    }

    // Carrega itens diretamente na ficha via API do ator (?populate=true)
    if (actor.id) {
      try {
        const fresh = await Loom.api.get(`/actors/${actor.id}?populate=true`)
        if (fresh && Array.isArray(fresh.items)) {
          this._embeddedItems = fresh.items
          actor._embeddedItems = fresh.items
        }
      } catch (err) {
        console.warn('World of Darkness 5e | Falha ao carregar itens direto na ficha:', err)
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

    const actorData = actor.system || actor.systemData || {}


    // Prepare tabs
    data.tabs = this.getTabs()

    // Define the data the template needs

    // Prepare items against a plain context object (the live actor's `items`
    // is a getter-only prototype property and can't be reassigned)
    await this.prepareItems({
      system: actorData,
      items: [...getActorItems(actor)]
    })

    // Actor types that can be swapped to and data prep for it
    const actorTypeData = await getActorTypes(actor)

    // Determine whether we show legacy XP depending on if the legacy values are filled or not
    const showLegacyXP = actorData.exp
      ? Number(actorData.exp.value) || Number(actorData.exp.max)
      : false

    let locked = true
    const userOwnsActor =
      true
    if (userOwnsActor) {
      locked = actorData.locked
    }

    // Transform any data needed for sheet rendering
    return {
      ...data,

      name: actor.name,
      // Mesmo fallback que o resto do Loom já usa (canvas, sidebar, actor-sheet-window
      // genérica) quando não há avatar definido — `avatarUrl` chega como string vazia
      // (não `null`), então `??` sozinho nunca caía nesse default.
      img: actor.img || actor.avatarUrl || 'icons/svg/adventurer.svg',

      health: actorData.health,
      willpower: actorData.willpower,

      settings: actorData.settings,

      hasSkillAttributeData: actorData.hasSkillAttributeData,
      gamesystem: actorData.gamesystem,
      isOwner: true,
      locked,
      showLegacyXP,

      features: actorData.features,
      equipmentItems: actorData.equipmentItems,
      customRolls: actorData.customRolls,
      conditions: actorData.conditions,
      traits: actorData.traits,

      displayBanner: Loom.settings.get('wod5e', 'actorBanner'),

      headerbg: await getActorHeader(actor),
      actorbg: actor.system?.settings?.background,

      baseActorType: actorTypeData.baseActorType,
      currentActorType: actorTypeData.currentActorType,
      currentTypeLabel: actorTypeData.currentTypeLabel,
      actorTypePath: actorTypeData.typePath,
      actorOptions: actorTypeData.types
    }
  }

  async prepareItems(sheetData) {
    // Convert live item instances to plain objects so template access to
    // `system` (a prototype getter) resolves instead of being denied.
    // `item.system` só existe como getter em instâncias vivas (`Loom.items`/`itemsCollection`);
    // itens que chegam pela atualização reativa via WS (`this.document.items`, linha do cascade
    // de `document-sheet.ts`) são objetos crus só com `.data` — sem o fallback, `system` virava
    // `undefined` e os dot-trackers (`data-value="{{item.system.points}}"`) ficavam sempre vazios
    // mesmo com o dado certo salvo no servidor.
    sheetData.items = (sheetData.items ?? []).map((item) => ({
      ...item,
      id: item.id,
      system: item.system ?? item.data
    }))

    // Make an array to store item-based modifiers
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

    // Custom rolls
    sheetData.system.customRolls = sheetData.items
      .filter((item) => item.type === 'customRoll')
      .sort(function (roll1, roll2) {
        return roll1.sort - roll2.sort
      })

    // Conditions
    sheetData.system.conditions = sheetData.items
      .filter((item) => item.type === 'condition')
      .sort(function (roll1, roll2) {
        return roll1.sort - roll2.sort
      })

    // Traits
    sheetData.system.traits = sheetData.items
      .filter((item) => item.type === 'trait')
      .sort(function (roll1, roll2) {
        return roll1.sort - roll2.sort
      })

    // Features
    sheetData.system.features = sheetData.items.reduce(
      (acc, item) => {
        if (item.type === 'feature') {
          // Assign to featuretype container, default to 'background' if unset
          const featuretype = item.system?.featuretype || 'background'
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

    // Remove Boons if we have no boons and the actor isn't a vampire
    if (sheetData.system.features.boon.length === 0 && sheetData.system.gamesystem !== 'vampire')
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

    // Remove Talismans if we have no boons and the actor isn't a werewolf
    if (
      sheetData.system.equipmentItems.talisman.length === 0 &&
      sheetData.system.gamesystem !== 'werewolf'
    )
      delete sheetData.system.equipmentItems.talisman
  }

  static async onSubmitActorForm(event, form, formData) {
    // Submit events may be synthetic (no target) when the whole form is submitted
    const target = event?.target ?? null

    // We do this because it was supported in the old system, and we still want
    // users to be able to change between character types painlessly
    if (target?.name === 'type') {
      // Maintain a copy of the old 'system' object
      const oldSystemObject = Loom.utils.deepClone(this.actor.system)

      // Update the actor type (the 'system' object must be replaced as a whole while doing this)
      await this.actor.update(
        {
          type: target.value,
          system: {}
        },
        {
          recursive: false
        }
      )

      // Ensure the actor's old data gets put back in place
      await this.actor.update({
        system: oldSystemObject
      })
    }

    // Handle odd quirks with updating special inputs or custom elements
    if (target && (target.tagName === 'INPUT' || target.tagName === 'PROSE-MIRROR')) {
      let value

      // Handle numbers and strings properly
      if (target.type === 'number') {
        value = parseInt(target.value)
      } else if (target.type === 'checkbox') {
        value = target.checked
      } else {
        value = target.value
      }

      // Make the update for the field
      this.actor.update({
        [`${target.name}`]: value
      })
    } else {
      // Process submit data, falling back to the parsed form data
      const submitData =
        typeof this._prepareSubmitData === 'function'
          ? this._prepareSubmitData(event, form, formData)
          : formData.object

      // Fallback: Manually extract prose-mirror values if they weren't caught by FormData
      if (form) {
        const proseMirrors = form.querySelectorAll('prose-mirror')
        for (const pm of proseMirrors) {
          if (pm.name && submitData[pm.name] === undefined) {
            submitData[pm.name] = pm.value
          }
        }
      }

      // Overrides
      const overrides = Loom.utils.flattenObject(this.actor.overrides ?? {})
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

      const expandedData = Loom.utils.expandObject(topLevelUpdates)
      if (topLevelUpdates.systemData) {
        expandedData.systemData = topLevelUpdates.systemData
        delete expandedData.system
      }

      // Update the actor data
      if (Object.keys(expandedData).length > 0) {
        await this.actor.update(expandedData)
      }
    }
  }

  _configureRenderOptions(options) {
    super._configureRenderOptions(options)

    // If the document is in limited view, only show the limited view;
    // otherwise, don't include the limited part
    if (this.document?.limited) {
      options.parts = ['limited']
    } else if (Array.isArray(options.parts)) {
      options.parts = options.parts.filter((item) => item !== 'limited')
    }
  }

  _preRender() {
    ActorUX._saveScrollPositions(this)
    ActorUX._saveCollapsibleStates(this)
  }

  // ─── [LoomVTT Native] Tab management (wod6e pattern) ───────────────────
  // The active tab lives on the sheet instance and is re-applied to the DOM
  // after EVERY render — rerenderBody rebuilds the HTML from scratch, so
  // nothing that lives only in the DOM survives it.
  _activeTab = null

  _onTabSelect(event, target) {
    event?.preventDefault?.()
    const tab = target?.getAttribute('data-tab')
    if (!tab) return
    const group = target?.getAttribute('data-group') || 'primary'
    this._activeTab = tab
    if (this.tabGroups[group] !== undefined) this.tabGroups[group] = tab
    this._applyActiveTab()
  }

  _applyActiveTab() {
    const root = this.element
    if (!root) return
    for (const [group, tab] of Object.entries(this.tabGroups)) {
      if (!tab) continue
      // Content sections (wod5e parts render as section.tab[data-tab])
      root.querySelectorAll(`.tab[data-group="${group}"]`).forEach((el) => {
        el.style.display = el.getAttribute('data-tab') === tab ? '' : 'none'
      })
      // Nav buttons
      root.querySelectorAll(`[data-group="${group}"][data-tab]`).forEach((el) => {
        el.classList.toggle('active', el.getAttribute('data-tab') === tab)
      })
    }
  }

  async _postRender(context, options) {
    if (typeof super._postRender === 'function') await super._postRender(context, options)
    this._applyActiveTab()
    this._wireNativeFieldSave()
  }

  // Nativo (não emula o pipeline de submit de formulário legado, que ficava
  // corrompendo o valor entre o form lido e o PUT de verdade — mesma causa raiz já resolvida
  // na ficha de item com `[data-path]`). Delegação de verdade: UM listener na raiz, anexado
  // uma única vez (guarda `_nativeFieldWired`) — igual ao padrão de discipline-item-sheet.js.
  _wireNativeFieldSave() {
    if (this._nativeFieldWired) return
    this._nativeFieldWired = true

    this.element.addEventListener(
      'wheel',
      (e) => {
        const input = e.target.closest('input[type="number"]')
        if (!input || input.disabled || input.readOnly) return
        e.preventDefault()

        const step = Number(input.step) || 1
        const min = input.min !== '' ? Number(input.min) : 0
        const max = input.max !== '' ? Number(input.max) : Infinity
        const current = input.value === '' ? 0 : (Number(input.value) || 0)
        const delta = e.deltaY < 0 ? step : -step
        let next = current + delta
        if (next < min) next = min
        if (next > max) next = max

        if (next !== current || input.value === '') {
          input.value = next
          input.dispatchEvent(new Event('change', { bubbles: true }))
        }
      },
      { passive: false }
    )

    this.element.addEventListener('change', async (e) => {
      const input = e.target
      // Contadores de recurso, disciplinas etc. já têm seu próprio `data-action` dedicado.
      // `<prose-mirror>` NÃO se salva sozinho — o comentário antigo aqui presumia um pipeline
      // de submit legado (já removido), então o texto nunca era persistido. O
      // elemento dispara `change` de verdade (bubbles+composed) com `.value` funcionando.
      if (input.hasAttribute('data-action')) return
      // O navegador dispara `change` nativo num input FOCADO e "sujo" no instante em que
      // ele é removido do DOM (re-render trocando o body enquanto o usuário ainda digitava)
      // — não é o usuário confirmando nada, é o próprio re-render. Sem este guard, salvar
      // esse "change" fantasma disparava outro broadcast → outro re-render → outro "change"
      // fantasma, sem parar, até o disjuntor de loop do servidor cortar.
      if (!input.isConnected) return

      const path = input?.getAttribute?.('data-path')
      // Campo do nome do ator (cabeçalho, `name="name"`) — propriedade própria do
      // documento, fora de `system`, vai direto sem passar pelo patch abaixo.
      if (!path) {
        if (input.getAttribute('name') !== 'name') return
        const newName = String(input.value || '').trim()
        if (!newName) return
        await this.actor.update({ name: newName })
        return
      }

      const value = input.type === 'checkbox'
        ? input.checked
        : (input.type === 'number' ? (Number(input.value) || 0) : input.value)

      // Aplica local na hora (a UI já reflete o valor digitado de qualquer forma) mas
      // atrasa o PUT de verdade — preencher vários campos rápido (tab entre eles) disparava
      // um `actor.update()` por campo, e mais de 3 num segundo esbarrava no disjuntor de
      // loop do servidor (mutation-loop-guard, pensado pra cortar loop de render/WS, não
      // pra bloquear preenchimento legítimo de ficha). `this.actor.systemData` reassinado
      // na hora garante que a PRÓXIMA tecla/campo parta do valor certo mesmo com o envio
      // ainda pendente.
      const systemData = applySystemPatch(this.actor.systemData, [[path.split('.'), value]])
      this.actor.systemData = systemData
      this._scheduleActorSave()
    })
  }

  _scheduleActorSave() {
    clearTimeout(this._saveDebounceTimer)
    this._saveDebounceTimer = setTimeout(() => {
      this.actor.update({ systemData: this.actor.systemData }).catch((err) => {
        console.error('World of Darkness 5e | Falha ao salvar ficha:', err)
      })
    }, 400)
  }

  async _onRender() {
    const html = this.element

    // Update the window title (since ActorSheetV2 doesn't do it automatically)
    this.window.title.textContent = this.title

    // Initialize custom prose-mirror elements (LoomVTT core requires .document for enrichment)
    const proseMirrors = html.querySelectorAll('prose-mirror')
    proseMirrors.forEach(pm => {
      pm.document = this.actor
      const btn = pm.querySelector('button.editor-edit, button.toggle, button')
      if (btn) btn.title = Loom.i18n?.localize ? Loom.i18n.localize('WOD5E.Edit') : 'Editar'
    })

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

        const filepicker = event?.target?.parentElement
        const value = event?.target?.value

        filepicker.value = value
      })
    })

    html.querySelectorAll('.actor-background-filepicker input').forEach((input) => {
      input.addEventListener('focusout', function (event) {
        event.preventDefault()

        const filepicker = event?.target?.parentElement
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

    // Drag and drop: `Application.wireDragDrop()` (core, application.ts) já lê
    // `this.options.dragDrop` e liga `_onDrop`/`_onDragStart`/etc automaticamente
    // a cada render — bindar de novo aqui manualmente criava um SEGUNDO listener
    // idêntico no mesmo elemento, e um único drop físico disparava `_onDrop` 2x
    // (3x contando o globalDragDrop genérico de LoomDocumentSheet), criando itens
    // duplicados e, por causa da corrida entre os dois, falhando às vezes (o
    // listener que "ganhava a corrida" podia pegar o dataTransfer ainda vazio).

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
    // Um único drop físico dispara `handleDrop` mais de uma vez — a janela tem
    // mais de um LoomDragDrop escutando 'drop' no mesmo elemento (o genérico de
    // LoomDocumentSheet + o próprio #dragDrop deste sheet), e todos chamam este
    // `_onDrop` (herdado/sombreado no mesmo `this`). Resultado: um item arrastado
    // do compêndio virava 2-3 itens criados de verdade no banco. O evento nativo
    // é o MESMO objeto em toda chamada pra um único drop — marcar nele trava a
    // duplicação na entrada, não importa quantos listeners existam por trás.
    if (event.__loomItemDropHandled) return
    event.__loomItemDropHandled = true

    const data = Loom.applications.ux.getDragEventData(event)

    // Handle different data types
    switch (data.type) {
      case 'Item': {
        const result = await ActorUX._onDropItem(event, this.actor, data)
        // `_onDropItemCreate` cria o item via REST (createEmbeddedItems) mas não
        // re-renderiza a ficha sozinho — sem isso, o item existe no banco mas some
        // da tela até o próximo re-render por outro motivo qualquer (parecia que
        // o drop "não ia", então cada nova tentativa criava outro item duplicado).
        await this._reloadDocument()
        return result
      }
    }
  }

  prepareStatsContext(context, actor) {
    return prepareStatsContext(context, actor)
  }

  prepareExperienceContext(context, actor) {
    return prepareExperienceContext(context, actor)
  }

  prepareFeaturesContext(context, actor) {
    return prepareFeaturesContext(context, actor)
  }

  prepareEquipmentContext(context, actor) {
    return prepareEquipmentContext(context, actor)
  }

  prepareBiographyContext(context, actor) {
    return prepareBiographyContext(context, actor)
  }

  prepareNotepadContext(context, actor) {
    return prepareNotepadContext(context, actor)
  }

  prepareSettingsContext(context, actor) {
    return prepareSettingsContext(context, actor)
  }

  prepareLimitedContext(context, actor) {
    return prepareLimitedContext(context, actor)
  }

  prepareSpcStatsContext(context, actor) {
    return prepareSpcStatsContext(context, actor)
  }
}
