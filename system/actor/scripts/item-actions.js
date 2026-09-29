// Definition classes
import { ItemTypes } from '../../api/def/itemtypes.js'
import { Disciplines } from '../../api/def/disciplines.js'
import { Edges } from '../../api/def/edges.js'
import { Gifts } from '../../api/def/gifts.js'
import { Features } from '../../api/def/features.js'
import { Weapons } from '../../api/def/weapons.js'
// Localization function
import { generateLocalizedLabel } from '../../api/generate-localization.js'
// Data item format function
import { formatDataItemId } from './format-data-item-id.js'
// Various update functions
import { _updateSelectedPerk } from '../htr/scripts/edges.js'
import { _updateSelectedDisciplinePower, _updateSelectedDiscipline } from '../vtm/scripts/disciplines.js'
import { _updateSelectedGiftPower, _updateSelectedGift } from '../wta/scripts/gifts.js'
// Compendium Browser Application
import { CompendiumBrowserApplication } from '../../applications/compendium-browser/compendium-bowser.js'
// Embedded item management
import { createEmbeddedItems, deleteItem } from '../../scripts/embedded-items.js'

export const _onCreateItem = async function (event, target) {
  event.preventDefault()

  // Top-level variables
  const actor = this.actor
  const itemsList = ItemTypes.getList({})
  const type = target.getAttribute('data-type')
  let subtype = target.getAttribute('data-subtype')

  // Variables to be defined later
  let itemName = ''
  let selectLabel = ''
  let itemOptions = {}
  let itemData = {}

  // Define the actor's gamesystem, defaulting to "mortal" if it's not in the systems list.
  // `derivedData.gamesystem` primeiro — `system.gamesystem` de um SPC fica travado no
  // valor de quando o ator foi criado (não persiste ao trocar "Tipo de Ator"; ver
  // comentário em `actor.js`/`prepareDerivedData`).
  const system = actor.derivedData?.gamesystem ?? actor.system.gamesystem

  // Generate item options and the select label based on item type
  switch (type) {
    case 'power':
      selectLabel = Loom.i18n.localize('WOD5E.VTM.SelectDiscipline')
      itemOptions = Disciplines.getList({})
      break
    case 'perk':
      selectLabel = Loom.i18n.localize('WOD5E.HTR.SelectEdge')
      itemOptions = Edges.getList({})
      break
    case 'gift':
      selectLabel = Loom.i18n.localize('WOD5E.WTA.SelectGift')
      itemOptions = Gifts.getList({})
      break
    case 'feature':
      selectLabel = Loom.i18n.localize('WOD5E.ItemsList.SelectFeature')
      itemOptions = Features.getList({})
      break
    case 'weapon':
      selectLabel = Loom.i18n.localize('WOD5E.EquipmentList.SelectWeaponType')
      itemOptions = Weapons.getList({})
      break
  }

  // Create item if subtype is already defined or not needed
  if (subtype || Loom.utils.isEmpty(itemOptions)) {
    // Generate the item name
    itemName = subtype ? generateLocalizedLabel(subtype, type) : itemsList[type].label

    // Generate item name based on type
    switch (type) {
      case 'power':
        itemName = Loom.i18n.format('WOD5E.VTM.NewStringPower', { string: itemName })
        break
      case 'perk':
        itemName = Loom.i18n.format('WOD5E.HTR.NewStringPerk', { string: itemName })
        break
      case 'gift':
        if (subtype && subtype === 'rite') {
          itemName = Loom.i18n.format('WOD5E.NewString', { string: itemName })
        } else {
          itemName = Loom.i18n.format('WOD5E.WTA.NewStringGift', { string: itemName })
        }
        break
      case 'edgepool':
        itemName = Loom.i18n.format('WOD5E.HTR.NewStringEdgePool', { string: itemName })
        break
      case 'feature':
        itemName = Loom.i18n.format('WOD5E.NewString', { string: itemName })
        break
      case 'weapon':
        itemName = Loom.i18n.format('WOD5E.EquipmentList.NewStringWeapon', { string: itemName })
        break
      default:
        itemName = Loom.i18n.format('WOD5E.NewString', { string: itemName })
        break
    }

    // Append subtype data (if one is applicable)
    if (subtype) {
      itemData = await appendSubtypeData(type, subtype, itemData)
    }

    // Create the item
    await createItem(actor, itemName, type, itemData)
    // If a power/gift was created, ensure the panel switches to the correct one
    if (type === 'power' && subtype) {
      await _updateSelectedDiscipline(actor, subtype)
    } else if (type === 'gift' && subtype) {
      await _updateSelectedGift(actor, subtype)
    }
    await this._reloadDocument?.()
  } else {
    // Build the options for the select dropdown
    // Convert from {key: {displayName, label, ...}} to {key: "Label"} for StringField
    const itemChoices = Object.fromEntries(
      Object.entries(itemOptions).map(([key, val]) => [key, val.displayName || val.label || key])
    )
    // Se já tem uma disciplina/edge/gift selecionada na árvore, o diálogo abre com ela
    // pré-marcada — sem isso o `<select>` sempre abre no primeiro item por padrão do HTML,
    // não no que o usuário já tinha escolhido.
    const preSelected = type === 'power'
      ? actor.system?.selectedDiscipline
      : type === 'perk'
        ? actor.system?.selectedEdge
        : type === 'gift'
          ? actor.system?.selectedGift
          : undefined
    const content = new Loom.fields_v14.StringField({
      choices: itemChoices,
      label: selectLabel,
      required: true,
      initial: preSelected
    }).toFormGroup(
      {},
      {
        name: 'subtypeSelection'
      }
    ).outerHTML


    // Prompt the dialog to determine which item subtype we're adding
    const subtypeSelection = await Loom.LoomDialog.prompt({
      window: {
        title: Loom.i18n.localize('WOD5E.Add')
      },
      classes: ['wod5e', system, 'dialog'],
      content,
      ok: {
        callback: (event, button, dialog) =>
          new Loom.LoomFormData(dialog.getBody()).object.subtypeSelection
      },
      modal: true
    })

    if (subtypeSelection) {
      itemData = await appendSubtypeData(type, subtypeSelection, itemData)

      // Generate the item name
      itemName = subtypeSelection
        ? generateLocalizedLabel(subtypeSelection, type)
        : itemsList[type].label

      // Generate item name based on type
      switch (type) {
        case 'power':
          itemName = Loom.i18n.format('WOD5E.VTM.NewStringPower', { string: itemName })
          break
        case 'perk':
          itemName = Loom.i18n.format('WOD5E.HTR.NewStringPerk', { string: itemName })
          break
        case 'gift':
          if (subtypeSelection === 'rite') {
            itemName = Loom.i18n.format('WOD5E.NewString', { string: itemName })
          } else {
            itemName = Loom.i18n.format('WOD5E.WTA.NewStringGift', { string: itemName })
          }
          break
        case 'edgepool':
          itemName = Loom.i18n.format('WOD5E.HTR.NewStringEdgePool', { string: itemName })
          break
        case 'feature':
          itemName = Loom.i18n.format('WOD5E.NewString', { string: itemName })
          break
        case 'weapon':
          itemName = Loom.i18n.format('WOD5E.EquipmentList.NewStringWeapon', { string: itemName })
          break
        default:
          itemName = Loom.i18n.format('WOD5E.NewString', { string: itemName })
          break
      }

      // Create the item
      await createItem(actor, itemName, type, itemData)
      // If a power/gift was created, ensure the panel switches to the correct one
      if (type === 'power' && subtypeSelection) {
        await _updateSelectedDiscipline(actor, subtypeSelection)
      } else if (type === 'gift' && subtypeSelection) {
        await _updateSelectedGift(actor, subtypeSelection)
      }
      await this._reloadDocument?.()
    }
  }
}

// Open the item sheet
export const _onItemOpen = async function (event, target) {
  event.preventDefault()
  const itemId = target.getAttribute('data-item-id') || target.closest('[data-item-id]')?.getAttribute('data-item-id')
  const item = this.actor.items.find((item) => item.id === itemId)
  if (!item) return

  // Resolve the registered sheet class for this item type and open it
  // through the window manager
  const SheetClass = Loom.sheets.get('item', item.type) || Loom.sheets.get('item')
  if (!SheetClass) {
    console.warn(`World of Darkness 5e | No sheet registered for item type "${item.type}".`)
    return
  }
  Loom.windowManager.open(`item-sheet-${itemId}`, SheetClass, { itemId })
}

// Post the item to chat
export const _onItemChat = async function (event, target) {
  event.preventDefault()
  const actor = this.actor
  const itemId = target.getAttribute('data-item-id') || target.closest('[data-item-id]')?.getAttribute('data-item-id')
  const item = actor.items.find((item) => item.id === itemId)
  if (!item) return

  // Enrich the description if there is one
  let description = ''
  if (item.system?.description) {
    description = await Loom.applications.ux.TextEditor.implementation.enrichHTML(
      item.system.description
    )
  }

  await Loom.ChatMessage.create({
    // Sem isto, a mensagem saía sem falante (mesmo bug já corrigido em
    // `_onFormToChat`/`_onGiftToChat`/`_onEdgeToChat`/`_onDisciplineToChat`) e o
    // card do chat mostrava o jogador logado em vez do Ator dono do item.
    speaker: Loom.ChatMessage.getSpeaker({ actor }),
    flags: {
      wod5e: {
        name: item.name,
        img: item.img ?? item.imgUrl ?? '',
        description
      }
    }
  })
}

// Delete the item
export const _onItemDelete = async function (event, target) {
  event.preventDefault()
  const itemId = target.getAttribute('data-item-id') || target.closest('[data-item-id]')?.getAttribute('data-item-id')
  if (itemId) {
    // O item apagado pode ser o poder/gift/edge atualmente "selecionado" no ator
    // (system.selectedDisciplinePower e afins) — sem limpar essa referência, ela
    // aponta pra um id que não existe mais e todo `.find(item => item.id === ref)`
    // subsequente falha com "Item not found".
    const actor = this.actor
    // `selectedEdgePerk` (não `selectedPerk`) — confirmado em `htr/scripts/edges.js`;
    // com o nome errado, deletar o perk selecionado nunca limpava a referência.
    const selectedRefFields = ['selectedDisciplinePower', 'selectedGiftPower', 'selectedEdgePerk']
    const staleField = selectedRefFields.find((f) => actor?.system?.[f] === itemId)

    if (this.actor?.id) {
      await Loom.api.delete(`/actors/${this.actor.id}/items/${itemId}`)
    } else {
      await deleteItem(itemId)
    }

    if (staleField) {
      await actor.update({ system: { [staleField]: '' } })
    }

    await this._reloadDocument?.()
  }
}

// Open up the compendium browser with the specified item type filtered down to
export const _onSearchItem = async function (event, target) {
  event.preventDefault()

  // Top-level variables
  const type = target.getAttribute('data-type')
  const subtype = target.getAttribute('data-subtype')

  new CompendiumBrowserApplication({
    type,
    subtype
  }).render(true)
}

// Create an embedded item document
async function createItem(actor, itemName, type, itemData) {
  if (!actor) return null
  // Ícone padrão por tipo: o hook `preCreateItem` (item.js) que fazia isso não
  // roda na criação nativa do Loom (`api.post` direto) — o item sempre nascia sem ícone. Resolve aqui,
  // direto na criação, no lado nativo.
  const itemImg = ItemTypes.getList({})[type]?.img || 'marketplace/rulesets/wod5e/assets/icons/items/item-default.svg'
  return await createEmbeddedItems(actor, [{
    name: itemName,
    type,
    imgUrl: itemImg,
    system: itemData
  }])
}

// Append subtype data to the item data based on item type
async function appendSubtypeData(type, subtype, itemData) {
  switch (type) {
    case 'power':
      itemData.discipline = subtype
      break
    case 'perk':
      itemData.edge = subtype
      break
    case 'edgepool':
      itemData.edge = subtype
      break
    case 'gift':
      itemData.giftType = subtype
      break
    case 'feature':
      itemData.featuretype = subtype
      break
    case 'weapon':
      itemData.weaponType = subtype
      break
    default:
      itemData.subtype = subtype
  }

  return itemData
}