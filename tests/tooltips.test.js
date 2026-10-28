import { afterEach, expect, test, vi } from 'vitest'
import { limitTooltipHeight, registerTooltips, tooltipCard } from '../system/scripts/tooltips.js'

afterEach(() => vi.unstubAllGlobals())

test('card escapa nomes e aceita descrição formatada', () => {
  vi.stubGlobal('window', { location: { origin: 'https://loom.test' } })
  const card = tooltipCard({ name: '<Poder>', data: { description: '<p>Descrição</p>' }, imgUrl: 'javascript:alert(1)' })
  expect(card).toContain('&lt;Poder&gt;')
  expect(card).toContain('<p>Descrição</p>')
  expect(card).not.toContain('javascript:')
})

test('resolve itens da ficha e do compêndio pelas rotas correspondentes', async () => {
  const get = vi.fn(async () => ({ name: 'Poder', type: 'power', data: { description: 'Texto' } }))
  let renderer
  vi.stubGlobal('window', { location: { origin: 'https://loom.test' }, addEventListener: vi.fn(), WOD5E: { ItemTypes: { getList: () => ({ power: {} }) } } })
  vi.stubGlobal('document', { addEventListener: vi.fn(), documentElement: { clientHeight: 900, style: { setProperty: vi.fn() } } })
  vi.stubGlobal('Loom', { api: { get }, tooltips: { register: (type, render) => { renderer = render } } })
  registerTooltips()
  const el = { dataset: { tooltipId: 'p1' }, getBoundingClientRect: () => ({ top: 300, bottom: 320 }) }
  expect(await renderer({ el })).toContain('Poder')
  expect(get).toHaveBeenLastCalledWith('/items/p1')
  el.dataset.tooltipSource = 'source'
  el.dataset.tooltipPack = 'pack1'
  expect(await renderer({ el })).toContain('Texto')
  expect(get).toHaveBeenLastCalledWith('/compendium/sources/pack1/entries/p1')
})

test('roda do mouse percorre a descrição longa enquanto o card está aberto', () => {
  const handlers = {}
  const text = { scrollHeight: 900, clientHeight: 300, scrollTop: 0 }
  class Target { closest() { return this } }
  vi.stubGlobal('Element', Target)
  vi.stubGlobal('window', { addEventListener: vi.fn() })
  vi.stubGlobal('document', { addEventListener: (type, handler) => { handlers[type] = handler }, querySelector: () => text })
  vi.stubGlobal('Loom', { tooltips: { register: vi.fn() } })
  registerTooltips()
  const preventDefault = vi.fn()
  handlers.wheel({ target: new Target(), deltaY: 40, deltaMode: 0, preventDefault })
  expect(text.scrollTop).toBe(40)
  expect(preventDefault).toHaveBeenCalledOnce()
})

test('limita a altura ao maior espaço disponível acima ou abaixo do item', () => {
  const setProperty = vi.fn()
  vi.stubGlobal('document', { documentElement: { clientHeight: 900, style: { setProperty } } })
  limitTooltipHeight({ getBoundingClientRect: () => ({ top: 300, bottom: 320 }) })
  expect(setProperty).toHaveBeenCalledWith('--wod5e-tooltip-height', '562px')
  limitTooltipHeight({ getBoundingClientRect: () => ({ top: 800, bottom: 820 }) })
  expect(setProperty).toHaveBeenLastCalledWith('--wod5e-tooltip-height', '782px')
})

test('usa a ficha quando há tipo de ator e o tipo do item fora dela', async () => {
  let render
  vi.stubGlobal('window', { location: { origin: 'https://loom.test' }, addEventListener: vi.fn(), WOD5E: { ItemTypes: { getList: () => ({ power: { splat: 'vampire' }, gear: { splat: 'core' } }) } } })
  vi.stubGlobal('document', { addEventListener: vi.fn(), documentElement: { clientHeight: 900, style: { setProperty: vi.fn() } } })
  const get = vi.fn(async () => ({ name: 'Item', type: 'power', data: {} }))
  vi.stubGlobal('Loom', { api: { get }, tooltips: { register: (_, callback) => { render = callback } } })
  registerTooltips()
  const el = { dataset: { tooltipId: '1' }, getBoundingClientRect: () => ({ top: 300, bottom: 320 }), closest: () => null }
  expect(await render({ el })).toContain('data-wod5e-theme="vampire"')
  el.closest = () => ({ classList: { contains: (type) => type === 'hunter' } })
  expect(await render({ el })).toContain('data-wod5e-theme="hunter"')
  el.closest = () => null
  get.mockResolvedValue({ name: 'Item', type: 'gear', data: {} })
  expect(await render({ el })).not.toContain('data-wod5e-theme=')
})
