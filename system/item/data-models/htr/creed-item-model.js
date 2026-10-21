import { WoDItemModel } from '../base-item-model.js'

export class CreedItemModel extends WoDItemModel {
  static defineSchema() {
    const fields = Loom.fields_v14

    const schema = super.defineSchema()

    schema.edges = new fields.StringField({ initial: '' })
    schema.drives = new fields.StringField({ initial: '' })
    schema.desperationFields = new fields.StringField({ initial: '' })

    return schema
  }
}
