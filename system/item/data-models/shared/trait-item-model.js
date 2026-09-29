import { WoDItemModel } from '../base-item-model.js'

export class TraitItemModel extends WoDItemModel {
  static defineSchema() {
    const fields = Loom.fields_v14

    const schema = super.defineSchema()

    // Which dice are in the item
    schema.dice = new fields.NumberField({ initial: 0 })

    return schema
  }
}
