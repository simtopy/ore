module.exports = function(db, entity, where = null) {
  let query = db(entity.type).select(entity.uuid)
  if (where) query.where(where)
  return query.then(res => res.map(r => r[entity.uuid]))
}