/**
 * Extend the base ItemDirectory functionality to ensure that
 * embedded/actor-owned items are never displayed in the World Items sidebar.
 * @extends {ItemDirectory}
 */
const BaseDirectory =
  (typeof Loom !== 'undefined' && Loom.applications?.sidebar?.tabs?.ItemDirectory) ||
  (typeof Loom !== 'undefined' && Loom.LoomSidebarTab) ||
  class {}

export class WoDItemDirectory extends BaseDirectory {
  async _onRender(context, options) {
    await super._onRender?.(context, options)
    this._filterActorItems()
    this._observeDirectory()
  }

  _filterActorItems() {
    const html = this.element
    if (!html) return

    const entries = html.querySelectorAll('.directory-list [data-entry-id], .directory-list [data-document-id]')
    entries.forEach((el) => {
      const id = el.getAttribute('data-entry-id') || el.getAttribute('data-document-id')
      const item = Loom.items?.get?.(id)
      if (item && (item.actorId || item.parent?.id || item.actor)) {
        el.remove()
      }
    })
  }

  _observeDirectory() {
    const list = this.element?.querySelector('.directory-list')
    if (!list || this._observer) return
    this._observer = new MutationObserver(() => this._filterActorItems())
    this._observer.observe(list, { childList: true, subtree: true })
  }
}
