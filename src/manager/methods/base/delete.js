const model = require("../../../model").Ore()

module.exports = function(key) {
  return this.transaction(this.options.database, async db => {
    let entity = model.entity("database")
    // delete databases from manager_db
    return this.find(db, entity, {
        key
      })
      .then(uuids => this.select(db, entity, uuids))
      .then(databases => {
        if (databases.length > 0) {
          return this.delete(db, entity, databases.map(e => e.uid))
            .then(() => this.server.raw(`DROP DATABASE IF EXISTS ${key}`))
            .then(() => this.logger.info(`database ${key} dropped`))
        } else return Promise.resolve()
      })
  }).then(() => delete this.connections[key])
}