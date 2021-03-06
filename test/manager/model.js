const Ore = require("../lib")
module.exports = new Ore.Model("store")
  .entity("root", e => e
    .setField("name", "string")
    .hasOne("root", "root")
    .hasOne("hasA", "itemA")
    .hasOne("refB", "itemB", false)
    .hasOneOf("hasAB", "hasABType", ["itemA", "itemB"])
    .hasOneOf("refAB", "refABType", ["itemA", "itemB"], false)
    .hasMany("hasAs", "itemA")
    .hasMany("refBs", "itemB", false)
  )
  .entity("itemA", e => e.setField("name", "string"))
  .entity("itemB", e => e.setField("name", "string"))