// Prune sheet parts at compile time. Loom renders every entry in PARTS,
// while sheets expect legacy-style pruning at render time
// (e.g. the limited view must not render for fully-visible actors).

export function installPartPruning(protos) {
  for (const proto of protos) {
    if (!proto || proto.__wod5ePartPruning) continue
    proto.__wod5ePartPruning = true

    const originalCompile = proto.compile
    if (typeof originalCompile !== 'function') continue

    proto.compile = async function () {
      await originalCompile.call(this)

      try {
        const partIds = Object.keys(this.constructor.PARTS ?? {})
        if (!partIds.length) return

        const renderOptions = { parts: [...partIds] }
        this._configureRenderOptions?.call(this, renderOptions)
        const allowed = new Set(renderOptions.parts ?? partIds)

        if (allowed.size === partIds.length) return

        const container = document.createElement('div')
        container.innerHTML = this.compiledHtml
        container.querySelectorAll('[data-application-part]').forEach((el) => {
          if (!allowed.has(el.dataset.applicationPart)) el.remove()
        })
        this.compiledHtml = container.innerHTML
      } catch (e) {
        console.error('World of Darkness 5e | Error pruning sheet parts:', e)
      }
    }
  }
}
