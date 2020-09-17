module.exports = {
  createEntity(db, entity) {
    return this.createTable(db, entity.type, table => {
      // table metadata
      table.increments(entity.id)
      table.uuid(entity.uuid).nullable().defaultTo(null)
      table.bigInteger(entity.createTs).nullable().defaultTo(null)
      table.bigInteger(entity.updateTs).nullable().defaultTo(null)
      // create fields
      entity.fields.forEach(field => this.createField(table, field))
      // create Arrays
    }).then(() => Promise.all(entity.arrays.map(array => this.createArray(db, entity, array))))
  },
  updateEntity(db, entity, callback) {
    let _this = this
    return this.updateTable(db, entity.type, table => {
      const entityFunctions = {
        createField: (key, type) => entity.field(key, field => {
          _this.logger.info(` - create field ${type.key.grey} ${key.blue}`)
          field.type = type
          _this.createField(table, field)
        }),
        renameField: (key, newKey) => entity.field(key, field => {
          _this.logger.info(` - rename field ${key.yellow} to ${newKey.blue}`)
          _this.renameField(table, field, newKey)
          field.key = newKey
        }),
        deleteFields: (...keys) => {
          let fields = entity.fields.filter(f => keys.includes(f.key))
          _this.logger.info(` - delete fields ${fields.map(f => f.key.red).join(', ')}`)
          _this.deleteFields(table, fields)
          entity.fields = entity.fields.filter(f => !fields.includes(f))
        }
      }
      if (typeof callback === "function") callback.call(entityFunctions)
    })
  },
  async renameEntity(db, entity, newType) {
    // save previous keys
    let type = entity.type
    let typeId = entity.typeId
    // rename entity
    entity.name = newType

    // update foreign keys in relation tables
    await Promise.all([
      ...entity.model.relations.filter(r => r.targets.includes(entity))
      .map(r => this.updateTable(db, r.table, table => table.renameColumn(typeId, entity.typeId))),
      ...entity.arrays.map(a => this.updateTable(db, a.table, table => table.renameColumn(typeId, entity.typeId)))
    ])

    // rename tables
    return Promise.all([
      // entity
      this.renameTable(db, type, newType),
      // entity relations
      ...entity.relations.map(r => {
        let table = r.table
        r.setTable()
        return this.renameTable(db, table, r.table)
      }),
      // entity arrays
      ...entity.arrays.map(a => {
        let table = a.table
        a.setTable()
        return this.renameTable(db, table, a.table)
      })
    ])
  },
  deleteEntity(db, entity) {
    let m = entity.model
    m.entities = m.entities.filter(e => e !== entity)
    let relations = [...entity.relations, ...entity.model.relations.filter(r => r.targets.includes(entity))]
    if (relations.length > 0) {
      throw Error(`entity ${entity.type} is ${relations.length} relations: ${relations.map(r => r.table).join(', ')}`)
    }
    // remove arrays then table
    return Promise.all(entity.arrays.map(a => this.deleteTable(db, a.table)))
      .then(() => this.deleteTable(db, entity.type))
  }
}