export const _onCopyRoll = async function (event) {
  event.preventDefault()

  const userId = Loom.users.current.id
  const savedRolls = await Loom.users.current.getFlag('wod5e', 'rollMenuSavedRolls')
  const rollId = await Loom.users.current.getFlag('wod5e', 'rollMenuActiveRoll')
  const activeRollObject = savedRolls[rollId]

  const dataId = `${userId}.${rollId}`
  const dataLabel = activeRollObject.name

  const rollString = `@RollPrompt[${dataId}]{${dataLabel}}`

  Loom.clipboard.copyPlainText(rollString)

  Loom.ui?.notifications.info(
    Loom.i18n.format('WOD5E.StringCopiedToClipboard', {
      string: rollString
    })
  )
}
