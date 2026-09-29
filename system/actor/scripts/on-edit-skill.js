// Applications
import { SkillApplication } from './../applications/skill-application.js'

// Handle changes to health
export const _onEditSkill = async function (event, target) {
  event.preventDefault()

  // Top-level variables
  const actor = this.actor

  // Define the actor's gamesystem, defaulting to "mortal" if it's not in the systems list.
  // `derivedData.gamesystem` primeiro — `system.gamesystem` de um SPC fica travado no
  // valor de quando o ator foi criado (ver comentário em `actor.js`/`prepareDerivedData`).
  const system = actor.derivedData?.gamesystem ?? actor.system.gamesystem

  // Top-level variables
  const skill = target.getAttribute('data-skill')

  await new SkillApplication({
    actor,
    skill,
    classes: ['wod5e', system, 'dialog']
  }).render(true)
}
