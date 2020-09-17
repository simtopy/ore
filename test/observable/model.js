const Ore = require("../../index")

module.exports = new Ore.Model("observables")
  .entity("project", e => e
    .setField("name", "string")
    .hasOne("settings", "settings", true)
    .hasMany("users", "user", false)
    .hasMany("items", "item", true)
  )
  .entity("user", e => e.setField("name", Ore.Types.String))
  .entity("item", e => e.setField("size", Ore.Types.Real))
  .entity("library", e => e.hasMany("items", "item", true))
  .entity("settings", e => e.setField("name", Ore.Types.String))