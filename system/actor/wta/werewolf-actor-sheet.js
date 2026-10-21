import { prepareGiftsContext, prepareWolfContext } from './scripts/prepare-partials.js'
// Various button functions
import {
  _onAddGift,
  _onRemoveGift,
  _onGiftToChat,
  _onSelectGift,
  _onSelectGiftPower
} from './scripts/gifts.js'
import { _onFormEdit, _onFormToChat, _onShiftForm, _onLostTheWolf } from './scripts/forms.js'
import { _onBeginFrenzy, _onEndFrenzy } from './scripts/frenzy.js'
import { _onHaranoRoll, _onHaugloskRoll } from './scripts/balance.js'
import { _damageWillpower } from '../../scripts/rolls/willpower-damage.js'
// Base actor sheet to extend from
import { WoDActorBase } from '../wod-actor-base.js'
import { getActorItems } from '../../scripts/embedded-items.js'
// Mixin
const { LoomHandlebarsMixin } = Loom

/**
 * Extend the WoDActorBase document
 * @extends {WoDActorBase}
 */
export class WerewolfActorSheet extends LoomHandlebarsMixin(WoDActorBase) {
  static DEFAULT_OPTIONS = {
    classes: ['wod5e', 'actor', 'sheet', 'werewolf'],
    actions: {
      addGift: _onAddGift,
      removeGift: _onRemoveGift,
      giftChat: _onGiftToChat,
      shiftForm: _onShiftForm,
      formChat: _onFormToChat,
      editForm: _onFormEdit,
      beginFrenzy: _onBeginFrenzy,
      endFrenzy: _onEndFrenzy,
      haranoRoll: _onHaranoRoll,
      haugloskRoll: _onHaugloskRoll,
      selectGift: _onSelectGift,
      selectGiftPower: _onSelectGiftPower,
      damageWillpower: _damageWillpower
    }
  }

  static PARTS = {
    header: {
      template: 'marketplace/rulesets/wod5e/display/wta/actors/werewolf-sheet.hbs'
    },
    tabs: {
      template: 'marketplace/rulesets/wod5e/display/shared/actors/parts/tab-navigation.hbs'
    },
    stats: {
      template: 'marketplace/rulesets/wod5e/display/shared/actors/parts/stats.hbs'
    },
    experience: {
      template: 'marketplace/rulesets/wod5e/display/shared/actors/parts/experience.hbs'
    },
    gifts: {
      template: 'marketplace/rulesets/wod5e/display/wta/actors/parts/gifts-rites.hbs'
    },
    wolf: {
      template: 'marketplace/rulesets/wod5e/display/wta/actors/parts/wolf.hbs'
    },
    features: {
      template: 'marketplace/rulesets/wod5e/display/wta/actors/parts/features.hbs'
    },
    equipment: {
      template: 'marketplace/rulesets/wod5e/display/shared/actors/parts/equipment.hbs'
    },
    biography: {
      template: 'marketplace/rulesets/wod5e/display/shared/actors/parts/biography.hbs'
    },
    notepad: {
      template: 'marketplace/rulesets/wod5e/display/shared/actors/parts/notepad.hbs'
    },
    settings: {
      template: 'marketplace/rulesets/wod5e/display/shared/actors/parts/actor-settings.hbs'
    },
    banner: {
      template: 'marketplace/rulesets/wod5e/display/shared/actors/parts/type-banner.hbs'
    },
    limited: {
      template: 'marketplace/rulesets/wod5e/display/shared/actors/limited-sheet.hbs'
    }
  }

  tabs = {
    stats: {
      id: 'stats',
      group: 'primary',
      title: 'WOD5E.Tabs.Stats',
      icon: '<i class="fa-regular fa-chart-line"></i>'
    },
    experience: {
      id: 'experience',
      group: 'primary',
      title: 'WOD5E.Tabs.Experience',
      icon: '<i class="fa-solid fa-file-contract"></i>'
    },
    gifts: {
      id: 'gifts',
      group: 'primary',
      title: 'WOD5E.WTA.GiftsAndRenown',
      icon: '<span class="wod5e-symbol">h</span>'
    },
    wolf: {
      id: 'wolf',
      group: 'primary',
      title: 'WOD5E.WTA.Wolf',
      icon: '<i class="fa-brands fa-wolf-pack-battalion"></i>'
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
    biography: {
      id: 'biography',
      group: 'primary',
      title: 'WOD5E.Tabs.Biography',
      icon: '<i class="fas fa-id-card"></i>'
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

  async _prepareContext() {
    // Top-level variables
    const data = await super._prepareContext()
    const actor = this.actor
    if (!actor) return data || {}
    const actorData = actor.system || actor.systemData || {}

    // Filters for item-specific data
    // `getActorItems()` em vez de `actor.items` — mesma causa já corrigida em
    // vampire-actor-sheet.js/prepare-partials.js: itens vindos da atualização reativa
    // via WS não têm `.system` de verdade, e Tribo/Presságio sumiam até reabrir a ficha.
    const tribeFilter = getActorItems(actor).filter((item) => item.type === 'tribe')
    const auspiceFilter = getActorItems(actor).filter((item) => item.type === 'auspice')

    // Prepare werewolf-specific items
    data.tribe = tribeFilter[0]
    data.auspice = auspiceFilter[0]
    data.rage = actorData.rage || { value: 1, max: 5 }
    data.frenzyActive = actorData.frenzyActive ?? false
    data.lostTheWolf = (data.rage?.value ?? 1) === 0
    data.crinosHealth = actorData.crinosHealth || { value: 4, max: 4, superficial: 0, aggravated: 0 }
    data.activeForm = actorData.activeForm || 'homid'

    return data
  }

  _onRender(context, options) {
    super._onRender?.(context, options)

    const actor = this.actor
    if (!actor) return
    const actorData = actor.system || actor.systemData || {}
    const rageValue = actorData.rage?.value ?? 1
    const supernaturalForms = ['glabro', 'crinos', 'hispo']

    if (
      rageValue === 0 &&
      supernaturalForms.includes(actorData.activeForm) &&
      !actorData.formOverride &&
      !this._handlingLostWolf
    ) {
      this._handlingLostWolf = true
      setTimeout(async () => {
        try {
          await _onLostTheWolf(actor)
        } finally {
          this._handlingLostWolf = false
        }
      }, 200)
    }
  }

  async _preparePartContext(partId, context, options) {
    // Inherit any preparation from the extended class
    context = { ...(await super._preparePartContext(partId, context, options)) }

    // Top-level variables
    const actor = this.actor

    // Prepare each page context
    switch (partId) {
      // Stats
      case 'stats':
        return this.prepareStatsContext(context, actor)

      // Experience
      case 'experience':
        return this.prepareExperienceContext(context, actor)

      // Gifts
      case 'gifts':
        return prepareGiftsContext(context, actor)

      // Wolf
      case 'wolf':
        return prepareWolfContext(context, actor)

      // Features
      case 'features':
        return this.prepareFeaturesContext(context, actor)

      // Equipment
      case 'equipment':
        return this.prepareEquipmentContext(context, actor)

      // Biography
      case 'biography':
        return this.prepareBiographyContext(context, actor)

      // Notepad
      case 'notepad':
        return this.prepareNotepadContext(context, actor)

      // Settings
      case 'settings':
        return this.prepareSettingsContext(context, actor)

      // Limited view
      case 'limited':
        return this.prepareLimitedContext(context, actor)
    }

    return context
  }
}
