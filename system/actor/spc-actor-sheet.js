// Various button functions
import { _onEditExceptionalPools } from './scripts/exceptional-dicepools.js'
import { _onCreatePower, _onDeletePower } from './scripts/spc-powers.js'
import { _onHaranoRoll, _onHaugloskRoll } from './wta/scripts/balance.js'
// Base actor sheet to extend from
import { WoDActorBase } from './wod-actor-base.js'
import { _onToggleDespair } from './htr/scripts/toggle-despair.js'
import { _onFormEdit, _onSpcShiftForm } from './wta/scripts/forms.js'
// Mixin
const { LoomHandlebarsMixin } = Loom

/**
 * Extend the WoDActorBase document
 * @extends {WoDActorBase}
 */
export class SPCActorSheet extends LoomHandlebarsMixin(WoDActorBase) {
  static DEFAULT_OPTIONS = {
    classes: ['wod5e', 'actor', 'spc', 'sheet'],
    actions: {
      createSPCPower: _onCreatePower,
      deleteSPCPower: _onDeletePower,
      editExceptionalPools: _onEditExceptionalPools,
      haranoRoll: _onHaranoRoll,
      haugloskRoll: _onHaugloskRoll,
      toggleDespair: _onToggleDespair,
      shiftForm: _onSpcShiftForm,
      editForm: _onFormEdit
    }
  }

  static PARTS = {
    header: {
      template: 'marketplace/rulesets/wod5e/display/shared/actors/spc-sheet.hbs'
    },
    tabs: {
      template: 'marketplace/rulesets/wod5e/display/shared/actors/parts/tab-navigation.hbs'
    },
    stats: {
      template: 'marketplace/rulesets/wod5e/display/shared/actors/parts/spc/stats.hbs'
    },
    features: {
      template: 'marketplace/rulesets/wod5e/display/shared/actors/parts/features.hbs'
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

    // Push the current gamesystem as a class. `derivedData.gamesystem` primeiro —
    // `system.gamesystem` de um SPC fica travado no valor de quando o ator foi criado
    // (não persiste ao trocar "Tipo de Ator"/spcType; ver comentário em
    // `actor.js`/`prepareDerivedData`).
    const currentGamesystem = actor.derivedData?.gamesystem ?? actorData.gamesystem ?? 'mortal'
    if (this.options?.classes && !this.options.classes.includes(currentGamesystem)) {
      this.options.classes.push(currentGamesystem)
    }

    // `data.currentActorType` vem de `spcType` (sempre em dia, ver `get-actor-types.js`)
    // — usar isso em vez de `data.gamesystem` (que pode estar travado) pra decidir se
    // mostra Humanidade/Fome/Potência de Sangue ou Aflição.
    if (data.currentActorType === 'vampire' || data.currentActorType === 'ghoul') {
      data.humanity = actorData.humanity || { value: 7, max: 10, stains: 0 }
      data.hunger = actorData.hunger || { value: 1, max: 5 }
      data.bloodpotency = Math.min(Math.max(actorData.blood?.potency ?? 0, 0), 10) // Make sure Blood Potency doesn't go over 10 or under 0
    }

    if (data.currentActorType === 'hunter') {
      data.despairActive = (actorData?.despair?.value ? actorData?.despair?.value : 0) > 0
    }

    if (data.currentActorType === 'werewolf') {
      data.rage = actorData.rage || { value: 1, max: 5 }
      data.lostTheWolf = (data.rage?.value ?? 1) === 0
      data.activeForm = actorData.activeForm || 'homid'
      data.forms = actorData.forms || {}
    }

    if (data.currentActorType === 'spirit') {
      data.power = actorData.power
    }

    // If an actor type shouldn't have advanced dice, hold that status in noAdvancedDice
    if (data.currentActorType === 'ghoul' || data.currentActorType === 'spirit') {
      data.noAdvancedDice = true
    }

    data.generalDifficultyEnabled = actorData.settings.generalDifficultyEnabled
    data.generaldifficulty = {
      strongest: actorData.generaldifficulty.strongest || 0,
      normal: actorData.generaldifficulty.normal || 0
    }

    return data
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
        return this.prepareSpcStatsContext(context, actor)

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

  _onRender() {
    super._onRender()
    const html = this.element

    // Add a new sheet styling depending on the type of sheet.
    // `derivedData.gamesystem` primeiro — mesmo motivo do comentário em `_prepareContext`.
    const gamesystem = this.actor.derivedData?.gamesystem ?? this.actor.system.gamesystem
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
