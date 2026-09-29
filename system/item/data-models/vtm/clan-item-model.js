import { WoDItemModel } from '../base-item-model.js'

export class ClanItemModel extends WoDItemModel {
  static defineSchema() {
    const fields = Loom.fields_v14

    const schema = super.defineSchema()

    schema.bane = new fields.HTMLField({ initial: '' })

    return schema
  }
}
