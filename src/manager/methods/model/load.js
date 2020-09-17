const Model = require("../../../model")
const Ore = Model.Ore()

module.exports = async function(model) {

  /*
    Load model data
  */

  let db = this.use(this.options.database)

  // load entites and relations
  let [entities, relations] = await Promise.all([
    this.select(db, Ore.entity("entity"), model.entities),
    this.select(db, Ore.entity("relation"), model.relations)
  ])

  // load fields and arrays
  let [fields, arrays] = await Promise.all([
    this.select(db, Ore.entity("field"), entities.flatMap(e => e.fields)),
    this.select(db, Ore.entity("array"), entities.flatMap(e => e.arrays))
  ])

  /*
    Build model
  */

  // set version
  let m = new Model(model.name, model.version)

  // set entities
  entities.filter(e => !m.entities.map(e => e.type).includes(e.type))
    .forEach(e => m.entity(e.type, entity => {
      // set entity
      entity.id = e.privateId
      entity.uuid = e.publicId
      entity.createTs = e.createTs
      entity.updateTs = e.updateTs
      e.fields.forEach(uid => {
        let field = fields.find(f => f.uid === uid)
        if (!field) throw Error(`entity ${e.type} field ${uid} not found`)
        entity.setField(field.key, field.type)
      })
      e.arrays.forEach(uid => {
        let array = arrays.find(f => f.uid === uid)
        if (!array) throw Error(`entity ${e.type} array ${uid} not found`)
        entity.setArray(array.key, array.type, array.index)
      })
    }))

  // set relations
  relations.filter(r => !m.relations.map(r => r.table).includes(r.table)).forEach(r => {
    // finds the source
    let source = entities.find(e => e.uid === r.source)
    // add relation to source
    m.entity(source.type, e => e.relation(r.key, relation => {
      relation.type = r.type
      relation.nullable = r.nullable ? true : false
      relation.ownership = r.ownership ? true : false
      relation.target = r.targets.map(uid => {
        let target = entities.find(e => e.uid === uid)
        if (!target) throw Error(`relation ${r.table} target ${uid} not found`)
        return m.entity(target.type)
      })
    }))
  })
  return m
}