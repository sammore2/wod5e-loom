// Data preparation functions
import { prepareSkills } from './scripts/prepare-skills.js'
import { prepareAttributes } from './scripts/prepare-attributes.js'
import { getDerivedHealth } from './scripts/on-health-change.js'
import { getDerivedWillpower } from './scripts/on-willpower-change.js'
import { getDerivedExperience } from './scripts/experience.js'
import { prepareDisciplines } from './vtm/scripts/prepare-data.js'
import { prepareEdges } from './htr/scripts/prepare-data.js'
import { prepareGifts, prepareFormData } from './wta/scripts/prepare-data.js'
import { prepareExceptionalDicePools } from './scripts/prepare-exceptional-dice-pools.js'
import { getVampireModifiers } from './vtm/scripts/vampire-bonuses.js'
import { getHunterModifiers } from './htr/scripts/hunter-bonuses.js'
import { Disciplines } from '../api/def/disciplines.js'
import { Skills } from '../api/def/skills.js'
import { Attributes } from '../api/def/attributes.js'
import { Renown } from '../api/def/renown.js'

const BaseActorClass = globalThis.Actor || window.CONFIG?.Actor?.documentClass || Loom?.LoomActor || class {}

/**
 * Extend the base Actor document and put all our base functionality here
 * @extends {BaseActorClass}
 */
export class WoDActor extends BaseActorClass {
  // Sem isto, `this.constructor.name` ("WoDActor") vira o `documentName` usado pra montar a
  // rota da API e o nome do campo de sistema em `ClientDocument.update()` — quebra tanto o
  // endpoint (`/woDActors` em vez de `/actors`) quanto a expansão de `system.*` pra `systemData`.
  static documentName = 'Actor'

  /**
   * @override
   * Handle data that happens before the creation of a new actor document
   */
  async _preCreate(data, context, user) {
    await super._preCreate(data, context, user)

    const tokenUpdate = {}

    // Link non-SPC token data by default
    if (data.prototypeToken?.actorLink === undefined && data.type !== 'spc') {
      tokenUpdate.actorLink = true
    }

    if (!Loom.utils.isEmpty(tokenUpdate)) {
      this.prototypeToken.updateSource(tokenUpdate)
    }
  }

  /**
   * @override
   * Prepare data for the actor. Calling the super version of this executes
   * the following, in order: data reset (to clear active effects),
   * prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
   * prepareDerivedData().
   */
  async prepareData() {
    // This exists because if an actor exists from another system (such as "Vampire" from WOD20),
    // the prepareData function will get stuck in a loop. For some reason those kinds of actors weren't
    // registered as invalid, and thus this is a quick way to make sure people can
    // still load their worlds with those invalid actors.
    if (Loom.actors.invalidDocumentIds?.has?.(this.id)) {
      return
    }

    await super.prepareData()
  }

  /**
   * @override
   * Data modifications in this step occur before processing embedded
   * documents or derived data.
   */
  async prepareBaseData() {
    applyEffectData(this)
    super.prepareBaseData()
  }

  async prepareEmbeddedDocuments() {
    super.prepareEmbeddedDocuments()
  }

  /**
   * @override
   * Augment the actor source data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   * Data calculated in this step should generally not exist in template.json
   * (such as ability modifiers rather than ability scores) and should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from it).
   */
  async prepareDerivedData() {
    const actorData = this
    const systemData = actorData.system

    // Defines the mapping of SPC subtypes to gamesystems
    const typeMapping = {
      vampire: 'vampire',
      ghoul: 'vampire',
      hunter: 'hunter',
      werewolf: 'werewolf',
      spirit: 'werewolf'
    }

    // Set gamesystem of an SPC
    let gamesystem = 'mortal';
    if (actorData.type === 'spc') {
      gamesystem = typeMapping[systemData.spcType] || 'mortal'
    } else if (actorData.type !== 'group') {
      // Set the gamesystem of a non-SPC non-group character
      gamesystem = typeMapping[actorData.type] || 'mortal'
    }
    
    if (!actorData.derivedData) actorData.derivedData = {};
    actorData.derivedData.gamesystem = gamesystem;
    // `systemData` (== `actor.system`) é um getter recomputado a cada acesso (nunca
    // cacheado) — esta atribuição muta só um snapshot descartável, some assim que
    // qualquer código ler `actor.system` de novo. E `this.update()` aqui de dentro
    // NÃO persiste (guarda documentada em `document-sheet.ts`/`actors-collection.ts`:
    // update disparado de dentro de `prepareDerivedData()` só aplica local, pra evitar
    // loop save→eco→preparar→save). Por isso `system.gamesystem` trava no valor de
    // quando o ator foi criado pra sempre, mesmo trocando "Tipo de Ator" (spcType) —
    // quem precisa do gamesystem ATUAL de um SPC tem que ler `derivedData.gamesystem`
    // (linha acima), nunca `system.gamesystem` direto.
    try { systemData.gamesystem = gamesystem; } catch(e) {}
    if (systemData?.hasSkillAttributeData !== false) {
      // Handle attribute preparation
      let attributesPrep = { attributes: {}, sortedAttributes: { physical: [], social: [], mental: [] } }
      try {
        attributesPrep = await prepareAttributes(actorData)
      } catch (e) {
        console.error('[wod5e] prepareAttributes falhou:', e?.stack || e)
      }

      // Handle skill preparation
      let skillsPrep = { skills: {}, sortedSkills: { physical: [], social: [], mental: [] } }
      try {
        skillsPrep = await prepareSkills(actorData)
      } catch (e) {
        console.error('[wod5e] prepareSkills falhou:', e?.stack || e)
      }

      // [LoomVTT Fix] Store derived data on derivedData only - never persist computed lists into systemData
      if (!actorData.derivedData) actorData.derivedData = {};
      actorData.derivedData.attributes = attributesPrep.attributes;
      actorData.derivedData.sortedAttributes = attributesPrep.sortedAttributes;
      actorData.derivedData.skills = skillsPrep.skills;
      actorData.derivedData.sortedSkills = skillsPrep.sortedSkills;
    }

    // Handle prepping exceptional dicepools
    if (actorData.type === 'spc') {
      try { systemData.exceptionaldicepools = await prepareExceptionalDicePools(actorData) } catch(e) {}
    }

    // Set discipline data
    if (gamesystem === 'vampire') {
      let disciplines = {}
      try {
        disciplines = await prepareDisciplines(actorData)
      } catch (e) {
        console.error('[wod5e] prepareDisciplines falhou:', e?.stack || e)
      }
      if (!actorData.derivedData) actorData.derivedData = {};
      actorData.derivedData.disciplines = disciplines;
    }

    // Set edge data
    if (gamesystem === 'hunter') {
      let edges = {}
      try {
        edges = await prepareEdges(actorData)
      } catch (e) {
        console.error('[wod5e] prepareEdges falhou:', e?.stack || e)
      }
      if (!actorData.derivedData) actorData.derivedData = {};
      actorData.derivedData.edges = edges;
    }

    // Set gift and form data
    if (gamesystem === 'werewolf') {
      let gifts = {}
      try {
        gifts = await prepareGifts(actorData)
      } catch (e) {
        console.error('[wod5e] prepareGifts falhou:', e?.stack || e)
      }
      if (!actorData.derivedData) actorData.derivedData = {}
      actorData.derivedData.gifts = gifts
      try {
        actorData.derivedData.forms = await prepareFormData(systemData.forms, actorData)
      } catch (e) {
        console.error('[wod5e] prepareFormData falhou:', e?.stack || e)
      }

      if (systemData.formOverride && (systemData.rage?.value ?? 0) > 0) {
        this.update({ 'system.formOverride': false })
      }
    }

    // If the actor is a player, update the default permissions to limited
    if (this.hasPlayerOwner && !this?.flags?.wod5e?.manualDefaultOwnership && Loom.user.isGM) {
      // A flag precisa ir JUNTO nesse mesmo update — sem ela, `manualDefaultOwnership`
      // nunca vira true e este `if` roda de novo no PRÓXIMO `prepareDerivedData` (todo
      // re-render/eco de WS aciona um), fazendo `update()` disparar pra sempre.
      this.update({
        'ownership.default': CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED,
        'flags.wod5e.manualDefaultOwnership': true
      })
    }

    // Prepare derived XP values
    if (actorData.type !== 'group' && actorData.type !== 'spc') {
      const derivedXP = await getDerivedExperience(systemData);
      if (!actorData.derivedData) actorData.derivedData = {};
      actorData.derivedData.derivedXP = derivedXP;
      try { systemData.derivedXP = derivedXP; } catch(e) {}
    }

    // Prepare derived health and willpower values
    // [LoomVTT Fix] Direct assignment - calling this.update() during prepareData
    // crashes the borrowed-prototype path and triggers update/echo loops
    if (actorData.type !== 'group' && true) {
      const derivedHealth = await getDerivedHealth(systemData)
      systemData.health = systemData.health || {}
      systemData.health.value = derivedHealth

      const derivedWillpower = await getDerivedWillpower(systemData)
      systemData.willpower = systemData.willpower || {}
      systemData.willpower.value = derivedWillpower
    }

    // Get desperation value if the actor has a group set
    if (actorData.type !== 'group') {
      if (systemData.group) {
        const group = Loom.actors.get(systemData.group)

        if (group) {
          systemData.desperation = group.system?.desperation || { value: 0 }
        }
      }
    }

    // Wipe system-specific bonuses so they don't duplicate
    try { systemData.bonuses = {} } catch(e) {}

    // Get bonuses relevant to particular splats
    if (actorData.type === 'vampire') {
      const bonuses = await getVampireModifiers(systemData);
      if (!actorData.derivedData) actorData.derivedData = {};
      actorData.derivedData.bonuses = bonuses;
      try { systemData.bonuses = bonuses; } catch(e) {}
    }

    if (actorData.type === 'hunter') {
      const bonuses = await getHunterModifiers(systemData);
      if (!actorData.derivedData) actorData.derivedData = {};
      actorData.derivedData.bonuses = bonuses;
      try { systemData.bonuses = bonuses; } catch(e) {}
    }

    // Aggregate bonuses declared on the actor's own items (qualities/features/gear/etc).
    // This loop never existed in this port — the upstream wod5e builds it in
    // `wod-actor-base.js`'s `prepareItems()`, called from the sheet's own `getData()`,
    // which this port never carried over. Written to `derivedData` for the same reason
    // as `bonuses` above: `actor.system` is a throwaway snapshot, `actor.derivedData` is
    // what actually persists across calls (see `situational-modifiers.js`).
    const itemModifiers = [];
    for (const item of actorData.items || []) {
      const itemBonuses = item?.system?.bonuses;
      if (Array.isArray(itemBonuses) && itemBonuses.length > 0 && !item?.system?.suppressed) {
        itemModifiers.push(...itemBonuses);
      }
    }
    if (!actorData.derivedData) actorData.derivedData = {};
    actorData.derivedData.itemModifiers = itemModifiers;

    // Force a ghoul's hunger value to be 0
    if (actorData.type === 'ghoul' && systemData.hunger.value > 0) {
      systemData.hunger.value = 0
    }
  }

  /**
   * @override
   * Handle things that need to be done every update or specifically when the actor is being updated
   */
  async _onUpdate(data, options, user) {
    const actor = Loom.actors.get(data.id ?? data._id)

    // Handle the actual update
    super._onUpdate(data, options, user)

    // Only run through this for the storyteller
    if (!Loom.user.isGM) return

    // Make sure the actor exists
    if (!actor) return

    // If the default ownership is ever not limited, update the manualDefaultOwnership flag
    // (stored locally only — the actors API doesn't persist arbitrary flags)
    if (actor.ownership?.default !== CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED) {
      actor.flags ??= {}
      actor.flags.wod5e ??= {}
      actor.flags.wod5e.manualDefaultOwnership = true
    }

    // If the actor is a group...
    if (actor.type === 'group') {
      // Handle updating data that needs to propagate to group members
      if (actor.system?.members) {
        for (const memberUuid of actor.system.members) {
          const member = Loom.fromUuidSync(memberUuid)
          if (!member) {
            console.warn(`World of Darkness 5e | Member with UUID ${memberUuid} not found.`)
            continue
          }

          // Handle updating the group member's Desperation
          if (data.system?.desperation && member.system?.gamesystem === 'hunter') {
            member.prepareDerivedData()
          }
        }
      }
    }
  }
}

async function applyEffectData(actorData) {
  // Prepare the effects from condition items onto the actor
  // Ignore suppressed conditions
  const conditions = actorData.items.filter(
    (item) => item.system && !item.system.suppressed
  )
  conditions.forEach((condition) => {
    // Iterate through each effect on the condition
    if (condition.system && typeof condition.system.effects === 'object' && condition.system.effects !== null) {
      for (const [, effect] of Object.entries(condition.system.effects)) {
        // Iterate through each key in the effect
        if (effect.keys && Array.isArray(effect.keys)) {
          effect.keys.forEach((key) => {
            // If this is for an SPC sheet, we need to alter the key for stats
            if (actorData.type === 'spc' && key.includes('skills')) {
              key = key.replace('skills', 'exceptionaldicepools')
            }

            // Construct the change in a format similar to ActiveEffects
            const change = {
              key,
              mode: effect.mode,
              value: effect.intValue
            }

        if (change.key === 'attributes') {
          // Apply to all Attributes
          change.key = Attributes.getList({ useValuePath: true })
        } else if (change.key === 'skills') {
          // Apply to all skills
          change.key = Skills.getList({ useValuePath: true })
        } else if (change.key === 'disciplines') {
          // Apply to all disciplines
          change.key = Disciplines.getList({ useValuePath: true })
        } else if (change.key === 'renown') {
          // Apply to all renown
          change.key = Renown.getList({ useValuePath: true })
        } else if (change.key === 'physical') {
          if (actorData.type === 'spc') {
            change.key = 'system.standarddicepools.physical.value'
          } else {
            change.key = Attributes.getList({ type: 'physical', useValuePath: true })
          }
        } else if (change.key === 'social') {
          if (actorData.type === 'spc') {
            change.key = 'system.standarddicepools.social.value'
          } else {
            change.key = Attributes.getList({ type: 'social', useValuePath: true })
          }
        } else if (change.key === 'mental') {
          if (actorData.type === 'spc') {
            change.key = 'system.standarddicepools.mental.value'
          } else {
            change.key = Attributes.getList({ type: 'mental', useValuePath: true })
          }
        }

        // Handle going through every key if we're given an array of options
        if (change.key !== null && typeof change.key === 'object') {
          for (const [k] of Object.entries(change.key)) {
            updateActorProperty(actorData, k, change.mode, change.value)
          }
        } else {
          // Otherwise, we just need to update the one key
          updateActorProperty(actorData, change.key, change.mode, change.value)
        }
      })
        }
      }
    }
  })
}

async function updateActorProperty(actor, key, mode, value) {
  mode = Number(mode)
  value = Number(value)

  const current = Number(Loom.utils.getProperty(actor, key))
  let updatedData

  // Note: mode === 2 and mode === 5 are here because those are the pre-V14 version of the CONSTs
  // Need a migration script later
  if (mode === CONST.ACTIVE_EFFECT_CHANGE_TYPES.add || mode === 2) {
    updatedData = current + value
  } else if (mode === CONST.ACTIVE_EFFECT_CHANGE_TYPES.override || mode === 5) {
    updatedData = value
  }

  Loom.utils.setProperty(actor, key, updatedData)
}

/**
 * Entrypoint for the native LoomVTT SystemRegistry.prepareData lifecycle.
 * Executes the exact same derivation logic from WoDActor on the raw actor row.
 */
export async function wodPrepareData(document) {
  if (!document) return;
  if (document.id && Loom.actors?.invalidDocumentIds?.has?.(document.id)) return;
  if (document.id && Loom.items?.invalidDocumentIds?.has?.(document.id)) return;

  // Provide the legacy `.system` alias to `.systemData` on the raw row.
  // `'system' in document` (not `Object.getOwnPropertyDescriptor(document, 'system')`, which
  // only sees OWN properties) — a real actor instance already has `.system` as an INHERITED
  // getter (`LoomActor.prototype.system`, applies the schema's defaults). The own-property
  // check missed that inherited getter and always installed this raw passthrough on top,
  // permanently shadowing the real one for that instance: every field the schema declares
  // `initial` for (health.max, willpower.max, headers.concept, blood.potency, ...) silently
  // stopped getting defaulted the moment this ran on a real actor, not just a raw DB row.
  if (!('system' in document)) {
    Object.defineProperty(document, 'system', {
      get() { return document.systemData; },
      enumerable: true,
      configurable: true,
    });
  }

  // Check if this document is an Actor (e.g. has documentName 'Actor' or its type is registered as an Actor)
  const isActor = document.documentName === 'Actor' || (document.type && window.WOD5E?.ActorTypes?.getList({})[document.type]) || ('items' in document);

  if (isActor) {
    // Run prepareBaseData (which runs applyEffectData)
    if (typeof WoDActor.prototype.prepareBaseData === 'function') {
      await WoDActor.prototype.prepareBaseData.call(document);
    }

    // Run derived data
    if (typeof WoDActor.prototype.prepareDerivedData === 'function') {
      await WoDActor.prototype.prepareDerivedData.call(document);
    }
  } else {
    // Run Item preparation
    if (window.WOD5E?.WoDItemBase?.prototype?.prepareBaseData) {
      await window.WOD5E.WoDItemBase.prototype.prepareBaseData.call(document);
    }
  }
}
