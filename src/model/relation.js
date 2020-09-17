const uuid = require("uuid").v4

module.exports = class Relation {

  /* beautify preserve:start */
  #key
  #type
  #table
  #entity
  #targets
  /* beautify preserve:end */

  constructor(type, entity, key) {
    this.uid = uuid()
    this.#key = key
    this.#type = type
    this.#entity = entity
    this.#targets = []
    this.ownership = null
    this.nullable = null
    this.setTable()
  }

  /*
    getter & setters
  */

  get type() {
    return this.#type
  }

  set type(type) {
    if (!["ref", "fork", "list"].includes(type)) throw Error("unhandled type", type)
    this.#type = type
    this.setTable()
  }

  get entity() {
    return this.#entity
  }

  set entity(entity) {
    this.#entity = entity
    this.setTable()
  }

  get key() {
    return this.#key
  }

  set key(key) {
    this.#key = key
    this.setTable()
  }

  get table() {
    return this.#table
  }

  set target(targets) {
    if (Array.isArray(targets)) this.#targets = targets
    else this.#targets = [targets]
  }

  get target() {
    return this.#targets[0]
  }

  get targets() {
    return this.#targets
  }

  setTable() {
    if (!this.#type) this.#table = null
    if (!this.#entity) this.#table = this.#key
    else this.#table = [this.#entity.type, this.#key].join("_")
  }
}