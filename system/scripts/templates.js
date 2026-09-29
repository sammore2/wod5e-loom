/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
  console.log('World of Darkness 5e | SchreckNet: loading subroutines')

  // Define template paths to load
  const templatePaths = [
    // Generic partials
    'marketplace/rulesets/wod5e/display/shared/items/parts/tab-navigation.hbs',

    // Base Sheet Partials
    'marketplace/rulesets/wod5e/display/shared/actors/parts/lock-button.hbs',
    'marketplace/rulesets/wod5e/display/shared/actors/parts/header-profile.hbs',
    'marketplace/rulesets/wod5e/display/shared/actors/parts/biography.hbs',
    'marketplace/rulesets/wod5e/display/shared/actors/parts/features.hbs',
    'marketplace/rulesets/wod5e/display/shared/actors/parts/health.hbs',
    'marketplace/rulesets/wod5e/display/shared/actors/parts/notepad.hbs',
    'marketplace/rulesets/wod5e/display/shared/actors/parts/stats.hbs',
    'marketplace/rulesets/wod5e/display/shared/actors/parts/willpower.hbs',
    'marketplace/rulesets/wod5e/display/shared/actors/parts/actor-settings.hbs',
    'marketplace/rulesets/wod5e/display/shared/actors/parts/core-features.hbs',
    'marketplace/rulesets/wod5e/display/shared/actors/parts/core-details.hbs',
    'marketplace/rulesets/wod5e/display/shared/actors/parts/chronicle-tenets.hbs',
    'marketplace/rulesets/wod5e/display/shared/actors/parts/touchstones-convictions.hbs',
    'marketplace/rulesets/wod5e/display/shared/actors/parts/experience.hbs',
    'marketplace/rulesets/wod5e/display/shared/actors/limited-sheet.hbs',
    'marketplace/rulesets/wod5e/display/shared/actors/partials/dynamic-item-display.hbs',

    // Hunter Sheet Partials
    'marketplace/rulesets/wod5e/display/htr/actors/parts/danger.hbs',
    'marketplace/rulesets/wod5e/display/htr/actors/parts/despair.hbs',
    'marketplace/rulesets/wod5e/display/htr/actors/parts/desperation.hbs',
    'marketplace/rulesets/wod5e/display/htr/actors/parts/edges.hbs',
    'marketplace/rulesets/wod5e/display/htr/actors/parts/features.hbs',
    'marketplace/rulesets/wod5e/display/htr/actors/parts/redemption.hbs',
    'marketplace/rulesets/wod5e/display/htr/actors/parts/creed-fields.hbs',

    // Vampire Sheet Partials
    'marketplace/rulesets/wod5e/display/vtm/actors/parts/disciplines.hbs',
    'marketplace/rulesets/wod5e/display/vtm/actors/parts/blood.hbs',
    'marketplace/rulesets/wod5e/display/vtm/actors/parts/frenzy.hbs',
    'marketplace/rulesets/wod5e/display/vtm/actors/parts/humanity.hbs',
    'marketplace/rulesets/wod5e/display/vtm/actors/parts/hunger.hbs',
    'marketplace/rulesets/wod5e/display/vtm/actors/parts/rouse.hbs',

    // Werewolf Sheet Partials
    'marketplace/rulesets/wod5e/display/wta/actors/parts/gifts-rites.hbs',
    'marketplace/rulesets/wod5e/display/wta/actors/parts/wolf.hbs',
    'marketplace/rulesets/wod5e/display/wta/actors/parts/balance.hbs',
    'marketplace/rulesets/wod5e/display/wta/actors/parts/frenzy.hbs',
    'marketplace/rulesets/wod5e/display/wta/actors/parts/rage-button.hbs',
    'marketplace/rulesets/wod5e/display/wta/actors/parts/rage-value.hbs',
    'marketplace/rulesets/wod5e/display/wta/actors/parts/renown.hbs',
    'marketplace/rulesets/wod5e/display/wta/actors/parts/forms.hbs',
    'marketplace/rulesets/wod5e/display/wta/actors/parts/features.hbs',
    'marketplace/rulesets/wod5e/display/wta/actors/parts/patron-spirit.hbs',
    'marketplace/rulesets/wod5e/display/wta/actors/parts/favor.hbs',
    'marketplace/rulesets/wod5e/display/wta/actors/parts/ban.hbs',
    'marketplace/rulesets/wod5e/display/wta/actors/parts/guiding-spirit.hbs',

    // SPC Sheet Partials
    'marketplace/rulesets/wod5e/display/shared/actors/parts/spc/stats.hbs',
    'marketplace/rulesets/wod5e/display/shared/actors/parts/spc/spc-traits.hbs',
    'marketplace/rulesets/wod5e/display/shared/actors/parts/spc/spc-conditions.hbs',
    'marketplace/rulesets/wod5e/display/shared/actors/parts/spc/standard-dice-pools.hbs',
    'marketplace/rulesets/wod5e/display/shared/actors/parts/spc/exceptional-dice-pools.hbs',
    'marketplace/rulesets/wod5e/display/shared/actors/parts/spc/generaldifficulty.hbs',
    'marketplace/rulesets/wod5e/display/shared/actors/parts/spc/spc-disciplines.hbs',
    'marketplace/rulesets/wod5e/display/shared/actors/parts/spc/spc-gifts.hbs',
    'marketplace/rulesets/wod5e/display/shared/actors/parts/spc/spc-edges.hbs',
    'marketplace/rulesets/wod5e/display/shared/actors/parts/spc/blood-potency.hbs',
    'marketplace/rulesets/wod5e/display/shared/actors/parts/spc/spc-wereform.hbs',

    // Group Sheet Partials
    'marketplace/rulesets/wod5e/display/vtm/actors/coterie-sheet.hbs',
    'marketplace/rulesets/wod5e/display/htr/actors/cell-sheet.hbs',
    'marketplace/rulesets/wod5e/display/wta/actors/pack-sheet.hbs',
    'marketplace/rulesets/wod5e/display/shared/actors/parts/group/group-members.hbs',
    'marketplace/rulesets/wod5e/display/shared/actors/parts/group/features.hbs',

    // Application Partials
    'marketplace/rulesets/wod5e/display/wta/applications/wereform-application/wereform-application.hbs',
    'marketplace/rulesets/wod5e/display/shared/applications/skill-application/skill-application.hbs',
    'marketplace/rulesets/wod5e/display/shared/applications/skill-application/parts/specialty-display.hbs',

    // Item Sheet Partials (Tabs)
    'marketplace/rulesets/wod5e/display/shared/items/parts/description.hbs',
    'marketplace/rulesets/wod5e/display/shared/items/parts/dicepool.hbs',
    'marketplace/rulesets/wod5e/display/shared/items/parts/macro.hbs',
    'marketplace/rulesets/wod5e/display/shared/items/parts/modifiers.hbs',
    'marketplace/rulesets/wod5e/display/shared/items/parts/modifier-display.hbs',
    'marketplace/rulesets/wod5e/display/shared/items/parts/data-item-id.hbs',
    'marketplace/rulesets/wod5e/display/shared/items/parts/item-uses.hbs',
    'marketplace/rulesets/wod5e/display/shared/items/parts/source.hbs',

    // Roll dialog Partials
    'marketplace/rulesets/wod5e/display/ui/parts/roll-dialog-base.hbs',
    'marketplace/rulesets/wod5e/display/ui/parts/situational-modifiers.hbs',
    'marketplace/rulesets/wod5e/display/ui/mortal-roll-dialog.hbs',
    'marketplace/rulesets/wod5e/display/ui/vampire-roll-dialog.hbs',
    'marketplace/rulesets/wod5e/display/ui/werewolf-roll-dialog.hbs',
    'marketplace/rulesets/wod5e/display/ui/hunter-roll-dialog.hbs',

    // Chat Message Partials
    'marketplace/rulesets/wod5e/display/ui/chat/chat-message-header.hbs',
    'marketplace/rulesets/wod5e/display/ui/chat/chat-message-roll.hbs',
    'marketplace/rulesets/wod5e/display/ui/chat/willpower-reroll.hbs',

    // Menu Partials
    'marketplace/rulesets/wod5e/display/ui/automation-menu.hbs',
    'marketplace/rulesets/wod5e/display/ui/storyteller-menu.hbs',
    'marketplace/rulesets/wod5e/display/ui/storyteller-menu/modification-menu.hbs',
    'marketplace/rulesets/wod5e/display/ui/storyteller-menu/custom-menu.hbs',
    'marketplace/rulesets/wod5e/display/ui/select-dialog.hbs',

    // Compendium partials
    'marketplace/rulesets/wod5e/display/ui/compendium-browser/parts/filter-splats.hbs',
    'marketplace/rulesets/wod5e/display/ui/compendium-browser/parts/filter-types.hbs'
  ]

  /* Load the template parts
   */
  return Loom.loadTemplates(templatePaths)
}
