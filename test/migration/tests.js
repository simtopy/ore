const Assert = require("assert")
const Ore = require("../lib")
const models = require("./models")

describe("Database creation & migration", function () {

  /* Clears databases if it exists */
  before(async function () {
    let manager = await Ore.createManager().start()
    // start the broker and delete databases
    await Promise.all([
      "v1", "v2", "v3", "v4"
    ].map(v => manager.deleteBase(`test_ore_migration_${v}`)))
    return manager.stop()
  })

  /* 
    Create all databases from last version
  */

  it("creates v1 database", async function () {
    let key = "test_ore_migration_v1"
    let manager = await Ore.createManager(models.v1).start()
    await manager.createBase(key)
    this.schema_v1 = models.v1.JSONschema()
    return manager.stop()
  })

  it("creates v2 database", async function () {
    let key = "test_ore_migration_v2"
    let manager = await Ore.createManager(models.v2).start()
    await manager.createBase(key)
    this.schema_v2 = models.v2.JSONschema()
    return manager.stop()
  })

  it("creates v3 database", async function () {
    let key = "test_ore_migration_v3"
    let manager = await Ore.createManager(models.v3).start()
    await manager.createBase(key)
    this.schema_v2 = models.v3.JSONschema()
    return manager.stop()
  })
  /*
  it("creates v4 database", async function() {
    let key = "test_ore_migration_v4"
    let ctx = await startBroker(models.v4)
    await ctx.broker.call("store.createBase", {
      key
    })
    this.schema_v4 = await ctx.store.dbSchema(key)
    return ctx.broker.stop()
  })
  */

  it("exports v1 database", async function () {
    let manager = await Ore.createManager().start()
    this.dumpfile = await manager.exportBase("test_ore_migration_v1")
    return manager.stop()
  })

  it("migrates from v1 to v2", async function () {
    let key = "test_ore_migration_v1"
    let manager = await Ore.createManager(models.v2).start()
    // migrate the database
    let model = await manager.updateBase(key)
    // check database schema
    Assert.deepStrictEqual(model.JSONschema(), models.v2.JSONschema())
    return manager.stop()
  })

  it("migrates from v2 to v3", async function () {
    let key = "test_ore_migration_v1"
    let manager = await Ore.createManager(models.v3).start()
    // migrate the database
    let model = await manager.updateBase(key)
    // check database schema
    Assert.deepStrictEqual(model.JSONschema(), models.v3.JSONschema())
    return manager.stop()
  })
  /*
    it("migrates from v3 to v4", async function() {
        let key = "test_ore_migration_v1"
        let ctx = await startBroker(models.v4)
        // migrate the database
        await ctx.broker.call("store.updateBase", {
          key
        })
        // check database schema
        let schema = await ctx.store.dbSchema(key)
        Object.entries(this.schema_v4).forEach(([key, value]) => {
          Assert.deepEqual(schema[key], value, `error in table ${key}`)
        })
        return ctx.broker.stop()
      })
  */

  /*
  it("restore the database", async function() {
    let key = "test_ore_migration_backup"
    let manager = await Ore.createManager().start()

    // restore the database
    await manager.importBase(key, Fs.readFileSync(this.dumpfile))
    // check database schema
    let schema = await ctx.store.dbSchema(key)
    Object.entries(this.schema_v1).forEach(([key, value]) => {
      Assert.deepEqual(schema[key], value, `error in table ${key}`)
    })
  })
*/
  /*
    it("migrates from v1 to last version", async function() {
      let key = "test_ore_migration_backup"
      let ctx = await startBroker(models.v3)
      // migrate the database
      await ctx.broker.call("store.updateBase", {
        key
      })
      // check database schema
      let schema = await ctx.store.dbSchema(key)
      Object.entries(this.schema_v3).forEach(([key, value]) => {
        Assert.deepEqual(schema[key], value, `error in table ${key}`)
      })
      return ctx.broker.stop()
    })*/
})