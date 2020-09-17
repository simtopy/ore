module.exports = async function(db, entity, elements) {
  console.log("checking", elements)

  // check if the element is referenced
  let checks = this.model.relations.filter(r => {
    if ("target" in r) return r.target.type === entity.type
    return r.targets.map(t => t.type).includes(entity.type)
  })
  let count = await Promise.all(checks.map(r => {
    return this.count(db, r.table, entity.typeId, "in", elements.map(e => e[entity.id]))
  })).then(res => res.reduce((sum, n) => sum += n, 0))
  if (count > 0) {
    throw Error(`Check Error : ${count} references`)
  }
}