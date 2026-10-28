import { afterEach, expect, test, vi } from 'vitest'

vi.mock('../system/api/def/itemtypes.js', () => ({ ItemTypes: { getList: () => ({}) } }))
vi.mock('../system/api/def/disciplines.js', () => ({ Disciplines: { getList: () => ({ animalism: {}, auspex: {}, celerity: {}, dominate: {}, oblivion: {} }) } }))
vi.mock('../system/actor/scripts/on-sort-item.js', () => ({ _onSortItem: vi.fn() }))
vi.mock('../system/actor/scripts/counters.js', () => ({ applySystemPatch: vi.fn() }))
vi.mock('../system/scripts/embedded-items.js', () => ({ createEmbeddedItems: vi.fn(), deleteEmbeddedItems: vi.fn(), updateItemData: vi.fn(), getActorItems: vi.fn() }))

import { ActorUX } from '../system/actor/scripts/actor-ux.js'

afterEach(() => vi.restoreAllMocks())

test.each(['dominate', 'animalism'])('drop preserva a disciplina %s do poder', async (discipline) => {
  globalThis.Loom = { utils: { deepClone: structuredClone } }
  const create = vi.spyOn(ActorUX, '_onDropItemCreate').mockResolvedValue(true)
  const target = { closest: (selector) => selector === '[data-discipline]' ? { dataset: { discipline: 'celerity' } } : {} }
  const actor = { uuid: 'Actor.test', type: 'vampire', systemData: { selectedDiscipline: 'oblivion' } }
  await ActorUX._onDropItem({ target }, actor, {
    uuid: 'Compendium.test.power', data: { name: 'Poder', type: 'power', system: { discipline } }
  })
  expect(create.mock.calls[0][1].system.discipline).toBe(discipline)
})


