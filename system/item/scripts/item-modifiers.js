import { getSelectorsList } from '../../api/get-selectors-list.js'
import { getActorDataPathsList } from '../../api/get-actor-data-paths.js'

const bonusTemplate = 'marketplace/rulesets/wod5e/display/shared/items/parts/modifier-display.hbs'

export const _onAddModifier = async function (event) {
  event.preventDefault()

  // Top-level variables
  const item = this.item

  // Secondary variables
  const bonusData = {
    item,
    bonus: {
      source: Loom.i18n.localize('WOD5E.Modifier.NewModifier'),
      value: 1,
      paths: [],
      displayWhenInactive: false,
      activeWhen: {
        check: 'always'
      }
    },
    modifierSelectors: getSelectorsList(),
    // Only meaningful for an item already on an actor — a world-level item has
    // nothing to check a path against, so this is just empty and the field falls
    // back to plain text (no autocomplete, still works if you know the path).
    // `item.parent` isn't populated on this wrapped document (confirmed live: only
    // `item.actorId`, a bare string ID, is) — resolve the real actor from it instead.
    actorPaths: getActorDataPathsList(item.actorId ? Loom.actors.get(item.actorId) : item.parent)
  }

  // Render the template
  const bonusContent = await Loom.renderTemplate(
    bonusTemplate,
    bonusData
  )

  const result = await Loom.LoomDialog.input({
    // `LoomDialog.input()` defaults to 400px wide — way too narrow for a 3-column
    // row of PT-BR labels ("Ativar quando" / "Caminho a Verificar" / "Valor a
    // Verificar"), which is why they wrapped and the whole form looked cramped.
    width: 620,
    window: {
      title: bonusData.bonus.source
    },
    content: bonusContent,
    ok: {
      icon: 'fas fa-check',
      label: Loom.i18n.localize('WOD5E.Add')
    },
    // `LoomDialog.input()` already adds its own Cancel button by default — passing
    // this as `buttons: [...]` (an ADDITIONAL button) instead of `cancel: {...}`
    // (an override of the default one) was producing two "Cancelar" buttons side
    // by side. `cancel:` merges into the built-in one instead of appending a new one.
    cancel: {
      icon: 'fas fa-times',
      label: Loom.i18n.localize('WOD5E.Cancel')
    },
    render: (_event, dialog) => {
      // Initialize flexdataset for each input
      const selectorInputs = dialog.element.querySelectorAll('.modifier-selectors')
      selectorInputs.forEach(function (element) {
        $(element).flexdatalist({
          selectionRequired: true,
          minLength: 1,
          multiple: true,
          // Matches the WORKING init in wod-item-base.js's onRender() (used for the
          // read-only list on the sheet's own Modificadores tab) exactly — this dialog's
          // version was missing `searchIn`/`data` entirely and had `valueProperty: 'value'`
          // where `getSelectorsList()` items are `{id, displayName}` (no `.value` field).
          // Confirmed live: picking "Todos Pools Sociais" saved "3" (an index) into the
          // hidden input, not "social" — the modifier saved fine but matched nothing on
          // any actual roll, which is why the selection looked like it "didn't show up".
          searchIn: ['displayName'],
          valueProperty: 'id',
          searchContain: true,
          data: bonusData.modifierSelectors
        })
      })

      // Same idea for "Caminho a Verificar", but its own list (actorPaths — raw actor
      // data paths, not roll selectors) and single-select, not multiple: a condition
      // checks exactly one field.
      const pathInputs = dialog.element.querySelectorAll('.modifier-paths')
      pathInputs.forEach(function (element) {
        $(element).flexdatalist({
          minLength: 1,
          multiple: false,
          searchIn: ['displayName'],
          valueProperty: 'id',
          searchContain: true,
          data: bonusData.actorPaths
        })
      })

      const activeWhenCheck = dialog.element.querySelector('#activeWhenCheck')
      const activeWhenPath = dialog.element.querySelector('.active-when-path')
      const activeWhenValue = dialog.element.querySelector('.active-when-value')

      activeWhenPath.style.visibility = ['isEqual', 'isPath'].includes(activeWhenCheck.value)
        ? 'visible'
        : 'hidden'
      activeWhenValue.style.visibility = activeWhenCheck.value === 'isEqual' ? 'visible' : 'hidden'

      activeWhenCheck.addEventListener('change', function () {
        activeWhenPath.style.visibility = ['isEqual', 'isPath'].includes(activeWhenCheck.value)
          ? 'visible'
          : 'hidden'
        activeWhenValue.style.visibility =
          activeWhenCheck.value === 'isEqual' ? 'visible' : 'hidden'
      })
    }
  })

  if (result !== 'cancel') {
    const source = result.modifierSource ?? null
    const value = result.modifierValue ?? null
    const displayWhenInactive = result.displayModifierWhenInactive ?? false

    const paths = result.modifier?.split(',') ?? null

    const activeWhen = {
      check: result.activeWhenCheck ?? null,
      path: result.activeWhenPath ?? null,
      value: result.activeWhenValue ?? null
    }

    // `situational-modifiers.js`'s filterModifiers() does `unless.some(...)` — it has
    // always expected an array of selector names (same shape as `paths` above), but
    // this saved the plain-text input's raw string instead. Harmless while empty
    // (`unless && ...` short-circuits on falsy), but typing anything into "A não ser
    // que" and saving crashed every roll check against this actor's items afterward
    // (`TypeError: unless.some is not a function`) since a non-empty string has no
    // `.some`. Split it the same way `paths` already is.
    const unless = result.unless ? result.unless.split(',') : null

    const newModifier = {
      source,
      value,
      paths,
      unless,
      displayWhenInactive,
      activeWhen
    }

    // Define the existing list of modifiers
    const itemModifiers = item.system.bonuses || []

    // Add the new bonus to the list
    itemModifiers.push(newModifier)

    // Update the item
    await item.update({ 'system.bonuses': itemModifiers })
  }
}

export const _onDeleteModifier = async function (event, target) {
  event.preventDefault()

  // Top-level variables
  const item = this.item
  const key = target.getAttribute('data-bonus')

  // Define the existing list of modifiers
  const itemModifiers = item.system.bonuses || []

  // Remove the bonus from the list
  itemModifiers.splice(key, 1)

  // Update the item
  await item.update({ 'system.bonuses': itemModifiers })
}

export const _onEditModifier = async function (event, target) {
  event.preventDefault()

  // Top-level variables
  const item = this.item
  const key = target.getAttribute('data-bonus')

  // Secondary variables
  const bonusData = {
    item,
    bonus: item.system.bonuses[key],
    modifierSelectors: getSelectorsList(),
    // See the matching comment in _onAddModifier above.
    actorPaths: getActorDataPathsList(item.actorId ? Loom.actors.get(item.actorId) : item.parent)
  }

  // Render the template
  const bonusContent = await Loom.renderTemplate(
    bonusTemplate,
    bonusData
  )

  const result = await Loom.LoomDialog.input({
    // See the matching comment in _onAddModifier above.
    width: 620,
    window: {
      title: bonusData.bonus.source
    },
    content: bonusContent,
    ok: {
      icon: 'fas fa-check',
      label: Loom.i18n.localize('WOD5E.Save')
    },
    // See the matching comment in _onAddModifier above.
    cancel: {
      icon: 'fas fa-times',
      label: Loom.i18n.localize('WOD5E.Cancel')
    },
    render: (_event, dialog) => {
      // Initialize flexdataset for each input
      const selectorInputs = dialog.element.querySelectorAll('.modifier-selectors')
      selectorInputs.forEach(function (element) {
        $(element).flexdatalist({
          selectionRequired: true,
          minLength: 1,
          multiple: true,
          // See the matching comment in _onAddModifier above — needs searchIn/data too,
          // not just valueProperty, to actually match wod-item-base.js's working init.
          searchIn: ['displayName'],
          valueProperty: 'id',
          searchContain: true,
          data: bonusData.modifierSelectors
        })
      })

      // See the matching comment in _onAddModifier above.
      const pathInputs = dialog.element.querySelectorAll('.modifier-paths')
      pathInputs.forEach(function (element) {
        $(element).flexdatalist({
          minLength: 1,
          multiple: false,
          searchIn: ['displayName'],
          valueProperty: 'id',
          searchContain: true,
          data: bonusData.actorPaths
        })
      })

      const activeWhenCheck = dialog.element.querySelector('#activeWhenCheck')
      const activeWhenPath = dialog.element.querySelector('.active-when-path')
      const activeWhenValue = dialog.element.querySelector('.active-when-value')

      activeWhenPath.style.visibility = ['isEqual', 'isPath'].includes(activeWhenCheck.value)
        ? 'visible'
        : 'hidden'
      activeWhenValue.style.visibility = activeWhenCheck.value === 'isEqual' ? 'visible' : 'hidden'

      activeWhenCheck.addEventListener('change', function () {
        activeWhenPath.style.visibility = ['isEqual', 'isPath'].includes(activeWhenCheck.value)
          ? 'visible'
          : 'hidden'
        activeWhenValue.style.visibility =
          activeWhenCheck.value === 'isEqual' ? 'visible' : 'hidden'
      })
    }
  })

  if (result !== 'cancel') {
    const source = result.modifierSource ?? null
    const value = result.modifierValue ?? null
    const displayWhenInactive = result.displayModifierWhenInactive ?? false

    const paths = result.modifier?.split(',') ?? null

    const activeWhen = {
      check: result.activeWhenCheck ?? null,
      path: result.activeWhenPath ?? null,
      value: result.activeWhenValue ?? null
    }

    // See the matching comment in _onAddModifier above — needs to stay an array.
    const unless = result.unless ? result.unless.split(',') : null

    // Define the existing list of modifiers
    const itemModifiers = item.system.bonuses

    // Update the existing bonus with the new data
    itemModifiers[key] = {
      source,
      value,
      paths,
      unless,
      displayWhenInactive,
      activeWhen
    }

    // Update the item
    await item.update({ 'system.bonuses': itemModifiers })
  }
}
