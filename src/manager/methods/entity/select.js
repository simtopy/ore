module.exports = async function(db, entity, uuids) {
  if (!uuids.length) return []
  this.logger.info(`selecting ${uuids.length} ${entity.type}`)
  let rawdata = await this.fetch(db, entity, uuids, true)
  // clone elements
  let elements = rawdata.map(data => {
    // copy fields
    let elem = Object.assign({}, data)
    // remove id from results
    delete elem[entity.id]
    // format relations
    entity.refs.forEach(r => elem[r.key] = elem[r.key] ? elem[r.key][r.target.uuid] : null)
    entity.forks.forEach(r => {
      if (elem[r.$key]) {
        let target = r.targets.find(t => t.type === elem[r.$key])
        elem[r.key] = elem[r.key][target.uuid]
      }
    })
    entity.lists.forEach(r => elem[r.key] = elem[r.key].map(e => e[r.target.uuid]))
    return elem
  })

  // return elements (with order)
  return uuids.map(uuid => {
    let elem = elements.find(e => e[entity.uuid] === uuid)
    if (!elem) throw Error(`failed to fetch ${entity.type}#${uuid}`)
    else return elem
  })
}