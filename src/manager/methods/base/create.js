module.exports = async function(key, model = null) {
  // select the model
  if (!model) model = this.model
  // create the base
  await this.server.raw(`CREATE DATABASE IF NOT EXISTS ${key}`)
  let db = this.use(key)
  // generate entity tables
  await Promise.all(model.entities.map(entity => this.createEntity(db, entity)))
  // generate relation tables
  await Promise.all(model.relations.map(relation => this.createRelation(db, relation)))
  return this.createModel(key, model)
}