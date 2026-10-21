import { getBloodPotencyValues } from './blood-potency.js'

export const getVampireModifiers = async function (actorData) {
  const bloodPotency = await getBloodPotencyValues(actorData?.blood?.potency ?? 0)
  const bonuses = []

  // Surto de Sangue (Blood Surge)
  if (bloodPotency?.surge > 0) {
    bonuses.push({
      source: Loom.i18n.localize('WOD5E.VTM.BloodSurge'),
      value: bloodPotency.surge,
      paths: ['attributes'],
      unless: ['willpower', 'humanity', 'extended', 'frenzy'],
      displayWhenInactive: true,
      activeWhen: {
        check: 'isPath',
        path: 'blood-surge'
      },
      advancedCheckDice: 1
    })
  }

  return bonuses
}
