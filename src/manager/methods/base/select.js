const model = require("../../../model").Ore()

module.exports = function(key) {
  let db = this.use(this.options.database)
  return this.find(db, model.entity("database"), {
      key
    })
    .then(uuids => {
      if (uuids.length === 0) return Promise.reject(Error(`no database "${key}" found`))
      if (uuids.length > 1) return Promise.reject(Error(`multiple databases "${key}" found`))
      return this.select(db, model.entity("database"), uuids).then(res => res[0])
    })
}