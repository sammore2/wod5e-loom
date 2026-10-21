export const _onExpandRoll = async function (event, target) {
  event.preventDefault()

  target.closest('.dice-roll')?.classList.toggle('expanded')
}
