import { qs, on, val, get, fadeIn, fadeOut, each } from './utils.js'

// Custom UI Classes
import { WoDChatLog } from './ui/wod-chat-log.js'
import { WoDChatMessage } from './ui/wod-chat-message.js'
import { _onWillpowerReroll } from './scripts/willpower-reroll.js'
import { _onAnyReroll } from './scripts/any-reroll.js'
import { loadHotbarDrop, _onRollItemFromMacro } from './scripts/hotbar-drop.js'
import { AdjustHunger } from '../macros/adjust-hunger.js'
import { AdjustRage } from '../macros/adjust-rage.js'
import { WoDSettings } from './ui/wod-settings.js'
import { WoDPause } from './ui/wod-game-pause.js'
// Module functionality
import { preloadHandlebarsTemplates } from './scripts/templates.js'
import { loadDiceSoNice } from './dice/dice-so-nice.js'
import { loadHelpers } from './scripts/helpers.js'
import { loadUpdateNormalization } from './scripts/document-updates.js'
import { installPartPruning } from './scripts/part-pruning.js'
import { loadDocumentFieldExposure } from './scripts/document-fields.js'
import {
  loadSettings,
  _updateHeaderFontPreference,
  _updateXpIconOverrides
} from './scripts/settings.js'
// Actor sheets
import { WoDActor, wodPrepareData } from './actor/actor.js'
import { WoDActorDirectory } from './ui/wod-actor-directory.js'
import { WoDItemDirectory } from './ui/wod-item-directory.js'
import { ProseMirrorSettings } from './ui/prosemirror.js'
import { WoDActorModel } from './actor/data-models/base-actor-model.js'
import { WoDActorBase } from './actor/wod-actor-base.js'
import { GroupActorSheet } from './actor/group-actor-sheet.js'
// Item sheets
import { WoDItem } from './item/item.js'
import { WoDItemBase } from './item/wod-item-base.js'
import { WoDItemModel } from './item/data-models/base-item-model.js'
// WOD5E functions and classes
import {
  MortalDie,
  VampireDie,
  VampireHungerDie,
  HunterDie,
  HunterDesperationDie,
  WerewolfDie,
  WerewolfRageDie,
  WOD5eDie
} from './dice/splat-dice.js'
import { migrateWorld } from './scripts/migration.js'
import { wod5eAPI } from './api/wod5e-api.js'
import { WOD5eRoll } from './scripts/system-rolls.js'
import { _updateCSSVariable, cssVariablesRecord } from './scripts/update-css-variables.js'
import { _updateToken } from './actor/wta/scripts/forms.js'
import { RollPromptSockets } from './sockets/roll-prompt.js'
import { DiceRegistry } from './api/def/dice.js'
// WOD5E Definitions
import { Systems } from './api/def/systems.js'
import { Attributes } from './api/def/attributes.js'
import { Skills } from './api/def/skills.js'
import { Features } from './api/def/features.js'
import { ActorTypes } from './api/def/actortypes.js'
import { ItemTypes } from './api/def/itemtypes.js'
import { Disciplines } from './api/def/disciplines.js'
import { Edges } from './api/def/edges.js'
import { Renown } from './api/def/renown.js'
import { WereForms } from './api/def/were-forms.js'
import { Gifts } from './api/def/gifts.js'
import { rollPrompt, rollPromptToChat } from './ui/custom-enrichers/roll-prompt-enrichers.js'
import { RollMenuApplication } from './applications/roll-menu/roll-prompt-menu.js'
import { CompendiumBrowserApplication } from './applications/compendium-browser/compendium-bowser.js'
import { loadControls } from './scripts/controls.js'
import { WoDCompendiumDirectory } from './ui/wod-compendium.js'





// Register the WOD5E global
window.WOD5E = {
  api: {
    Roll: wod5eAPI.Roll,
    PromptRoll: wod5eAPI.PromptRoll,
    RollFromDataset: wod5eAPI.RollFromDataset,
    getBasicDice: wod5eAPI.getBasicDice,
    getAdvancedDice: wod5eAPI.getAdvancedDice,
    getFlavorDescription: wod5eAPI.getFlavorDescription,
    generateLabelAndLocalize: wod5eAPI.generateLabelAndLocalize,
    migrateWorld,
    _onRollItemFromMacro
  },
  applications: {
    RollMenuApplication,
    CompendiumBrowserApplication
  },
  WoDItemBase,
  WoDActorBase,
  WoDActorModel,
  WoDItemModel,
  Systems,
  Attributes,
  Skills,
  Features,
  ActorTypes,
  ItemTypes,
  Disciplines,
  Edges,
  Renown,
  Gifts,
  WereForms,
  WOD5eDie,
  DiceRegistry
}

// Anything that needs to be ran alongside the initialisation of the world

// Shim Loom.modules to prevent .filter() crashes
if (typeof Loom !== 'undefined' && !Loom.modules) {
  Loom.modules = []
  Loom.modules.filter = () => []
}

// Alias this.document to this.actor/item for ApplicationV2 compatibility
if (typeof Loom !== 'undefined' && Loom.LoomActorSheet && !Object.getOwnPropertyDescriptor(Loom.LoomActorSheet.prototype, 'document')) {
  Object.defineProperty(Loom.LoomActorSheet.prototype, 'document', {
    get() { return this.actor || this.object || {} }
  })
}
if (typeof Loom !== 'undefined' && Loom.LoomItemSheet && !Object.getOwnPropertyDescriptor(Loom.LoomItemSheet.prototype, 'document')) {
  Object.defineProperty(Loom.LoomItemSheet.prototype, 'document', {
    get() { return this.item || this.object || {} }
  })
}

Loom.LoomHooks.once('init', async function () {
  console.log('World of Darkness 5e | Initializing the World of Darkness 5e System')

  // Register system with LoomVTT systemRegistry so sidebar actor creation shows type selection dialog
  const systemRegistry = globalThis.__loomSystemRegistry || (typeof Loom !== 'undefined' ? Loom.systems : undefined)
  if (systemRegistry) {
    systemRegistry.register({
      id: 'wod5e',
      title: 'World of Darkness 5e',
      version: '5.3.23',
      actorTypes: [
        'mortal',
        'spc',
        'vampire',
        'ghoul',
        'hunter',
        'werewolf',
        'group'
      ],
      itemTypes: [
        'feature',
        'customRoll',
        'armor',
        'weapon',
        'gear',
        'trait',
        'condition',
        'clan',
        'predatorType',
        'resonance',
        'power',
        'boon',
        'creed',
        'drive',
        'perk',
        'edgepool',
        'tribe',
        'auspice',
        'talisman',
        'gift',
        'guidingspirit'
      ],
      // Macros shipped with the ruleset (hotbar type `ruleset-macro`; the macro row only
      // carries the key). They run in the page with the full Loom API, unlike sandboxed
      // `script` macros.
      runMacro(key) {
        const rulesetMacros = {
          'adjust-hunger': AdjustHunger,
          'adjust-rage': AdjustRage
        }
        return rulesetMacros[key]?.()
      },
      getDefaultData(type) {
        // `roll.js`'s `_onConfirmRoll` picks the dice pool (vampire hunger dice,
        // werewolf rage dice, etc.) off `actor.system.gamesystem`, not `actor.type`.
        // Every imported/real actor has `gamesystem` equal to its `type`, but nothing
        // set it for actors created fresh in Loom (this stub returned `{}`), so new
        // vampires/werewolves/etc. always fell back to plain "mortal" rolls.
        return { gamesystem: type }
      },
      prepareData: wodPrepareData,
      getSheetSchema(actorType) { return null },
      getItemSheetSchema(itemType) { return null }
    })
    if (systemRegistry.setActive) {
      systemRegistry.setActive('wod5e')
    }
  }

  // Custom document classes
  CONFIG.Actor.documentClass = WoDActor
  CONFIG.Item.documentClass = WoDItem
  // Custom UI implementations
  CONFIG.ui.chat = WoDChatLog
  CONFIG.ui.settings = WoDSettings
  CONFIG.ui.compendium = WoDCompendiumDirectory
  CONFIG.ui.actors = WoDActorDirectory
  CONFIG.ui.items = WoDItemDirectory
  CONFIG.ui.pause = WoDPause
  // Custom dice rolling functionality
  CONFIG.Dice = CONFIG.Dice || {}
  CONFIG.Dice.rolls = [WOD5eRoll]
  CONFIG.Dice.terms = CONFIG.Dice.terms || {}
  CONFIG.Dice.terms.m = MortalDie
  CONFIG.Dice.terms.v = VampireDie
  CONFIG.Dice.terms.g = VampireHungerDie
  CONFIG.Dice.terms.h = HunterDie
  CONFIG.Dice.terms.s = HunterDesperationDie
  CONFIG.Dice.terms.w = WerewolfDie
  CONFIG.Dice.terms.r = WerewolfRageDie
  CONFIG.Dice.rollModes = {
    publicroll: 'CHAT.RollPublic',
    gmroll: 'CHAT.RollPrivate',
    blindroll: 'CHAT.RollBlind',
    selfroll: 'CHAT.RollSelf'
  }

  // Estende o card nativo de roll (`Loom.wraps.renderRollCard`) em vez de
  // substituir a mensagem inteira — cabeçalho (avatar/nome/deletar) continua
  // do core, só o corpo (dados, sucessos/falhas) é o visual próprio do wod5e,
  // já pronto em `roll.meta.bodyHtml` (montado em `WOD5eRoll.toMessage()`).
  if (typeof Loom !== 'undefined' && Loom.wraps?.renderRollCard) {
    Loom.wraps.renderRollCard.addWrapper((original, roll, esc) => {
      if (roll?.meta?.wod5e) return roll.meta.bodyHtml
      return original(roll, esc)
    })
  }

  // Menu de contexto (clique direito no card) — o reroll de Força de
  // Vontade era um item de `_getEntryContextOptions()` do `WoDChatLog`
  // (nunca usado de verdade pelo HUD nativo); estende o menu nativo em vez.
  if (typeof Loom !== 'undefined' && Loom.wraps?.chatCardContextOptions) {
    Loom.wraps.chatCardContextOptions.addWrapper((original, msg) => {
      let options = original(msg)

      // O "Reroll" genérico do core (`chat-message-card.ts`) reenvia a
      // fórmula pro servidor e posta uma mensagem NOVA de verdade — mas o
      // card do wod5e sempre renderiza `meta.bodyHtml` pré-calculado quando
      // `meta.wod5e` é true (ver `renderRollCard` wrapper abaixo), então a
      // rolagem nova acontecia de verdade só que ficava invisível: a
      // mensagem nova mostrava os MESMOS números da antiga (duplicata
      // idêntica). Troca por `_onAnyReroll`, que edita o card no lugar.
      if (msg?.roll?.meta?.wod5e) {
        // Identifica a opção pelo ícone do core (`chat-message-card.ts`),
        // não pelo label — o core usa seu próprio i18n (`t()`), diferente
        // do `Loom.i18n.localize` do wod5e, então comparar strings
        // traduzidas arriscava nunca bater.
        options = options.filter((opt) => opt.icon !== '<i class="fa-solid fa-rotate-right"></i>')
      }

      const hasBasicDice = (msg?.roll?.meta?.diceData?.basicDice?.results || []).some((d) => !d.discarded)
      const hasRerollableAdvancedDice = (msg?.roll?.meta?.diceData?.advancedDice?.results || []).some(
        (d) => !d.discarded && d.classes?.includes('rerollable')
      )
      const hasAnyDice = hasBasicDice ||
        (msg?.roll?.meta?.diceData?.advancedDice?.results || []).some((d) => !d.discarded)

      if (msg?.roll?.meta?.wod5e && hasAnyDice) {
        options.push({
          icon: '<i class="fas fa-redo"></i>',
          label: Loom.i18n.localize('WOD5E.Chat.Reroll'),
          action: () => _onAnyReroll(msg.id)
        })
      }

      if (msg?.roll?.meta?.wod5e && !msg.roll.meta.noWillpowerReroll && (hasBasicDice || hasRerollableAdvancedDice)) {
        options.push({
          icon: '<i class="fas fa-redo"></i>',
          label: Loom.i18n.localize('WOD5E.Chat.WillpowerReroll'),
          action: () => _onWillpowerReroll(msg.id)
        })
      }

      return options
    })
  }
// Ensure actor types are initialized
ActorTypes.onReady()
// Loop through each entry in the actorTypesList and register their sheet classes
const actorTypesList = ActorTypes.getList({})
CONFIG.Actor.dataModels = CONFIG.Actor.dataModels || {}
CONFIG.Actor.TYPES = Object.keys(actorTypesList)
CONFIG.Actor.typeLabels = Object.entries(actorTypesList).reduce((acc, [id, value]) => {
  acc[id] = value.label || id
  return acc
}, {})
// Refresh with real translations once the app finishes booting — at this point
// (top of main.js) the ruleset's language files may not be registered yet, so
// Loom.i18n.localize() here just echoes the raw key back.
Loom.LoomHooks.once('ready', () => {
  CONFIG.Actor.typeLabels = Object.entries(actorTypesList).reduce((acc, [id, value]) => {
    acc[id] = Loom.i18n?.localize ? Loom.i18n.localize(value.label || `TYPES.Actor.${id}`) : (value.label || id)
    return acc
  }, {})
})

// Log for debugging

for (const [id, value] of Object.entries(actorTypesList)) {
  const { types, sheetClass, sheetModel } = value

  // Add to the list of data models
  Object.assign(CONFIG.Actor.dataModels, {
    [id]: sheetModel
  })

  // Register the sheet with Loom sheet catalog
  if (typeof Actors !== 'undefined' && Actors.registerSheet) {
    Actors.registerSheet('wod5e', sheetClass, {
      types,
      makeDefault: true
    })
  }
  if (typeof DocumentSheetConfig !== 'undefined') {
    DocumentSheetConfig.registerSheet(Actor, 'wod5e', sheetClass, {
      types,
      makeDefault: true
    })
  }
  if (typeof Loom !== 'undefined' && Loom.sheets?.registerSheet) {
    Loom.sheets.registerSheet('actor', 'wod5e', sheetClass, {
      types,
      makeDefault: true
    })
  }
}

  // Loop through each entry in the itemTypesList and register their sheet classes
  const itemTypesList = ItemTypes.getList({})
  CONFIG.Item.dataModels = CONFIG.Item.dataModels || {}
  CONFIG.Item.TYPES = Object.keys(itemTypesList)
  CONFIG.Item.typeLabels = Object.entries(itemTypesList).reduce((acc, [id, value]) => {
    acc[id] = value.label || id
    return acc
  }, {})
  // Same deferred refresh as CONFIG.Actor.typeLabels above.
  Loom.LoomHooks.once('ready', () => {
    CONFIG.Item.typeLabels = Object.entries(itemTypesList).reduce((acc, [id, value]) => {
      acc[id] = Loom.i18n?.localize ? Loom.i18n.localize(value.label || `TYPES.Item.${id}`) : (value.label || id)
      return acc
    }, {})
  })

  for (const [id, value] of Object.entries(itemTypesList)) {
    const { types, sheetClass, sheetModel } = value

    // Add to the list of data models
    Object.assign(CONFIG.Item.dataModels, {
      [id]: sheetModel
    })

    // Register the sheet with Loom sheet catalog
    if (typeof Items !== 'undefined' && Items.registerSheet) {
      Items.registerSheet('wod5e', sheetClass, {
        types,
        makeDefault: true
      })
    }
    if (typeof DocumentSheetConfig !== 'undefined') {
      DocumentSheetConfig.registerSheet(Item, 'wod5e', sheetClass, {
        types,
        makeDefault: true
      })
    }
    if (typeof Loom !== 'undefined' && Loom.sheets?.registerSheet) {
      Loom.sheets.registerSheet('item', 'wod5e', sheetClass, {
        types,
        makeDefault: true
      })
    }
  }

  // Make Handlebars templates accessible to the system
  preloadHandlebarsTemplates()

  // Make helpers accessible to the system
  loadHelpers()

  // Normalize document updates to the REST API field names
  loadUpdateNormalization()

  // Prune sheet parts the sheet doesn't want rendered
  installPartPruning([
    WoDActorBase.prototype,
    WoDItemBase.prototype,
    GroupActorSheet.prototype
  ])

  // Load settings into Loom
  loadSettings()

  // Load keybindings
  loadControls()

  // Load hotbar drop functionality
  loadHotbarDrop()

  // Initialize header font preference on game init
  _updateHeaderFontPreference()

  // Initialize the alterations to any XP icons
  _updateXpIconOverrides()

  // Initialize the alterations to ProseMirror
  ProseMirrorSettings()

  // Sockets to register
  RollPromptSockets()
})

// Anything that needs to run once the world is ready
Loom.LoomHooks.once('ready', async function () {
  // Expose `system` as an own property on live documents
  loadDocumentFieldExposure()

  // Purga itens pertencentes a atores da coleção global Loom.items
  // para que itens criados na ficha não apareçam na lista de itens do mundo
  if (Loom.items?.contents) {
    const actorItems = Loom.items.contents.filter((i) => i.actorId || i.parent?.id)
    for (const item of actorItems) {
      Loom.items.delete(item.id)
    }
  }

  // Forced panning is intrinsically annoying: change default to false
  Loom.settings.settings.get('core.chatBubblesPan').default = false

  // Improve discoverability of map notes
  Loom.settings.settings.get('core.notesDisplayToggle').default = true

  // Apply the currently selected language as a CSS class so we can
  // modify elements based on locale if needed
  document.body.classList.add(Loom.settings.get('core', 'language'))

  // Set default presets for JS Color
  if (typeof jscolor !== 'undefined') jscolor.presets.default = {
    format: 'hexa',
    backgroundColor: '#000',
    palette:
      '#FF2B2B80 #650202 #d84343 #f51f1f #D18125 #cc6d28 #ffb762 #ff8f00 #BE660080 #4e2100 #994101 #e97244'
  }

  // Migration functions
  migrateWorld()

  // Set up any splat colour changes
  const cssVariables = cssVariablesRecord()
  Object.keys(cssVariables).forEach((theme) => {
    const settings = cssVariables[theme].settings

    // Go through all the settings in each theme
    Object.keys(settings).forEach((settingKey) => {
      const { settingId, cssVariable } = settings[settingKey]

      // Get the current value of the setting
      const settingValue = Loom.settings.get('wod5e', settingId)

      // Update the CSS variable
      _updateCSSVariable(settingId, cssVariable, settingValue)
    })
  })
})

// DiceSoNice functionality
Loom.LoomHooks.once('diceSoNiceReady', (dice3d) => {
  loadDiceSoNice(dice3d)
})

Loom.LoomHooks.on('canvasReady', (canvas) => {
  const tokens = canvas?.stage?.tokens || canvas?.stage?.cast || canvas?.scene?.tokens || []

  tokens.forEach((token) => {
    if (token?.actor && token?.actor?.type === 'werewolf') {
      const activeForm = token.actor.system?.activeForm || token.actor.derivedData?.activeForm

      _updateToken(token.actor, activeForm)
    }
  })
})

// Whenever an actor updates, we want to check for if the 'locked' variable changes
// and then we want to re-render the item as part of this since items can be
// in a read-only state (derived from the actor itself)
Loom.LoomHooks.on('actor.updated', (actor, changes) => {
  // Check if the 'system.locked' property is changed
  if (!Loom.utils.hasProperty(changes, 'system.locked')) return

  // Re-render all item sheets with the actor as the parent
  const activeWindows = Loom.windowManager.getAll()
  const activeActorItemWindows = [...activeWindows].filter((application) => {
    const item = application.document
    return application.rendered && item?.parent?.uuid === actor.uuid
  })
  for (const app of activeActorItemWindows) {
    app.render(false)
  }
})


// LoomVTT Polyfill: Inject ApplicationV2 classes into the window wrapper
Loom.LoomHooks.on('renderWindow', (app, html) => {
  if (app.options && Array.isArray(app.options.classes)) {
    const el = html.length ? html[0] : html;
    app.options.classes.forEach(c => {
      if (c && el && el.classList) el.classList.add(c);
    });
  }
});

// LoomVTT Fix: Wrap WoDActorBase _onRender
const _originalOnRender = WoDActorBase.prototype._onRender;
WoDActorBase.prototype._onRender = async function(context, options) {
  if (_originalOnRender) {
    try {
      await _originalOnRender.call(this, context, options);
    } catch (e) {
      console.error("WOD5E: Error in original _onRender:", e);
    }
  }

  try {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark && !document.body.classList.contains('theme-dark')) {
      document.body.classList.add('theme-dark');
    }

    if (this.actor && this.actor.type) {
      document.body.classList.add(`wod-${this.actor.type}-theme`);
    }
  } catch (e) {
    console.error("WOD5E: Error in LoomVTT patch:", e);
  }
};
