// Rich cards use Loom's delegated hover handling and sanitizer.
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])

export function tooltipCard(item, theme = '') {
  if (!item?.name) return null
  const data = item.systemData ?? item.system ?? item.data ?? {}
  const description = data.description?.value ?? data.description ?? ''
  const image = item.imgUrl ?? item.img
  let imageHtml = ''
  if (image) {
    try {
      const url = new URL(image, window.location.origin)
      if (url.protocol === 'http:' || url.protocol === 'https:') imageHtml = `<img class="tip__img" src="${escapeHtml(image)}" alt="">`
    } catch { /* Invalid image URLs are omitted. */ }
  }
  const themeAttr = ['vampire', 'werewolf', 'hunter', 'mortal'].includes(theme) ? ` data-wod5e-theme="${theme}"` : ''
  return `<div class="tip wod5e-tip"${themeAttr}><div class="tip__head">${imageHtml}<div class="tip__title">${escapeHtml(item.name)}</div></div>${typeof description === 'string' && description.trim() ? `<div class="tip__text">${description}</div>` : ''}</div>`
}

export function limitTooltipHeight(el) {
  const rect = el.getBoundingClientRect()
  const height = document.documentElement.clientHeight
  const available = Math.max(rect.top, height - rect.bottom) - 18
  document.documentElement.style.setProperty('--wod5e-tooltip-height', `${Math.max(0, Math.min(height - 18, available))}px`)
}

export function registerTooltips() {
  if (!Loom.tooltips?.register) return
  Loom.tooltips.register('wod5e-card', async ({ el }) => {
    const id = el.dataset.tooltipId
    if (!id) return null
    try {
      let item
      if (el.dataset.tooltipSource === 'source') {
        item = await Loom.api.get(`/compendium/sources/${encodeURIComponent(el.dataset.tooltipPack)}/entries/${encodeURIComponent(id)}`)
        if (!window.WOD5E?.ItemTypes?.getList({})?.[item?.type]) return null
      } else if (el.dataset.tooltipSource === 'pack') {
        const pack = await Loom.api.get(`/compendium/${encodeURIComponent(el.dataset.tooltipPack)}`)
        if (pack.type?.toLowerCase() !== 'item') return null
        item = pack.entries?.find((entry) => entry.id === id)
      } else {
        item = await Loom.api.get(`/items/${encodeURIComponent(id)}`)
      }
      const sheet = el.closest?.('.actor.sheet')
      const sheetTheme = ['vampire', 'werewolf', 'hunter', 'mortal'].find((type) => sheet?.classList.contains(type))
      const itemTheme = window.WOD5E?.ItemTypes?.getList({})?.[item?.type]?.splat
      const card = tooltipCard(item, sheetTheme ?? itemTheme)
      if (card) limitTooltipHeight(el)
      return card
    } catch { return null }
  }, 'wod5e')

  document.addEventListener('pointerover', (event) => {
    const target = event.target instanceof Element ? event.target : null
    const row = target?.closest('[data-action="open-item"][data-entity-type="item"], .cp-entry-row, [data-drag="true"][data-item-id]')
    if (!row || row.dataset.tooltipType || target.closest('button, .item-controls')) return
    const windowEl = row.closest('.loom-window')
    const windowId = windowEl?.id ?? ''
    const source = windowId.startsWith('compendium-source-') ? 'source' : windowId.startsWith('compendium-pack-') ? 'pack' : ''
    if (row.classList.contains('cp-entry-row') && !source) return
    const id = row.dataset.entryId ?? row.dataset.itemId ?? row.dataset.id
    if (!id) return
    row.dataset.tooltipType = 'wod5e-card'
    row.dataset.tooltipId = id
    if (source) {
      row.dataset.tooltipSource = source
      row.dataset.tooltipPack = windowId.slice(`compendium-${source}-`.length)
    }
  }, true)

  const resizeTooltip = () => {
    const anchor = document.querySelector('[data-tooltip-type="wod5e-card"][aria-describedby="loom-tooltip"]')
    if (anchor) limitTooltipHeight(anchor)
  }
  window.addEventListener('resize', resizeTooltip)
  document.addEventListener('scroll', resizeTooltip, true)

  document.addEventListener('wheel', (event) => {
    const target = event.target instanceof Element ? event.target : null
    if (!target?.closest('[aria-describedby="loom-tooltip"]')) return
    const text = document.querySelector('.loom-tooltip:not([hidden]) .wod5e-tip .tip__text')
    if (!text || text.scrollHeight <= text.clientHeight) return
    const previous = text.scrollTop
    const amount = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? text.clientHeight : 1)
    text.scrollTop += amount
    if (text.scrollTop !== previous) event.preventDefault()
  }, { passive: false })
}
