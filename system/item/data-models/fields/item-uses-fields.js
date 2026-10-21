const fields = Loom.fields_v14

export function itemUsesFields() {
  return {
    uses: new fields.SchemaField({
      current: new fields.NumberField({ initial: 0 }),
      max: new fields.NumberField({ initial: 0 }),
      enabled: new fields.BooleanField({ initial: false })
    })
  }
}
