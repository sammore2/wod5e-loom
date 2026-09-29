// Preparation functions
import {
  prepareDescriptionContext,
  prepareDicepoolContext,
  prepareMacroContext,
  prepareModifiersContext,
  prepareItemSettingsContext
} from '../scripts/prepare-partials.js'
import { Disciplines } from '../../api/def/disciplines.js'
// Base item sheet to extend from
import { WoDItemBase } from '../wod-item-base.js'
// Mixin
const { LoomHandlebarsMixin } = Loom

/**
 * Extend the WoDItemBase document
 * @extends {WoDItemBase}
 */
export class DisciplineItemSheet extends LoomHandlebarsMixin(WoDItemBase) {
  static DEFAULT_OPTIONS = {
    classes: ['wod5e', 'item', 'sheet'],
    actions: {}
  }

  static PARTS = {
    header: {
      template: 'marketplace/rulesets/wod5e/display/vtm/items/discipline-sheet.hbs'
    },
    tabs: {
      template: 'marketplace/rulesets/wod5e/display/shared/items/parts/tab-navigation.hbs'
    },
    description: {
      template: 'marketplace/rulesets/wod5e/display/shared/items/parts/description.hbs'
    },
    dicepool: {
      template: 'marketplace/rulesets/wod5e/display/shared/items/parts/dicepool.hbs'
    },
    macro: {
      template: 'marketplace/rulesets/wod5e/display/shared/items/parts/macro.hbs'
    },
    modifiers: {
      template: 'marketplace/rulesets/wod5e/display/shared/items/parts/modifiers.hbs'
    },
    settings: {
      template: 'marketplace/rulesets/wod5e/display/shared/items/parts/item-settings.hbs'
    }
  }

  get tabs() {
    return {
      description: {
        id: 'description',
        group: 'primary',
        label: 'WOD5E.Tabs.Description'
      },
      dicepool: {
        id: 'dicepool',
        group: 'primary',
        label: 'WOD5E.Tabs.Dicepool',
        hidden: this.document?.parent?.type === 'spc'
      },
      macro: {
        id: 'macro',
        group: 'primary',
        label: 'WOD5E.Tabs.Macro'
      },
      modifiers: {
        id: 'modifiers',
        group: 'primary',
        label: 'WOD5E.ItemsList.Modifiers'
      },
      settings: {
        id: 'settings',
        group: 'primary',
        label: 'WOD5E.ItemsList.ItemSettings'
      }
    }
  }

  async _prepareContext() {
    // Top-level variables
    const data = await super._prepareContext()
    const item = this.item

    const itemData = data._effectiveSystem || item.system

    data.disciplineOptions = Disciplines.getList({})
    data.selectedDiscipline = itemData.discipline
    data.level = itemData.level
    data.cost = itemData.cost

    return data
  }

  async _preparePartContext(partId, context, options) {
    // Inherit any preparation from the extended class
    context = { ...(await super._preparePartContext(partId, context, options)) }

    // Top-level variables
    const item = this.item

    // Prepare each page context
    switch (partId) {
      // Stats
      case 'description':
        return prepareDescriptionContext(context, item)
      case 'dicepool':
        return prepareDicepoolContext(context, item)
      case 'macro':
        return prepareMacroContext(context, item)
      case 'modifiers':
        return prepareModifiersContext(context, item)
      case 'settings':
        return prepareItemSettingsContext(context, item)
    }

    return context
  }

  _configureRenderOptions(options) {
    super._configureRenderOptions(options)

    // Hide the "Dicepool" tab from gifts on SPC sheets.
    if (this.document.parent && this.document.parent?.type === 'spc') {
      options.parts = options.parts.filter((item) => item !== 'dicepool')
    }
  }

  // `_wireNativeFieldSave()` (salvamento por `[data-path]`) agora vive na base
  // compartilhada (`WoDItemBase`) — vale pra todas as fichas de item, não só esta.
}
