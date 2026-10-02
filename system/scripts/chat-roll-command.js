/**
 * `/r 1dv`, `/r 3dm+2dg`... typed in the chat: dice named by a letter are rolled by the system itself, so the chat
 * gets the same card as a roll from the sheet (the vampire / hunger / hunter dice, criticals, messy results and so on)
 * instead of a plain pool of d10.
 *
 * LoomVTT calls the `chatRollCommand` hook for every `/r` before sending anything; returning false here means "the
 * system took care of it". Anything that is not purely system dice is left to the normal roller.
 */

// Letters of the system's dice, split the way WOD5E.api.Roll takes them.
const BASIC_DICE = new Set(['m', 'v', 'h', 'w'])
const ADVANCED_DICE = new Set(['g', 'r', 's'])

/** "3dm+2dg" -> { basicDice: 3, advancedDice: 2 }, or null if any part is not a system die. */
function parseDicePool(formula) {
  let basicDice = 0
  let advancedDice = 0
  const parts = String(formula ?? '').toLowerCase().replace(/\s+/g, '').split('+')
  if (parts.length === 0) return null

  for (const part of parts) {
    // A count (optional), the letter of the die, and nothing else: modifiers or other terms mean "not ours".
    const match = part.match(/^(\d*)d([a-z]+)$/)
    if (!match) return null
    const count = match[1] ? parseInt(match[1], 10) : 1
    const die = match[2]
    if (BASIC_DICE.has(die)) basicDice += count
    else if (ADVANCED_DICE.has(die)) advancedDice += count
    else return null
  }

  return basicDice + advancedDice > 0 ? { basicDice, advancedDice } : null
}

Loom.LoomHooks.on('chatRollCommand', (ctx) => {
  const pool = parseDicePool(ctx?.originalFormula ?? ctx?.formula)
  if (!pool) return

  // The roll belongs to a character (hunger and the like come from its sheet): the speaker's, or the user's own.
  const actor = ctx.actorId ? Loom.actors.get(ctx.actorId) : Loom.actors.get(Loom.ChatMessage.getSpeaker().actor)
  if (!actor) return

  void window.WOD5E.api.Roll({
    basicDice: pool.basicDice,
    advancedDice: pool.advancedDice,
    actor,
    data: actor.system,
    title: `/r ${ctx.originalFormula ?? ctx.formula}`,
    quickRoll: true,
    rollMode: ctx.mode
  })

  return false
})
