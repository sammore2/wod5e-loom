/**
 * `/r 1dv`, `/r 3dm+2dg`, `/r 2dh`... typed in the chat: dice named by a letter are rolled by the system itself, so the
 * chat gets the same card as a roll from the sheet (the vampire / hunger / hunter / werewolf dice, criticals, messy
 * results and so on) instead of a plain pool of d10.
 *
 * Each letter belongs to ONE game system (v and g: vampire, h and s: hunter, w and r: werewolf, m: mortal), and the card
 * is drawn with the dice of that system, not with those of the character that rolls: `1dh` from a vampire's sheet is
 * still a hunter die.
 *
 * LoomVTT calls the `chatRollCommand` hook for every `/r` before sending anything; returning false here means "the
 * system took care of it". Anything that is not purely system dice of a single system is left to the normal roller.
 */

import {
  MortalDie, VampireDie, VampireHungerDie, HunterDie, HunterDesperationDie, WerewolfDie, WerewolfRageDie
} from '../dice/splat-dice.js'
import { WOD5eDice } from './system-rolls.js'

// Letter -> game system and kind of die ('basic' or 'advanced'), read from the dice classes themselves.
const DICE = new Map(
  [MortalDie, VampireDie, VampireHungerDie, HunterDie, HunterDesperationDie, WerewolfDie, WerewolfRageDie]
    .map((die) => [die.DENOMINATION, { system: die.GAME_SYSTEM, type: die.DIE_TYPE }])
)

/** "3dv+2dg" -> { system: 'vampire', basicDice: 3, advancedDice: 2 }, or null if it is not a pool of one system's dice. */
function parseDicePool(formula) {
  let system = null
  let basicDice = 0
  let advancedDice = 0

  for (const part of String(formula ?? '').toLowerCase().replace(/\s+/g, '').split('+')) {
    // A count (optional), the letter of the die, and nothing else: modifiers or other terms mean "not ours".
    const match = part.match(/^(\d*)d([a-z]+)$/)
    if (!match) return null
    const count = match[1] ? parseInt(match[1], 10) : 1
    const die = DICE.get(match[2])
    if (!die) return null
    if (system && system !== die.system) return null // a pool cannot mix the dice of two systems
    system = die.system
    if (die.type === 'basic') basicDice += count
    else advancedDice += count
  }

  return system && basicDice + advancedDice > 0 ? { system, basicDice, advancedDice } : null
}

/**
 * True when the formula names one of this system's dice ("3dv", "2dg", "dv"), so it must never reach the engine's
 * plain d10 roller. A term only counts when it starts with a count or its letters are exactly a die of the system:
 * words such as "dmg" in a plain "/r 2d6 dmg" are not dice.
 */
function mentionsSystemDice(formula) {
  for (const term of String(formula ?? '').toLowerCase().split(/[+\-\s]+/)) {
    const match = term.match(/^(\d*)d([a-z]+)/)
    if (!match) continue
    const [, count, letters] = match
    if (count && [...letters].some((_, i) => DICE.has(letters.slice(0, letters.length - i)))) return true
    if (DICE.has(letters)) return true
  }
  return false
}

Loom.LoomHooks.on('chatRollCommand', (ctx) => {
  const formula = ctx?.originalFormula ?? ctx?.formula
  const pool = parseDicePool(formula)
  if (!pool) {
    // Dice of this system mixed with other terms (or with another system's dice) are refused instead of being rolled
    // as plain d10: in this game every roll is made with its own dice.
    if (!mentionsSystemDice(formula)) return
    const key = 'WOD5E.Chat.InvalidDicePool'
    const text = Loom.i18n.localize(key)
    Loom.ui?.notifications?.warn(text === key ? "Invalid dice pool. Use only this system's dice, e.g. /r 3dv+1dg" : text)
    return false
  }

  // The roll belongs to a character when there is one: the speaker's, or the user's own. Without one the system dice
  // are still rolled, as a plain pool with no sheet data (the dice counts come from the command itself).
  const actor = ctx.actorId ? Loom.actors.get(ctx.actorId) : Loom.actors.get(Loom.ChatMessage.getSpeaker().actor)

  const key = 'WOD5E.Chat.ChatRoll'
  const label = Loom.i18n.localize(key)

  void WOD5eDice.Roll({
    basicDice: pool.basicDice,
    advancedDice: pool.advancedDice,
    actor,
    data: actor?.system ?? {},
    system: pool.system,
    title: label === key ? 'Roll' : label,
    quickRoll: true,
    rollMode: ctx.mode
  })

  return false
})
