import { WoDItemModel } from '../base-item-model.js'

export class BoonItemModel extends WoDItemModel {
  static defineSchema() {
    const fields = Loom.fields_v14

    const schema = super.defineSchema()

    schema.boontype = new fields.StringField({ initial: '' })
    schema.points = new fields.NumberField({ initial: 0 })

    return schema
  }
}
