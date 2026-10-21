export const _onConfigureSources = async function () {
  const currentUser = Loom.users.current
  const currentSources = currentUser.flags?.wod5e?.compendiumBrowser?.sources || {}

  // Below, we get all the sources that are relevant to the current instance;
  // aka, all compendiums in the currently active game
  const allSources = {
    world: {
      id: 'world',
      label: Loom.i18n.localize('PACKAGE.Type.world'),
      active: true
    }
  }
  const compendiumsItemsList = Loom.packs.filter(
    (compendium) => compendium.type === 'Item'
  )
  for (const compendium of compendiumsItemsList) {
    allSources[compendium.id] = {
      id: compendium.id,
      label: compendium.name,
      active: true
    }
  }
  const mergedSources = Loom.utils.mergeObject(allSources, currentSources, { inplace: false })

  // Mark old saved sources as hidden
  // Basically the concern is if someone deactivates a module
  // and it isn't in the list then we're gonna get a lot of "undefined"s
  // but we also want to 'save' the user's choice if the module gets re-enabled
  // And thus, we have this pre-processing check that "hides" (doesn't show)
  // options if they aren't in the allSources list but are in the currentSources list
  for (const [sourceKey, sourceData] of Object.entries(currentSources)) {
    if (!allSources[sourceKey]) {
      mergedSources[sourceKey] = {
        ...sourceData,
        id: sourceData.id ?? sourceKey,
        hidden: true
      }
    }
  }

  // Gather and push the list of non-hidden options and whether they're checked or not
  let options = ''
  for (const [id, value] of Object.entries(mergedSources)) {
    if (value?.hidden) continue

    const checkedStatus = value.active ? ' checked' : ''
    options += `
      <div class="flexrow source-option">
        <input type="checkbox" class="source-checkbox" name="${id}"${checkedStatus}>
        <span>
          ${value.label}
        </span>
      </div>`
  }

  // Define the template to be used
  const content = `
    <form>
      <div class="form-group sources-list">
        ${options}
      </div>
    </form>`

  // Prompt the dialog
  const updatedSources = await Loom.LoomDialog.prompt({
    window: {
      title: Loom.i18n.localize('WOD5E.CompendiumBrowser.ConfigureSources')
    },
    classes: ['wod5e', 'dialog'],
    content,
    ok: {
      callback: (event, button) => {
        const formData = new Loom.LoomFormData(button.closest('.loom-window').querySelector('form')).object
        const sources = {}

        for (const [id] of Object.entries(mergedSources)) {
          if (!allSources[id]) continue

          sources[id] = {
            active: !!formData[id]
          }
        }

        return sources
      }
    },
    modal: true
  })

  if (updatedSources) {
    // Update the sources on the user flag
    await currentUser.update({
      ['flags.wod5e.compendiumBrowser.sources']: updatedSources
    })

    // Re-render the compendium browser once settings are updated if it's open
    const CompendiumBrowserApplication = Loom.windowManager.get(
      'wod5e-compendium-browser'
    )
    if (CompendiumBrowserApplication) {
      CompendiumBrowserApplication.render()
    }
  }
}
