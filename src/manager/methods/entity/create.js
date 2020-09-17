module.exports = async function(db, entity, elements) {
  if (!elements.length) return []
  let timestamp = Date.now()

  // complete elements
  let data = elements.map(element => Object.assign({
    [entity.id]: null,
    [entity.uuid]: element[entity.uuid] || this.uuid(),
    [entity.createTs]: timestamp,
    [entity.updateTs]: timestamp,
  }, ...entity.fields.map(f => ({
    [f.key]: (f.key in element) ? element[f.key] : f.options.default || null
  }))))

  // insert elements in database
  elements = await db(entity.type).insert(data).then(r => {
    // update element with inserted data
    //this.logger.info(`${data.length} ${entity.type} created, first id is ${r[0]}`)
    return data.map((d, i) => Object.assign(d, elements[i], {
      [entity.id]: r[0] + Number(i)
    }))
  })
  // create / select relations
  let toInsert = await Promise.all([
    // References
    Promise.all(entity.refs.map(r => {
      // select elements with non-null ref
      let elems = elements.filter(e => e[r.key])
      if (!elems.length) return []
      // generate missing uuids (needed to find created elements)
      if (r.ownership) elems.forEach(elem => {
        if (!(r.target.uuid in elem[r.key])) elem[r.key][r.target.uuid] = this.uuid()
      })
      // if the entity has ownership, create new elements ; else select existing elements
      let query = r.ownership ?
        this.create(db, r.target, elems.map(e => e[r.key])) :
        this.fetch(db, r.target, elems.map(e => e[r.key]))
      // map data to uuid
      if (r.ownership) elems.forEach(elem => elem[r.key] = elem[r.key][r.target.uuid])
      // return refs to be inserted
      return query.then(res => elems.map(elem => {
        let target = res.find(e => e[r.target.uuid] === elem[r.key])
        return {
          [r.entity.id]: elem[entity.id],
          [r.target.typeId]: target[r.target.id]
        }
      }))
    })),
    // Forks
    Promise.all(entity.forks.map(r => {
      // select elements with non-null fork
      let elems = elements.filter(e => e[r.$key])
      if (!elems.length) return []
      // if the entity has ownership, create new elements ; else select existing elements
      return Promise.all(r.targets.map(target => {
        // filter elements by target type
        let targets = elems.filter(e => e[r.$key] === target.type)
        let query = r.ownership ?
          this.create(db, target, targets.map(e => e[r.key])) :
          this.fetch(db, target, targets.map(e => e[r.key]))
        // return forks to be inserted
        return query.then(res => targets.map((elem, i) => ({
          [r.entity.id]: elem[entity.id],
          [target.typeId]: res[i][target.id]
        })))
      }))
    })),
    // Lists
    Promise.all(entity.lists.map(r => {
      // partition elements based on list length
      let elems = elements.filter(e => e[r.key] && e[r.key].length)
      if (!elems.length) return []
      // generate missing uuids (needed to find created elements)
      if (r.ownership) elems.forEach(elem => elem[r.key].forEach(e => {
        if (!e[r.target.uuid]) e[r.target.uuid] = this.uuid()
      }))
      // if the entity has ownership, create new elements ; else select existing elements
      let query = r.ownership ?
        this.create(db, r.target, elems.flatMap(e => e[r.key])) :
        this.fetch(db, r.target, elems.flatMap(e => e[r.key]))
      // map data to uuid
      if (r.ownership) elems.forEach(elem => elem[r.key] = elem[r.key].map(e => e[r.target.uuid]))
      // return lists to be inserted
      return query.then(res => elems.flatMap(elem => elem[r.key].map(uuid => ({
        [r.entity.id]: elem[entity.id],
        [r.target.typeId]: res.find(e => e[r.target.uuid] === uuid)[r.target.id]
      }))))
    }))
  ])

  //insert relations
  await Promise.all([
    // References
    Promise.all(entity.refs.map((r, i) => {
      if (!toInsert[0][i].length) return Promise.resolve()
      else return db(r.table).insert(toInsert[0][i])
    })),
    // Forks
    Promise.all(entity.forks.map((r, i) => {
      if (!toInsert[1][i].length) return Promise.resolve()
      else return db(r.table).insert(toInsert[1][i].flat())
    })),
    // Lists
    Promise.all(entity.lists.map((r, i) => {
      if (!toInsert[2][i].length) return Promise.resolve()
      else return db(r.table).insert(toInsert[2][i])
    }))
  ])

  this.emit(`${entity.type}.created`, {
    timestamp,
    namespace: db.context.base,
    uuids: elements.map(e => e[entity.uuid])
  })

  return elements
}