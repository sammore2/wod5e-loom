import { expect, test, vi } from 'vitest'

vi.mock('../system/scripts/system-rolls.js', () => ({ WOD5eDice: {} }))
vi.mock('../system/actor/scripts/roll.js', () => ({ _onConfirmRoll: vi.fn() }))
vi.mock('../system/api/generate-localization.js', () => ({ generateLocalizedLabel: vi.fn() }))

import { wod5eAPI } from '../system/api/wod5e-api.js'

const paths = 'attributes.strength.value attributes.resolve.value'

test('soma os atributos salvos normalmente', async () => {
  const actor = { system: { attributes: { strength: { value: 1 }, resolve: { value: 3 } } } }
  expect(await wod5eAPI.getBasicDice({ valuePaths: paths, actor })).toBe(4)
})

test('atributo ausente nos dados conta 1, como a ficha mostra', async () => {
  const actor = { system: { attributes: { resolve: { value: 3 } } } }
  expect(await wod5eAPI.getBasicDice({ valuePaths: paths, actor })).toBe(4)
})

test('habilidade ausente continua contando 0', async () => {
  const actor = { system: { skills: {} } }
  expect(await wod5eAPI.getBasicDice({ valuePaths: 'skills.brawl.value', actor })).toBe(0)
})
