import { Disciplines } from '../../api/def/disciplines.js'
import { Edges } from '../../api/def/edges.js'
import { Gifts } from '../../api/def/gifts.js'

export const _onCreatePower = async function (event, target) {
  event.preventDefault()

  // Top-level variables
  const actor = this.actor
  const powerType = target.getAttribute('data-type')

  // Variables yet to be defined
  let powersList = {}
  let label = ''
  let titleLabel = ''

  // Gather and push the list of options to the 'options' variable
  if (powerType === 'discipline') {
    powersList = Disciplines.getList({})
    label = Loom.i18n.localize('WOD5E.VTM.SelectDiscipline')
    titleLabel = Loom.i18n.localize('WOD5E.VTM.AddDiscipline')
  } else if (powerType === 'gift') {
    powersList = Gifts.getList({})
    label = Loom.i18n.localize('WOD5E.WTA.SelectGift')
    titleLabel = Loom.i18n.localize('WOD5E.WTA.AddGift')
  } else if (powerType === 'edge') {
    powersList = Edges.getList({})
    label = Loom.i18n.localize('WOD5E.HTR.SelectEdge')
    titleLabel = Loom.i18n.localize('WOD5E.HTR.AddEdge')
  }

  // `StringField.choices` espera string por chave — `getList()` devolve um
  // objeto ({label, displayName, ...}) por chave. Sem isto, o dropdown
  // mostrava "[object Object]" pros três tipos de poder.
  const powersChoices = Object.fromEntries(
    Object.entries(powersList).map(([key, val]) => [key, val.displayName || val.label || key])
  )

  // Build the options for the select dropdown
  const content = new Loom.fields_v14.StringField({
    choices: powersChoices,
    label,
    required: true
  }).toFormGroup(
    {},
    {
      name: 'power'
    }
  ).outerHTML

  // Prompt a dialog to determine which edge we're adding
  const powerSelected = await Loom.LoomDialog.prompt({
    window: {
      title: titleLabel
    },
    // `derivedData.gamesystem` primeiro — mesmo motivo de `exceptional-dicepools.js`.
    classes: ['wod5e', actor.derivedData?.gamesystem ?? actor.system.gamesystem, 'dialog'],
    content,
    ok: {
      callback: (event, button, dialog) =>
        new Loom.LoomFormData(dialog.getBody()).object.power
    },
    modal: true
  })

  if (powerSelected) {
    // If the power wasn't already visible, make it visible
    actor.update({ [`system.${powerType}s.${powerSelected}.visible`]: true })
  }
}

export const _onDeletePower = async function (event, target) {
  const actor = this.actor
  const powerType = target.getAttribute('data-type')
  const powerId = target.getAttribute('data-id')

  if (powerType === 'power') {
    actor.update({ [`system.disciplines.${powerId}.visible`]: false })
  } else if (powerType === 'perk') {
    // O template (`spc-edges.hbs`) manda `data-type="perk"` neste botão (mesmo
    // valor usado por `searchItem`/`createItem` na mesma linha) — `'edge'` nunca
    // batia, então "Deletar" na categoria de Trunfo do SPC não fazia nada.
    actor.update({ [`system.edges.${powerId}.visible`]: false })
  } else if (powerType === 'gift') {
    actor.update({ [`system.gifts.${powerId}.visible`]: false })
  }
}
