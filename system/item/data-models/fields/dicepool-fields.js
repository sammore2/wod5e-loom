const fields = Loom.fields_v14

export function dicepoolFields() {
  return {
    dicepool: new fields.ObjectField({ initial: {} })
  }
}
