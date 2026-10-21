import { applySystemPatch } from './counters.js'

export const _onEditExceptionalPools = async function (event) {
  event.preventDefault()

  // Top-level variables
  const actor = this.actor

  // Gather and push the list of options and whether they're checked or not
  let options = ''
  for (const [key, value] of Object.entries(actor.system.exceptionaldicepools)) {
    if (!value.hidden) {
      const checkedStatus = value.active ? ' checked' : ''
      options += `
        <div class="flexrow exceptional-pool">
          <span>${value.displayName}</span>
          <input type="checkbox" class="exceptional-checkbox" name="${key}"${checkedStatus}>
        </div>`
    }
  }

  // Define the template to be used
  const content = `
    <form class="exceptional-pools-form">
      <div class="exceptional-pools-grid">
        ${options}
      </div>
    </form>`

  // Prompt the dialog
  const updatedPools = await Loom.LoomDialog.prompt({
    window: {
      title: Loom.i18n.localize('WOD5E.SPC.AddSkill')
    },
    position: {
      width: 820
    },
    // `derivedData.gamesystem` primeiro — `system.gamesystem` de um SPC fica travado no
    // valor de quando o ator foi criado (não persiste ao trocar "Tipo de Ator"; ver
    // comentário em `actor.js`/`prepareDerivedData`), então o diálogo saía com a cor/tema
    // do sistema errado.
    classes: ['wod5e', actor.derivedData?.gamesystem ?? actor.system.gamesystem, 'exceptional-edit', 'dialog'],
    content,
    ok: {
      callback: (event, button) => {
        const formData = new Loom.LoomFormData(button.closest('.loom-window').querySelector('form')).object
        const exceptionaldicepools = {}

        for (const [id, pool] of Object.entries(actor.system.exceptionaldicepools)) {
          exceptionaldicepools[id] = {
            active: !!formData[id],
            value: (pool?.value !== undefined && pool?.value !== null && pool?.value !== '') ? pool.value : 0
          }
        }

        return exceptionaldicepools
      }
    },
    modal: true
  })

  if (updatedPools) {
    const systemData = applySystemPatch(actor.systemData, [[['exceptionaldicepools'], updatedPools]])
    await actor.update({ systemData })
  }
}
