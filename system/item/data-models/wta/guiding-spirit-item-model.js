import { WoDItemModel } from '../base-item-model.js'

export class GuidingSpiritItemModel extends WoDItemModel {
  static defineSchema() {
    const fields = Loom.fields_v14

    const schema = super.defineSchema()

    schema.favor = new fields.HTMLField({ initial: '' })
    schema.ban = new fields.HTMLField({ initial: '' })

    return schema
  }
}
