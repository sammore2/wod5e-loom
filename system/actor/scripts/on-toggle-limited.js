import { applySystemPatch } from './counters.js'

export const _onToggleLimited = async function (event, target) {
  event.preventDefault()

  // Top-level variables
  const actor = this.actor
  // Duas bugs na mesma função: (1) o atributo lido era `data-name`, mas o template
  // (biography.hbs, chronicle-tenets.hbs, touchstones-convictions.hbs) sempre usou
  // `data-path` — sempre `null`, `field.split('.')` estourava em TODO clique. (2) mesmo
  // corrigindo isso, `field` (ex. "settings.limited.biography") é um caminho dentro de
  // `system.settings` (setting-fields.js) — lendo/escrevendo direto em `actor.settings`
  // (sem `.systemData`) não existe: `actor.settings` é `undefined`, e `actor.update({
  // [field]: ... })` manda uma chave solta que a rota PUT não reconhece.
  const field = target.getAttribute('data-path')
  if (!field) return

  const fieldParts = field.split('.')

  // Iterate through the fieldParts to get the current value
  let currentValue = actor.systemData
  for (const part of fieldParts) {
    currentValue = currentValue?.[part]
  }

  const systemData = applySystemPatch(actor.systemData, [[fieldParts, !currentValue]])
  await actor.update({ systemData })
}
