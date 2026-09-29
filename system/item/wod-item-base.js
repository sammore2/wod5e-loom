import { getDicepoolList } from '../api/dicepool-list.js'
import { getSelectorsList } from '../api/get-selectors-list.js'
// Various button functions
import { _onAddModifier, _onDeleteModifier, _onEditModifier } from './scripts/item-modifiers.js'
import { _onAddDice, _onRemoveDice } from './scripts/dicepools.js'
import { _onEditImage } from './scripts/on-edit-image.js'
import { _onFormatDataId } from './scripts/on-format-data-id.js'
import { _onSyncFromDataItem, _onSyncToDataItems } from './scripts/item-syncing.js'
import { updateItemData } from '../scripts/embedded-items.js'
import { normalizeUpdate } from '../scripts/document-updates.js'
// Mixin
const { LoomHandlebarsMixin } = Loom

/**
 * Extend the base ItemSheetV2 document
 * @extends {Loom.LoomItemSheet}
 */
export class WoDItemBase extends LoomHandlebarsMixin(
  Loom.LoomItemSheet
) {
  constructor(options = {}) {
    super(options)
  }

  static DEFAULT_OPTIONS = {
    window: {
      icon: 'rpg-d10',
      resizable: true
    },
    classes: ['wod5e', 'item', 'sheet'],
    position: {
      width: 530,
      height: 400
    },
    actions: {
      addDice: _onAddDice,
      removeDice: _onRemoveDice,
      addModifier: _onAddModifier,
      deleteModifier: _onDeleteModifier,
      editModifier: _onEditModifier,
      editImage: _onEditImage,
      formatDataId: _onFormatDataId,
      syncFromDataItem: _onSyncFromDataItem,
      syncToDataItems: _onSyncToDataItems,

      // [LoomVTT Native] Tab switching handled by the sheet itself (wod6e pattern)
      tab: function (event, target) { this._onTabSelect(event, target) }
    }
  }

  // ─── [LoomVTT Native] Tab management (wod6e pattern) ───────────────────
  // Active tab lives on the instance and is re-applied after every render.
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
      root.querySelectorAll(`.tab[data-group="${group}"]`).forEach((el) => {
        el.style.display = el.getAttribute('data-tab') === tab ? '' : 'none'
      })
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

  // Nativo — salva direto em `data.*` a partir de `[data-path]`, sem passar por nenhum pipeline
  // de submit legado. Delegação de verdade: UM
  // listener na raiz, anexado uma única vez (guarda `_dataPathWired`). Vale pras 20 fichas
  // de item que estendem esta base — a maioria dos templates (`source.hbs`, `macro.hbs`,
  // `item-uses.hbs`, `weapon-settings.hbs`, etc.) já usa `data-path`, só faltava isto.
  _wireNativeFieldSave() {
    if (this._dataPathWired) return
    this._dataPathWired = true

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
      if (input.hasAttribute('data-action')) return
      // `<prose-mirror>` dispara `change` de verdade (bubbles+composed) com `.value`
      // funcionando via getter — não precisa mais de exclusão aqui. Antes dependia de um
      // pipeline de submit legado (já removido), então o texto nunca salvava.
      // Ver o mesmo guard em wod-actor-base.js: `change` nativo disparado pelo navegador
      // ao remover um input focado/sujo durante um re-render — não é o usuário, é o
      // próprio re-render. Sem isto, salvar esse "change" fantasma realimentava outro
      // broadcast → outro re-render → outro fantasma, até o disjuntor de loop cortar.
      if (!input.isConnected) return

      const id = this.document?.id
      if (!id) return

      const path = input?.getAttribute?.('data-path')
      // Campo do nome do item (cabeçalho, `name="name"`) — é propriedade própria do
      // documento, não fica dentro de `data`, então vai direto sem passar pelo merge abaixo.
      if (!path) {
        if (input.getAttribute('name') !== 'name') return
        const newName = String(input.value || '').trim()
        if (!newName) return
        const updated = await Loom.api.put(`/items/${id}`, { name: newName })
        Loom.items?.add?.(updated)
        await this._reloadDocument?.()
        return
      }

      const value = input.type === 'checkbox'
        ? input.checked
        : (input.type === 'number' ? (Number(input.value) || 0) : input.value)

      const data = { ...(this.document?.data || {}) }
      const parts = path.split('.')
      let cur = data
      for (let i = 0; i < parts.length - 1; i++) {
        cur = cur[parts[i]] ??= {}
      }
      cur[parts[parts.length - 1]] = value

      const updated = await Loom.api.put(`/items/${id}`, { data })
      Loom.items?.add?.(updated)
      await this._reloadDocument?.()
    })
  }

  _getHeaderControls() {
    const controls = super._getHeaderControls()
    const item = this.document

    if (item?.actorId || item?.parent?.id) {
      // Allow this item to have its item updated from an existing data item
      controls.push({
        icon: 'fa-solid fa-down-long',
        label: 'WOD5E.ItemsList.SyncFromDataItem',
        action: 'syncFromDataItem'
      })
    } else {
      // Allow this item to update all data items
      controls.push({
        icon: 'fa-solid fa-up-long',
        label: 'WOD5E.ItemsList.SyncToDataItems',
        action: 'syncToDataItems'
      })
    }

    return controls
  }

  tabGroups = {
    primary: 'description'
  }

  getTabs() {
    const tabs = this.tabs

    // Remove hidden tabs
    for (const key in tabs) {
      if (tabs[key].hidden) delete tabs[key]
    }

    for (const tab of Object.values(tabs)) {
      tab.active = (this._activeTab || this.tabGroups[tab.group]) === tab.id
      tab.cssClass = tab.active ? 'active' : ''
    }

    return tabs
  }

  async _prepareContext() {
    // Top-level variables
    const data = await super._prepareContext()
    const item = this.document
    const actor = this.actor
    const itemData = item.system

    // Prepare tabs
    data.tabs = this.getTabs()

    // Define the data the template needs
    itemData.gamesystem = actor ? actor?.system?.gamesystem : itemData.gamesystem

    // Determine whether the item is locked from the user or not based on permissions
    let locked = true
    if (actor) {
      // Here, we check if the user owns the actor (if there is a actor as the item's parent)
      // If so, go by the actor's locked state
      const userOwnsActor =
        actor?.testUserPermission(Loom.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER) ?? false

      if (userOwnsActor) {
        locked = actor?.system?.locked
      }
    } else {
      // Here, we're checking if the user owns the item (in the case the item has no parent actor)
      // If the user can edit the item, we set locked to false
      const userCanEditItem =
        item?.testUserPermission(Loom.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER) ?? false

      if (userCanEditItem) {
        locked = false
      }
    }

    const effectiveSystem = itemData

    // Transform any data needed for sheet rendering
    return {
      ...data,

      name: item.name,
      // Loom chama esse campo `imgUrl` (não `img`, convenção do sistema original) — o template lia
      // sempre undefined, então a imagem nunca aparecia mesmo depois de trocar e salvar certo.
      img: item.imgUrl,

      locked,

      diceOptions: await getDicepoolList(item),

      gamesystem: effectiveSystem.gamesystem || 'mortal',

      // Expose effectiveSystem for sub-sheets to consume
      _effectiveSystem: effectiveSystem,

      dataItemId: item?.flags?.wod5e?.dataItemId || '',

      sourcebook: item.system.source.book,
      pageNumber: item.system.source.page
    }
  }










  // `onRender` (sem underscore) — nome que o core do Loom de fato chama em
  // `rerenderBody()` (`this.onRender?.()`). O nome antigo `_onRender` (convenção
  // sistema original) nunca executava aqui: classe CSS vampire/hunter/mortal nunca aplicava,
  // flexdatalist nunca inicializava, `pm.document` nunca era setado.
  onRender() {
    const html = this.element

    // Update the window title (since ItemSheetV2 doesn't do it automatically)
    this.window.title.textContent = this.title

    // Initialize custom prose-mirror elements (LoomVTT core requires .document for enrichment)
    const proseMirrors = html.querySelectorAll('prose-mirror')
    proseMirrors.forEach(pm => {
      pm.document = this.document
      const btn = pm.querySelector('button.editor-edit, button.toggle, button')
      if (btn) btn.title = Loom.i18n?.localize ? Loom.i18n.localize('WOD5E.Edit') : 'Editar'
    })

    // Style the selectors properly
    const data = getSelectorsList()

    // Initialize flexdataset for each input
    const selectorInputs = html.querySelectorAll('.modifier-selectors')
    selectorInputs.forEach(function (element) {
      $(element).flexdatalist({
        selectionRequired: 1,
        minLength: 1,
        searchIn: ['displayName'],
        multiple: true,
        valueProperty: 'id',
        searchContain: true,
        data
      })
    })

    // Add a new sheet styling depending on the type of sheet
    const system = this.document.system || this.document.data || {}
    const actorSystem = this.document.parent?.system || this.document.parent?.systemData || {}
    const gamesystem = system.gamesystem || actorSystem.gamesystem || 'mortal'
    if (gamesystem === 'vampire') {
      html.classList.remove('hunter', 'werewolf', 'mortal')
      html.classList.add('vampire')
    } else if (gamesystem === 'hunter') {
      html.classList.remove('vampire', 'werewolf', 'mortal')
      html.classList.add('hunter')
    } else if (gamesystem === 'werewolf') {
      html.classList.remove('hunter', 'vampire', 'mortal')
      html.classList.add('werewolf')
    } else {
      // Default to a mortal sheet
      html.classList.remove('hunter', 'vampire', 'werewolf')
      html.classList.add('mortal')
    }
  }
}
