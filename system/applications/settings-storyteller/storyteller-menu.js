/* Definitions */
import { Attributes } from '../../api/def/attributes.js'
import { Skills } from '../../api/def/skills.js'
import { Disciplines } from '../../api/def/disciplines.js'
import { Edges } from '../../api/def/edges.js'
import { Gifts } from '../../api/def/gifts.js'

const { BaseWindow, LoomHandlebarsMixin } = Loom

export class StorytellerMenu extends LoomHandlebarsMixin(BaseWindow) {
  static DEFAULT_OPTIONS = {
    id: 'wod5e-storyteller',
    classes: ['wod5e', 'dialog-app', 'sheet', 'application'],
    window: {
      title: 'WOD5E.Settings.StorytellerMenu',
      resizable: true
    },
    position: {
      width: 500,
      height: 450
    }
  }

  static PARTS = {
    form: {
      template: 'marketplace/rulesets/wod5e/display/ui/storyteller-menu.hbs'
    }
  }

  get title() {
    return Loom.i18n.localize(this.options?.window?.title || 'WOD5E.Settings.StorytellerMenu')
  }

  constructor(options = {}) {
    super(options)

    this._activeTab = 'modifications'

    this.listKeys = {
      attribute: {
        newModTitle: Loom.i18n.format('WOD5E.Settings.NewStringModification', {
          string: Loom.i18n.localize('WOD5E.AttributesList.Label')
        }),
        defCategory: 'Attributes',
        labelCategory: 'AttributesList',
        defClass: Attributes
      },
      skill: {
        newModTitle: Loom.i18n.format('WOD5E.Settings.NewStringModification', {
          string: Loom.i18n.localize('WOD5E.SkillsList.Label')
        }),
        defCategory: 'Skills',
        labelCategory: 'SkillsList',
        defClass: Skills
      },
      discipline: {
        newModTitle: Loom.i18n.format('WOD5E.Settings.NewStringModification', {
          string: Loom.i18n.localize('WOD5E.VTM.Discipline')
        }),
        defCategory: 'Disciplines',
        labelCategory: 'DisciplinesList',
        defClass: Disciplines
      },
      edge: {
        newModTitle: Loom.i18n.format('WOD5E.Settings.NewStringModification', {
          string: Loom.i18n.localize('WOD5E.HTR.Edge')
        }),
        defCategory: 'Edges',
        labelCategory: 'EdgesList',
        defClass: Edges
      },
      gift: {
        newModTitle: Loom.i18n.format('WOD5E.Settings.NewStringModification', {
          string: Loom.i18n.localize('WOD5E.WTA.Gift')
        }),
        defCategory: 'Gifts',
        labelCategory: 'GiftsList',
        defClass: Gifts
      }
    }
  }

  /* -------------------------------------------- */

  /** @override */
  async _prepareContext(options) {
    const data = (await super._prepareContext?.(options)) ?? {}

    data.attributeTypes = {
      physical: 'WOD5E.SPC.Physical',
      social: 'WOD5E.SPC.Social',
      mental: 'WOD5E.SPC.Mental'
    }

    // Grab the modifications from the game settings and add them to the application data
    data.attributeModifications = Loom.settings.get('wod5e', 'modifiedAttributes') || []
    data.skillModifications = Loom.settings.get('wod5e', 'modifiedSkills') || []
    data.disciplineModifications = Loom.settings.get('wod5e', 'modifiedDisciplines') || []
    data.edgeModifications = Loom.settings.get('wod5e', 'modifiedEdges') || []
    data.giftModifications = Loom.settings.get('wod5e', 'modifiedGifts') || []

    // Grab the custom features from the game settings and add them to the application data
    data.customAttributes = Loom.settings.get('wod5e', 'customAttributes') || []
    data.customSkills = Loom.settings.get('wod5e', 'customSkills') || []
    data.customDisciplines = Loom.settings.get('wod5e', 'customDisciplines') || []
    data.customEdges = Loom.settings.get('wod5e', 'customEdges') || []
    data.customGifts = Loom.settings.get('wod5e', 'customGifts') || []

    return data
  }

  /* -------------------------------------------- */

  /** @override */
  async _onRender(context, options) {
    if (typeof super._onRender === 'function') await super._onRender(context, options)

    const root = this.element
    if (!root) return

    // Tab switching
    const activeTab = this._activeTab || 'modifications'
    root.querySelectorAll('.sheet-tabs .item').forEach((tabEl) => {
      const tabName = tabEl.getAttribute('data-tab')
      tabEl.classList.toggle('active', tabName === activeTab)
      tabEl.addEventListener('click', (event) => {
        event.preventDefault()
        this._activeTab = tabName
        root.querySelectorAll('.sheet-tabs .item').forEach((t) => t.classList.toggle('active', t.getAttribute('data-tab') === tabName))
        root.querySelectorAll('.tab[data-tab]').forEach((s) => {
          s.style.display = s.getAttribute('data-tab') === tabName ? '' : 'none'
        })
      })
    })
    root.querySelectorAll('.tab[data-tab]').forEach((s) => {
      s.style.display = s.getAttribute('data-tab') === activeTab ? '' : 'none'
    })

    const handleClick = (selector, handler) => {
      root.querySelectorAll(selector).forEach((element) => {
        element.addEventListener('click', function (event) {
          event.preventDefault()
          const data = event.currentTarget?.dataset || event.target?.dataset
          handler(data)
        })
      })
    }

    const addCustomItem = async (listKey, label) => {
      const list = (await Loom.settings.get('wod5e', listKey)) || []
      const newItem = {
        id: Loom.utils.randomID(8),
        label
      }

      // Fill in extra default data for custom attributes/skills
      if (listKey === 'customAttributes' || listKey === 'customSkills') {
        newItem.type = 'physical'
      }

      // Push the default item into the main list and save the new setting
      list.push(newItem)
      await Loom.settings.set('wod5e', listKey, list)
      this.render(false)
    }

    handleClick('.add-mod-button', ({ type }) => this._onGenerateModPrompt(type))
    handleClick('.remove-mod-button', ({ type, id }) => this._onRemoveChange(type, id))

    handleClick('.add-custom-button', async ({ type }) => {
      if (type === 'attribute') {
        await addCustomItem('customAttributes', 'New Attribute')
      } else if (type === 'skill') {
        await addCustomItem('customSkills', 'New Skill')
      } else if (type === 'discipline') {
        await addCustomItem('customDisciplines', 'New Discipline')
      } else if (type === 'edge') {
        await addCustomItem('customEdges', 'New Edge')
      } else if (type === 'gift') {
        await addCustomItem('customGifts', 'New Gift')
      }
    })

    handleClick('.remove-custom-button', ({ type, id }) => this._onRemoveCustom(type, id))

    handleClick('.save-modifications', () => {
      const modifications = {
        attribute: [],
        skill: [],
        discipline: [],
        edge: [],
        gift: []
      }
      const custom = {
        attribute: [],
        skill: [],
        discipline: [],
        edge: [],
        gift: []
      }

      const handleFeature = (feature, list) => {
        const { id, type, label } = feature.dataset
        const rename = feature.querySelector('.mod-rename')?.value || ''
        const hidden = feature.querySelector('.mod-hidden')?.checked || false
        list[type].push({ id, rename, label, hidden })
      }

      const handleCustomFeature = (feature, customList) => {
        const { id, type } = feature.dataset
        const label = feature.querySelector('.label')?.value || ''
        const attrType = feature.querySelector('.attr-type')?.value || ''
        const newItem = { id, label }
        if (type === 'attribute' || type === 'skill') newItem.type = attrType
        customList[type].push(newItem)
      }

      root.querySelectorAll('.modification-row').forEach(function (row) {
        handleFeature(row, modifications)
      })

      root.querySelectorAll('.customization-row').forEach(function (row) {
        handleCustomFeature(row, custom)
      })

      // Attributes
      Loom.settings.set('wod5e', 'modifiedAttributes', modifications.attribute)
      Loom.settings.set('wod5e', 'customAttributes', custom.attribute)
      // Skills
      Loom.settings.set('wod5e', 'modifiedSkills', modifications.skill)
      Loom.settings.set('wod5e', 'customSkills', custom.skill)
      // Disciplines
      Loom.settings.set('wod5e', 'modifiedDisciplines', modifications.discipline)
      Loom.settings.set('wod5e', 'customDisciplines', custom.discipline)
      // Edges
      Loom.settings.set('wod5e', 'modifiedEdges', modifications.edge)
      Loom.settings.set('wod5e', 'customEdges', custom.edge)
      // Gifts
      Loom.settings.set('wod5e', 'modifiedGifts', modifications.gift)
      Loom.settings.set('wod5e', 'customGifts', custom.gift)
    })
  }

  // Function for getting the information necessary for the selection dialog
  async _onGenerateModPrompt(type) {
    const list = await WOD5E[this.listKeys[type].defCategory].getList({})
    this._onRenderPromptDialog(type, list, this.listKeys[type].newModTitle)
  }

  // Function for rendering the dialog for adding a new modification
  async _onRenderPromptDialog(type, list, title) {
    const modifiedKey = `modified${this.listKeys[type].defCategory}`
    const modifiedList = (await Loom.settings.get('wod5e', modifiedKey)) || []

    const effectiveList = Object.fromEntries(
      Object.entries(list).filter((item) => !modifiedList.some((mod) => mod.id === item[0]))
    )

    const template = 'marketplace/rulesets/wod5e/display/ui/select-dialog.hbs'
    const content = await Loom.renderTemplate(template, {
      options: effectiveList
    })

    const result = await Loom.LoomDialog.input({
      window: { title },
      content,
      ok: {
        icon: 'fas fa-check',
        label: Loom.i18n.localize('WOD5E.Add')
      },
      buttons: [
        {
          action: 'cancel',
          icon: 'fas fa-times',
          label: Loom.i18n.localize('WOD5E.Cancel'),
          type: 'button'
        }
      ]
    })

    if (result !== 'cancel') {
      const id = result.optionSelect
      const label = list[id]?.label || id
      modifiedList.push({ id, label, rename: '', hidden: false })
      await Loom.settings.set('wod5e', modifiedKey, modifiedList)
      this.render(false)
    }
  }

  // Function for removing a change
  async _onRemoveChange(type, id) {
    const modifiedKey = `modified${this.listKeys[type].defCategory}`
    let modifiedList = (await Loom.settings.get('wod5e', modifiedKey)) || []
    modifiedList = modifiedList.filter((item) => item.id !== id)
    await Loom.settings.set('wod5e', modifiedKey, modifiedList)
    this.render(false)
  }

  // Function for removing a custom feature
  async _onRemoveCustom(type, id) {
    const customKey = `custom${this.listKeys[type].defCategory}`
    delete this.listKeys[type].defClass[id]
    let customList = (await Loom.settings.get('wod5e', customKey)) || []
    customList = customList.filter((item) => item.id !== id)
    await Loom.settings.set('wod5e', customKey, customList)
    this.render(false)
  }

  // Compatibilidade com chamadas legadas
  async getData() {
    return this._prepareContext({})
  }
}
