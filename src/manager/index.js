const EventEmitter = require("events")
const Cache = require("node-cache")
const methods = require("./methods")
const Model = require("../model")

module.exports = class Manager extends EventEmitter {

  /* beautify preserve:start */
  #model
  /* beautify preserve:end */

  constructor(model, options) {
    super()

    // Bind methods    
    Object.entries(methods).forEach(([name, method]) => this[name] = method.bind(this))

    this.model = model
    this.options = options
    this.uuid = options.uuid
    this.logger = options.logger
    this.cache = new Cache()
    this.connection = null
    this.connections = {}
  }

  get model() {
    return this.#model
  }

  set model(m) {
    this.#model = m
    this.createApi()
  }

  removeCached(entity, key, uuids) {
    this.cache.del(entity.keys(key, uuids))
  }

  transaction(key, callback) {
    let db = this.use(key)
    return db.transaction(trx => {
      trx.context.base = db.context.base
      return callback(trx)
    })
  }

  start() {
    return this.connect(this.options.retryDelay).then(async con => {
      this.server = con
      let databases = await this.listBases()
      if (databases.includes(this.options.database)) {
        this.connection = this.use(this.options.database)
      } else {
        await this.createBase(this.options.database, Model.Ore())
      }
      return this
    })
  }

  stop() {
    this.cache.close()
  }
}