/**
 * Delete entities
 * @param {Object} db - knex connection or transaction object
 * @param {Object} entity - the entity model
 * @param {Array} uuids - an array of the uuids of entities to be deleted
 * 
 * This method has five steps :
 * 1 - fetch entities
 * 2 - build arrays of refs, forks & lists to be deleted
 * 3 - delete relations in database
 * 4 - call this method for each child entity
 * 5 - delete parent entities in database
 **/
module.exports = async function(db, entity, uuids) {
  if (!uuids.length) return
  //this.logger.info(`deleting ${entity.type}: `, uuids)
  // 1 - fetch elements
  let elements = await this.fetch(db, entity, uuids, true)
  // check if deletion is authorized
  //let checks = await this.check(db, entity, elements)

  //2 - build arrays of refs, forks & lists to be deleted 
  let refs = entity.refs.map(r => {
    return elements.filter(e => e[r.key]).map(elem => ({
      delete: r.ownership ? elem[r.key][r.target.uuid] : null,
      where: {
        [entity.id]: elem[entity.id]
      }
    }))
  })

  let forks = entity.forks.map(r => {
    return elements.filter(e => e[r.key] && e[r.$key]).map(elem => {
      let target = r.targets.find(t => t.type === elem[r.$key])
      return {
        type: elem[r.$key],
        delete: r.ownership ? elem[r.key][target.uuid] : null,
        where: {
          [entity.id]: elem[entity.id]
        }
      }
    })
  })

  let lists = entity.lists.map(r => {
    return elements.filter(e => e[r.key].length > 0).map(elem => {
      return {
        delete: r.ownership ? elem[r.key].map(e => e[r.target.uuid]) : [],
        where: {
          [entity.id]: elem[entity.id]
        }
      }
    })
  })

  // 3 - delete relations in database
  await Promise.all([
    ...refs.map((ref, i) => {
      if (!ref.length) return Promise.resolve()
      else return db(entity.refs[i].table).delete().where(q => ref.forEach(r => q.orWhere(r.where)))
    }),
    // Forks
    ...forks.map((fork, i) => {
      if (!fork.length) return Promise.resolve()
      else return db(entity.forks[i].table).delete().where(q => fork.forEach(r => q.orWhere(r.where)))
    }),
    // Lists
    ...lists.map((list, i) => {
      if (!list.length) return Promise.resolve()
      else return db(entity.lists[i].table).delete().where(q => list.forEach(r => q.orWhere(r.where)))
    }),
  ])

  // 4 - call this method for each child entity
  await Promise.all([
    ...refs.map((ref, i) => {
      let uuids = ref.filter(r => r.delete).map(r => r.delete)
      if (!uuids.length) return Promise.resolve()
      else return this.delete(db, entity.refs[i].target, uuids)
    }),
    // Forks
    ...forks.map((fork, i) => Promise.all(entity.forks[i].targets.map(target => {
      let uuids = fork.filter(r => r.delete && r.type === target.type).map(r => r.delete)
      if (!uuids.length) return Promise.resolve()
      else return this.delete(db, target, uuids)
    }))),
    // Lists
    ...lists.map((list, i) => {
      let uuids = list.filter(r => r.delete.length).flatMap(r => r.delete)
      if (!uuids.length) return Promise.resolve()
      else return this.delete(db, entity.lists[i].target, uuids)
    })
  ])

  // 5 - delete parent entities in database
  await db(entity.type).delete().where(q => elements.forEach(e => q.orWhere({
    [entity.id]: e[entity.id]
  })))

  let key = db.context.base
  this.removeCached(entity, key, uuids)
  this.emit(`${entity.type}.deleted`, {
    namespace: key,
    uuids
  })
}