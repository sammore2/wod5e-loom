// Preparation functions
import {
  prepareDescriptionContext,
  prepareMacroContext,
  prepareModifiersContext,
  prepareItemSettingsContext
} from '../scripts/prepare-partials.js'
// Base item sheet to extend from
import { WoDItemBase } from '../wod-item-base.js'
// Mixin
const { LoomHandlebarsMixin } = Loom

/**
 * Extend the WoDItemBase document
 * @extends {WoDItemBase}
 */
export class TraitItemSheet extends LoomHandlebarsMixin(WoDItemBase) {
  static DEFAULT_OPTIONS = {
    classes: ['wod5e', 'item', 'sheet'],
    actions: {}
  }

  static PARTS = {
    header: {
      template: 'marketplace/rulesets/wod5e/display/shared/items/trait-sheet.hbs'
    },
    tabs: {
      template: 'marketplace/rulesets/wod5e/display/shared/items/parts/tab-navigation.hbs'
    },
    description: {
      template: 'marketplace/rulesets/wod5e/display/shared/items/parts/description.hbs'
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

  tabs = {
    description: {
      id: 'description',
      group: 'primary',
      label: 'WOD5E.Tabs.Description'
    },
    macro: {
      id: 'macro',
      group: 'primary',
      label: 'WOD5E.ItemsList.Macro'
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

  async _prepareContext() {
    // Top-level variables
    const data = await super._prepareContext()
    const item = this.item
    const itemData = item.system

    data.dice = itemData.dice

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
      case 'macro':
        return prepareMacroContext(context, item)
      case 'modifiers':
        return prepareModifiersContext(context, item)
      case 'settings':
        return prepareItemSettingsContext(context, item)
    }

    return context
  }


  _postRender() {
    if (typeof super._postRender === 'function') super._postRender();
    
    this.element.querySelectorAll('[data-path]').forEach((input) => {
      input.addEventListener('change', async () => {
        const path = input.dataset.path;
        const value = input.type === 'checkbox'
          ? input.checked
          : (input.type === 'number' ? (Number(input.value) || 0) : input.value);
        
        const id = this.document?.id;
        if (!id) return;
        
        const data = { ...(this.document?.data || {}) };
        
        const parts = path.split('.');
        let cur = data;
        for (let i = 0; i < parts.length - 1; i++) {
          cur = cur[parts[i]] ??= {};
        }
        cur[parts[parts.length - 1]] = value;
        
        await Loom.api.put('/items/' + id, { data });
      });
    });
  }
}

