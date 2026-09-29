import { WoDItemModel } from '../base-item-model.js'
import { dicepoolFields } from '../fields/dicepool-fields.js'

export class EdgePoolItemModel extends WoDItemModel {
  static defineSchema() {
    const fields = Loom.fields_v14

    const schema = super.defineSchema()

    schema.edge = new fields.StringField({ initial: 'arsenal' })

    // Which dice are in the item
    Object.assign(schema, dicepoolFields())

    return schema
  }
}
