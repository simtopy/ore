const Ore = require("../../../index")

/* Testing field modifications */
function v1tov2() {
  // update model name
  this.renameModel("v2")
  // update entity scene
  return this.updateEntity("scene", function() {
    // rename a field
    this.renameField("name", "title")
    // create a field
    this.createField("comment", Ore.Types.String)
    // delete a field
    this.deleteFields("foo")
  })
}

/* Testing entity modifications */
async function v2tov3() {
  // update model name
  this.renameModel("v3")
  // rename root to project
  await this.renameEntity("root", "project")
  // update projet
  await this.updateEntity("project", function() {
    // delete project.name
    this.deleteFields("name")
  })
  // create entities settings, mesh, solid & reference
  await Promise.all([
    this.createEntity("settings", function() {
      this.createField("maxSolids", Ore.Types.Integer)
    }),
    this.createEntity("mesh"),
    this.createEntity("solid", function() {
      this.createField("name", Ore.Types.String)
    }),
    this.createEntity("reference", function() {
      this.createField("x", Ore.Types.Real)
      this.createField("y", Ore.Types.Real)
      this.createField("z", Ore.Types.Real)
    })
  ])
  // create relations
  await Promise.all([
    this.createRef("solid", "ref", "reference"),
    this.createRef("solid", "geometry", "mesh", false),
    this.deleteRelation("junk", "roots")
  ])
  // delete a table
  await this.deleteEntity("junk")
}

/* Testing relations modifications */
async function v3tov4(curr, next) {
  await this.createRelation(db, "project", "settings", table => {

  })
}

module.exports = {
  v1: new Ore.Model("v1", "1.0.0").fromFiles(__dirname, "v1"),
  v2: new Ore.Model("v2").fromFiles(__dirname, "v2")
    .migration("2.0.0", v1tov2),
  v3: new Ore.Model("v3").fromFiles(__dirname, "v3")
    .migration("3.0.0", v2tov3)
    .migration("2.0.0", v1tov2),
  v4: new Ore.Model("v4").fromFiles(__dirname, "v4")
    .migration("4.0.0", v3tov4)
    .migration("3.0.0", v2tov3)
    .migration("2.0.0", v1tov2)
}