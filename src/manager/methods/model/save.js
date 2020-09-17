const Ore = require("../../../model").Ore()

module.exports = function(database, model, event = "creation") {
  database.versions.push({
    name: model.name,
    version: model.version,
    event,
    entities: model.entities.map(e => ({
      uid: e.uid,
      type: e.type,
      privateId: e.id,
      publicId: e.uuid,
      createTs: e.createTs,
      updateTs: e.updateTs,
      fields: e.fields.map(f => ({
        key: f.key,
        type: f.type.key
      })),
      arrays: e.arrays.map(a => ({
        key: a.key,
        type: a.type.key,
        index: a.index,
        table: a.table
      }))
    })),
    relations: model.relations.map(r => ({
      uid: r.uid,
      key: r.key,
      type: r.type,
      table: r.table,
      nullable: r.nullable,
      ownership: r.ownership,
      source: r.entity.uid,
      targets: r.targets.map(t => t.uid)
    }))
  })

  return this.transaction(this.options.database, async db => {
    await this.update(db, Ore.entity("database"), [database])
  })
}