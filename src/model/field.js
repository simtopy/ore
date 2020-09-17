module.exports = class Field {

  /* beautify preserve:start */
  #entity
  #options
  /* beautify preserve:end */

  constructor(entity, key, type) {
    this.key = key
    this.type = type
    this.#entity = entity
    this.#options = {
      default: null
    }
  }

  /*
    getter & setters
  */

  get entity() {
    return this.#entity
  }

  get options() {
    return this.#options
  }

  set default(value) {
    this.#options.default = value
  }
}