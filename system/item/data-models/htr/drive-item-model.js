import { WoDItemModel } from '../base-item-model.js'

export class DriveItemModel extends WoDItemModel {
  static defineSchema() {
    const fields = Loom.fields_v14

    const schema = super.defineSchema()

    schema.redemption = new fields.HTMLField({ initial: '' })

    return schema
  }
}
