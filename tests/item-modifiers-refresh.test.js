import { expect, test } from 'vitest'

import { getSituationalModifiers } from '../system/scripts/rolls/situational-modifiers.js'

const bonus = (value) => ({ source: 'Suprema Cantora', value, paths: ['skills.performance'], activeWhen: { check: 'always' } })

test('an edited item modifier applies on the next roll without a reload', async () => {
  // The server row changes between rolls, as when the item sheet saves an edit.
  let serverItems = [{ id: 'i1', data: { bonuses: [bonus(2)] } }]
  globalThis.Loom = { api: { get: async () => ({ items: serverItems }) }, items: { contents: [] } }

  // Stale in-memory state from page load: must not be what the roll reads.
  const actor = { id: 'a1', system: {}, derivedData: { itemModifiers: [bonus(1)] }, _embeddedItems: [] }
  const roll = () => getSituationalModifiers({ actor, selectors: ['skills', 'skills.performance', 'social'] })

  expect((await roll()).map((m) => m.value)).toEqual([2])

  serverItems = [{ id: 'i1', data: { bonuses: [bonus(4)] } }]
  expect((await roll()).map((m) => m.value)).toEqual([4])
})
