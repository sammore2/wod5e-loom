export async function _increaseHunger(actor, amount, rollMode) {
  // Automatically add hunger to the actor on a failure (for rouse checks)
  const hungerMax = actor.system.hunger.max
  const currentHunger = actor.system.hunger.value
  const newHungerAmount = Math.min(currentHunger + amount, hungerMax)

  // If no rollMode is provided, use the user's default
  if (!rollMode) rollMode = Loom.settings.get('core', 'rollMode')

  // If the actor is already at max hunger, send a message in the chat to warn them
  // that their hunger cannot be increased further
  if (amount > 0 && currentHunger === hungerMax) {
    Loom.ChatMessage.create({
      flags: {
        wod5e: {
          name: Loom.i18n.localize('WOD5E.VTM.HungerFull1'),
          img: 'marketplace/rulesets/wod5e/assets/icons/dice/vampire/bestial-failure.png',
          description: Loom.i18n.localize('WOD5E.VTM.HungerFull2')
        }
      }
    })
  }

  // Update the actor with the new amount of rage
  actor.update({ 'system.hunger.value': newHungerAmount })
}
