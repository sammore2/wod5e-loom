const fields = Loom.fields_v14

export function equipmentFields() {
  return {
    quantity: new fields.NumberField({ initial: 1 })
  }
}
