function partition(array, test) {
  return array.reduce((r, e) => {
    if (test(e)) r[0].push(e)
    else r[1].push(e)
    return r
  }, [
    [],
    []
  ])
}

module.exports = async function(db, entity, uuids) {
  if (!uuids.length) return []

  // find cached elements
  let elements = Object.values(this.cache.mget(entity.keys(db.context.base, uuids)))
  // partition uuids array in cached & not-cached
  let [cached, ncached] = partition(uuids, uuid => {
    return elements.map(e => e[entity.uuid]).includes(uuid)
  })
  this.logger.info(`fetch ${entity.type}: ${cached.length} cache hit(s), ${ncached.length} miss`)

  /*
    If some elements are not cached, select them and their dependencies from the db
  */
  if (ncached.length) {
    ncached = await db(entity.type).select().whereIn(entity.uuid, ncached)
    // fetch not-cached elements from database
    let ids = ncached.map(e => e[entity.id])
    // complete sub-entities
    await Promise.all([
      // References
      ...entity.refs.map(r => db(r.target.type)
        .select()
        .innerJoin(r.table, `${r.target.type}.${r.target.id}`, `${r.table}.${r.target.typeId}`)
        .whereIn(`${r.table}.${entity.id}`, ids)
        .columns({
          [entity.typeId]: `${r.table}.${entity.id}`,
          [r.target.id]: `${r.target.type}.${r.target.id}`,
        }, r.target.uuid)
        .then(refs => ncached.forEach(elem => {
          let ref = refs.find(e => e[entity.typeId] === elem[entity.id])
          elem[r.key] = ref || null
        }))
      ),
      // Forks
      ...entity.forks.map(r => {
        // initialize fork to null
        ncached.forEach(elem => {
          elem[r.$key] = null
          elem[r.key] = null
        })
        return Promise.all(r.targets.map(target => db(target.type)
          .select()
          .innerJoin(r.table, `${target.type}.${target.id}`, `${r.table}.${target.typeId}`)
          .whereIn(`${r.table}.${entity.id}`, ids)
          .columns({
            [entity.typeId]: `${r.table}.${entity.id}`,
            [target.id]: `${target.type}.${target.id}`,
          }, target.uuid)
          .then(res => ncached.forEach(elem => {
            let fork = res.find(e => e[entity.typeId] === elem[entity.id])
            if (fork) {
              elem[r.$key] = target.type
              elem[r.key] = fork
            }
          }))))
      }),
      // Lists
      ...entity.lists.map(r => {
        return db(r.target.type).select()
          .innerJoin(r.table, `${r.target.type}.${r.target.id}`, `${r.table}.${r.target.typeId}`)
          .whereIn(`${r.table}.${entity.id}`, ids)
          .columns({
            [entity.typeId]: `${r.table}.${entity.id}`,
            [r.target.id]: `${r.target.type}.${r.target.id}`,
          }, r.target.uuid)
          .then(result => ncached.forEach(elem => elem[r.key] = result.filter(e => e[entity.typeId] === elem[entity.id])))
      })
    ])
    // update the cache
    this.cache.mset(ncached.map(val => ({
      key: entity.key(db.context.base, val[entity.uuid]),
      val
    })))
    // complete elements with cached 
    elements.push(...ncached)
  }

  return elements
}