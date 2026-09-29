const fields = Loom.fields_v14

export const coterieFields = {
  chasse: new fields.SchemaField({
    value: new fields.NumberField({ initial: 0 })
  }),
  lien: new fields.SchemaField({
    value: new fields.NumberField({ initial: 0 })
  }),
  portillon: new fields.SchemaField({
    value: new fields.NumberField({ initial: 0 })
  })
}
