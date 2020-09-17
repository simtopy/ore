module.exports = {
  createRelation(db, relation) {
    return this.createTable(db, relation.table, table => {
      // source foreign field
      table.integer(relation.entity.id).unsigned().nullable().defaultTo(null)
      table.foreign(relation.entity.id).references(relation.entity.id).inTable(relation.entity.type)
      // targets foreign fields
      relation.targets.forEach(target => {
        table.integer(target.typeId).unsigned().nullable().defaultTo(null)
        table.foreign(target.typeId).references(target.id).inTable(target.type)
      })
      // comments
      table.comment(`${relation.type},${relation.ownership},${relation.nullable}`)
    })
  },
  renameRelation(db, prev, next) {
    return this.renameTable(db, prev.table, next.table)
  },
  deleteRelation(db, relation) {
    let table = relation.table
    let entity = relation.entity
    // remove relation from the model
    entity.relations = entity.relations.filter(r => r !== relation)
    entity.model.relations = entity.model.relations.filter(r => r !== relation)
    relation.target = []
    return this.deleteTable(db, relation.table)
  }
}