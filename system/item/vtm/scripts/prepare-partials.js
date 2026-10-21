export const prepareBaneContext = async function (context, item) {
  const itemData = item.system

  // Tab data
  context.tab = context.tabs.bane

  // Part-specific data
  context.bane = itemData.bane
  context.enrichedBane = await Loom.applications.ux.TextEditor.implementation.enrichHTML(
    itemData.bane
  )

  return context
}
