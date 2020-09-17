const model = require("../../../model").Ore()

module.exports = function(uuids) {
  let db = this.use(this.options.database)
  return this.select(db, model.entity("model"), uuids)
    .then(models => models.sort((m1, m2) => m2.updatedAt - m1.updatedAt))
}