const uuid = require("uuid").v4
const Types = require("./types")
const Model = require("./model")
const Manager = require("./manager")

function createManager(model, options = {
  uuid,
  debug: false,
  client: "mysql",
  database: "ore_manager",
  connection: {
    host: "localhost",
    user: "test",
    password: "",
  },
  logger: {
    info: console.log,
    warn: console.warn,
    debug: console.log,
    error: console.error,
  }
}) {
  if (!model) model = Model.Ore()
  return new Manager(model, options)
}

module.exports = {
  Types,
  Model,
  createManager
}