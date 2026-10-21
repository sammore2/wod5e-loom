export async function _decreaseRage(actor, amount, rollMode) {
  // Reduce rage for each failure on a rage dice if this is a power that consumes it
  const currentRage = actor.system.rage.value
  const newRageAmount = Math.max(currentRage - amount, 0)

  // If no rollMode is provided, use the user's default
  if (!rollMode) rollMode = Loom.settings.get('core', 'rollMode')

  if (newRageAmount === 0 && currentRage > 0) {
    const chatMessage = `<p class="roll-label uppercase">${Loom.i18n.localize('WOD5E.WTA.LostTheWolf')}</p>
    <p class="roll-content result-rage result-possible">${Loom.i18n.localize('WOD5E.WTA.LostWolfWarning')}</p>`

    // Post the message to the chat
    const message = Loom.ChatMessage.applyRollMode(
      { speaker: Loom.ChatMessage.getSpeaker({ actor }), content: chatMessage },
      rollMode
    )
    Loom.ChatMessage.create(message)
  }

  // Update the actor with the new amount of rage. Quem chama (`handleFailure` em
  // `system-rolls.js`) precisa dar `await` nesta função — sem isso, o `callback`
  // externo (ex.: troca de forma do lobisomem) dispara seu próprio `actor.update()`
  // em paralelo, cada um a partir do mesmo snapshot desatualizado de `systemData`,
  // e o que responder por último apaga a mudança do outro.
  await actor.update({ 'system.rage.value': newRageAmount })
}
