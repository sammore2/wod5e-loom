import { ItemTypes } from '../../api/def/itemtypes.js'
import { _onSortItem } from './on-sort-item.js'
import { applySystemPatch } from './counters.js'
import { Disciplines } from '../../api/def/disciplines.js'
// Embedded item management
import { createEmbeddedItems, deleteEmbeddedItems, updateItemData, getActorItems } from '../../scripts/embedded-items.js'

export class ActorUX {
  // Save the current scroll position
  static async _saveScrollPositions(actor) {
    const activeList = this.findActiveList(actor)

    if (activeList.length) {
      actor._scroll = activeList.scrollTop()
    }
  }

  // Restore the saved scroll position
  static async _restoreScrollPositions(actor) {
    const activeList = this.findActiveList(actor)

    if (activeList.length && actor._scroll != null) {
      activeList.scrollTop(actor._scroll)
    }
  }

  // Get the scroll area of the currently active tab
  static findActiveList(actor) {
    const activeList = $(actor.element).find('section.tab.active')

    return activeList
  }

  // Save the maxHeight of all collapsible-content elements if it's greater than 0
  static async _saveCollapsibleStates(actor) {
    // Clear out the old states
    actor._collapsibleStates.clear()

    // Iterate through each collapsible element in the page
    $(actor.element)
      .find('.collapsible-content')
      .each((index, content) => {
        const contentElement = $(content)
        const maxHeight = parseFloat(contentElement.css('maxHeight'))

        // Check if max height is greater than 0, and if it is, we save its maxHeight state
        if (maxHeight > 0) {
          actor._collapsibleStates.set(contentElement.attr('data-id') || index, maxHeight)
        }
      })
  }

  // Restore the maxHeight of previously expanded collapsible-content elements
  static async _restoreCollapsibleStates(actor) {
    $(actor.element)
      .find('.collapsible-content')
      .each((index, content) => {
        const contentElement = $(content)
        const key = contentElement.attr('data-id') || index // Match with saved state

        if (actor._collapsibleStates.has(key)) {
          // Disable the transition property before re-setting the max height
          // This makes it so that on re-render, the user doesn't watch the
          // collapse animation again
          contentElement.css('transition', 'none')
          $(content).css('maxHeight', `${actor._collapsibleStates.get(key)}px`)

          // Force a reflow and then re-enable the transition property
          // We have to tell eslint to ignore the no-void rule because it's genuinely useful here

          void contentElement[0].offsetHeight
          contentElement.css('transition', '')
        }
      })
  }

  static async _onDropItem(event, actor, data) {
    if (false) return false
    const actorType = actor.type
    // Resolve the dropped item; Loom has no Item.implementation.fromDropData.
    // `Loom.fromUuidSync` só resolve documentos já carregados no mundo (ver
    // main.ts) — um item vindo do compêndio (`Compendium.<sourceId>.<entryId>`)
    // nunca está nessas coleções e sempre voltava `undefined` aqui, fazendo o
    // drop inteiro abortar em silêncio (sem erro, sem log). O payload de drag
    // do compêndio (compendium-source-window.ts `buildDragPayload`) já manda a
    // entry inteira em `data.data` justamente pra não depender de resolução
    // síncrona — usar isso primeiro.
    let item
    if (data?.uuid?.startsWith('Compendium.') && data.data) {
      const sys = data.data.systemData ?? data.data.data ?? data.data.system ?? {}
      item = {
        name: data.data.name,
        type: data.data.type,
        imgUrl: data.data.imgUrl ?? data.data.img,
        system: sys
      }
    } else if (typeof Item?.implementation?.fromDropData === 'function') {
      item = await Item.implementation.fromDropData(data)
    } else {
      // The collection may not have caught up with a freshly created item: ask for it instead of giving up.
      item = Loom.fromUuidSync?.(data?.uuid) ?? (await Loom.fromUuid?.(data?.uuid))
    }
    if (!item) return false

    const itemSystem = item.systemData ?? item.system ?? item.data ?? {}
    const itemData = {
      name: item.name,
      type: item.type,
      imgUrl: item.imgUrl ?? item.img ?? '',
      system: Loom.utils.deepClone(itemSystem)
    }
    const itemType = itemData.type
    const itemsList = ItemTypes.getList({})

    // Power dropped: resolve and associate discipline
    if (itemType === 'power') {
      const targetDisciplineEl = event?.target?.closest?.('[data-discipline]')
      const targetDiscipline = targetDisciplineEl?.dataset?.discipline?.toLowerCase()?.trim()

      let discKey = itemData.system?.discipline?.toLowerCase()?.trim()

      if (targetDiscipline) {
        discKey = targetDiscipline
      } else if (!discKey || discKey === 'animalism') {
        const selectedDisc = actor.system?.selectedDiscipline?.toLowerCase()?.trim()
        if (selectedDisc) {
          discKey = selectedDisc
        }
      }

      const discList = Disciplines.getList({})
      if (!discKey || !discList[discKey]) {
        const found = Object.keys(discList).find(
          (k) => k === discKey || (discKey && discList[k]?.displayName?.toLowerCase() === discKey)
        )
        if (found) discKey = found
        else discKey = 'animalism'
      }

      itemData.system.discipline = discKey
    }

    // Check whether we should allow this item type to be placed on this actor type
    if (itemsList[itemType]) {
      const whitelist = itemsList[itemType].restrictedActorTypes
      const blacklist = itemsList[itemType].excludedActorTypes

      // If the whitelist contains any entries, we can check to make sure this actor type is allowed for the item
      // We go through the base actor type, then subtypes - if we match to any of them, we allow the item to be
      // added to the actor.
      // We don't need to add this logic to the blacklist because the blacklist only needs to check against the base types.
      if (
        !Loom.utils.isEmpty(whitelist) &&
        // This is just a general check against the base actorType
        !whitelist.includes(actorType) &&
        // If the actor is an SPC, check against the spcType
        !(actorType === 'spc' && whitelist.includes(actor.system.spcType)) &&
        // If the actor is a Group sheet, check against the groupType
        !(actorType === 'group' && whitelist.includes(actor.system.groupType))
      ) {
        Loom.ui?.notifications.warn(
          Loom.i18n.format('WOD5E.ItemsList.ItemCannotBeDroppedOnActor', {
            string1: itemType,
            string2: actorType
          })
        )

        return false
      }

      // If the blacklist contains any entries, we can check to make sure this actor type isn't disallowed for the item
      if (!Loom.utils.isEmpty(blacklist) && blacklist.indexOf(actorType) > -1) {
        Loom.ui?.notifications.warn(
          Loom.i18n.format('WOD5E.ItemsList.ItemCannotBeDroppedOnActor', {
            string1: itemType,
            string2: actorType
          })
        )

        return false
      }

      // Handle limiting only a single type of an item to an actor
      if (itemsList[itemType].limitOnePerActor) {
        // Delete all other types of this item on the actor
        const duplicateItemTypeInstances = actor.items
          .filter((item) => item.type === itemType)
          .map((item) => item.id)

        await deleteEmbeddedItems(actor, duplicateItemTypeInstances)
      }
    }

    // Handle item sorting within the same Actor
    if (actor.uuid === item.parent?.uuid) return _onSortItem(event, actor, itemData)

    // Create the owned item
    return this._onDropItemCreate(actor, itemData)
  }

  static async _onDropItemCreate(actor, itemData) {
    const createdItems = await createEmbeddedItems(actor, itemData)
    const createdItem = Array.isArray(createdItems) ? createdItems[0] : createdItems

    // Auto-enable visibility and selection for disciplines on Vampire/Ghoul
    if (itemData.type === 'power' && actor && createdItem) {
      const discKey = itemData.system?.discipline
      if (discKey && actor.system?.disciplines) {
        const patches = [
          [['disciplines', discKey, 'visible'], true],
          [['disciplines', discKey, 'selected'], true],
          [['selectedDiscipline'], discKey],
          [['selectedDisciplinePower'], createdItem.id ?? createdItem._id]
        ]
        const prevDisc = actor.system?.selectedDiscipline
        if (prevDisc && prevDisc !== discKey && actor.system.disciplines[prevDisc]) {
          patches.push([['disciplines', prevDisc, 'selected'], false])
        }
        const prevPower = actor.system?.selectedDisciplinePower
        if (prevPower) {
          const items = getActorItems(actor)
          const prevItem = items.find((i) => i.id === prevPower)
          if (prevItem) {
            await updateItemData(prevItem, { data: applySystemPatch(prevItem.data ?? prevItem.systemData, [[['selected'], false]]) })
          }
        }
        await updateItemData(createdItem, { data: applySystemPatch(createdItem.data ?? createdItem.systemData, [[['selected'], true]]) })

        const systemData = applySystemPatch(actor.systemData, patches)
        await actor.update({ systemData })
      }
    }

    // Auto-enable visibility and selection for Werewolf gifts
    if (itemData.type === 'gift' && actor && createdItem) {
      const giftKey = itemData.system?.giftType
      if (giftKey && actor.system?.gifts) {
        const patches = [
          [['gifts', giftKey, 'visible'], true],
          [['gifts', giftKey, 'selected'], true],
          [['selectedGift'], giftKey],
          [['selectedGiftPower'], createdItem.id ?? createdItem._id]
        ]
        const prevGift = actor.system?.selectedGift
        if (prevGift && prevGift !== giftKey && actor.system.gifts[prevGift]) {
          patches.push([['gifts', prevGift, 'selected'], false])
        }
        const systemData = applySystemPatch(actor.systemData, patches)
        await actor.update({ systemData })
      }
    }

    // Auto-enable visibility and selection for Hunter edges/perks
    if ((itemData.type === 'edge' || itemData.type === 'perk') && actor && createdItem) {
      const edgeKey = itemData.system?.edgeType
      if (edgeKey && actor.system?.edges) {
        const patches = [
          [['edges', edgeKey, 'visible'], true],
          [['edges', edgeKey, 'selected'], true],
          [['selectedEdge'], edgeKey]
        ]
        const prevEdge = actor.system?.selectedEdge
        if (prevEdge && prevEdge !== edgeKey && actor.system.edges[prevEdge]) {
          patches.push([['edges', prevEdge, 'selected'], false])
        }
        const systemData = applySystemPatch(actor.systemData, patches)
        await actor.update({ systemData })
      }
    }

    return createdItems
  }
}
