module.exports = class FieldArray {

  /* beautify preserve:start */
  #key
  #entity
  #table
  #options
  /* beautify preserve:end */

  constructor(entity, key, type, index = null) {
    this.#key = key
    this.#entity = entity
    this.type = type
    this.index = index
    this.#options = {
      default: null
    }
    this.setTable()
  }

  /*
    getter & setters
  */

  set key(key) {
    this.#key = key
    this.setTable()
  }

  get key() {
    return this.#key
  }

  set entity(entity) {
    this.#entity = entity
    this.setTable()
  }

  get entity() {
    return this.#entity
  }

  get table() {
    return this.#table
  }

  get options() {
    return this.#options
  }

  set default(value) {
    this.#options.default = value
  }

  /*
    Methods
  */
  setTable() {
    this.#table = [this.#entity.type, this.#key].join("_")
  }

}