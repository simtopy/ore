const knex = require("knex")

module.exports = async function(db, entity, elements) {

  let timestamp = {
    [entity.updateTs]: Date.now()
  }

  // Fetch current elements
  let prev = await this.fetch(db, entity, elements.map(e => e[entity.uuid]), true)

  /* 
    Complete updated elements
  */
  let next = prev.map((e, i) => Object.assign({}, e, elements[i], timestamp))
  /*
    Replace uuids with objects fetch from database
    this is done because we will need ids to insert / delete data
  */
  await Promise.all([
    // References
    Promise.all(entity.refs.map(r => {
      let elems = next.filter(elem => typeof elem[r.key] === "string")
      return this.fetch(db, r.target, elems.map(elem => elem[r.key]))
        .then(res => elems.forEach(elem => elem[r.key] = res.find(e => e[r.target.uuid] === elem[r.key])))
    })),
    // Forks
    Promise.all(entity.forks.map(r => {
      return Promise.all(r.targets.map(target => {
        let elems = next.filter(elem => (typeof elem[r.key] === "string") && (elem[r.$key] === target.type))
        return this.fetch(db, target, elems.map(elem => elem[r.key]))
          .then(res => elems.forEach(elem => elem[r.key] = res.find(e => e[target.uuid] === elem[r.key])))
      }))
    })),
    // Lists
    Promise.all(entity.lists.map(r => {
      let elems = next.filter(e => e[r.key].some(e => typeof e === "string"))
      return this.fetch(db, r.target, elems.reduce((uuids, elem) => uuids.concat(elem[r.key].filter(e => typeof e === "string")), []))
        .then(res => elems.forEach(elem => elem[r.key] = elem[r.key].map(uuid => {
          if (typeof uuid !== "string") return uuid
          else return res.find(e => e[r.target.uuid] === uuid)
        })))
    }))
  ])
  /*
    console.log("prev:", ...prev)
    console.log("next:", ...next)
  */
  /*
    Update fields
  */
  let cols = [entity.updateTs, ...entity.fields.map(f => f.key)]
  let records = next.map(e => cols.reduce((r, k) => Object.assign(r, {
    [k]: e[k]
  }), {}))

  await Promise.all(records.map((data, i) => db(entity.type).update(data).where(entity.id, next[i][entity.id])))

  /*
    Compare references of current & updates entities
  */

  let refs = entity.refs.map(r => ({
    // creations
    inserts: next.filter((e, i) => e[r.key] && !prev[i][r.key]).map(elem => ({
      create: r.ownership ? elem[r.key] : null,
      relation: {
        [r.entity.id]: elem[entity.id],
        [r.target.typeId]: elem[r.key][r.target.id] || null
      }
    })),
    // substitutions
    updates: next.filter((e, i) => {
      // current and update ref should be objects
      if (!e[r.key]) return false
      if (!prev[i][r.key]) return false
      // current and update have the same id
      if (e[r.key][r.target.id] === prev[i][r.target.id]) return false
      return true
    }).map(elem => ({
      create: r.ownership ? elem[r.key] : null,
      delete: r.ownership ? prev.find(e => e[entity.id] === elem[entity.id])[r.key][r.target.uuid] : null,
      relation: {
        [r.target.typeId]: elem[r.key][r.target.id] || null
      },
      where: {
        [r.entity.id]: elem[entity.id],
      }
    })),
    // destructions
    deletes: prev.filter((e, i) => e[r.key] && (!next[i][r.key])).map(elem => ({
      delete: r.ownership ? elem[r.key][r.target.uuid] : null,
      where: {
        [r.entity.id]: elem[entity.id],
      }
    }))
  }))

  /*
    Compare Forks of current & updates entities
  */

  let forks = entity.forks.map(r => ({
    // creations
    inserts: next.filter((elem, i) => elem[r.$key] && elem[r.key] && !prev[i][r.key]).map(elem => {
      let relation = Object.assign({
        [r.entity.id]: elem[entity.id]
      }, ...r.targets.map(target => ({
        [target.typeId]: (elem[r.$key] === target.type) ? elem[r.key][target.id] || null : null
      })))
      return {
        createType: elem[r.$key],
        create: r.ownership ? elem[r.key] : null,
        relation
      }
    }),
    // substitutions
    updates: next.filter((elem, i) => {
      /*
        To pass the fork update filter :
        - update & current should not be null
        - update should have a type
        - update & current have different types
          or same type and different ids
      */
      if (!(elem[r.key] && prev[i][r.key])) return false
      if (!elem[r.$key]) return false
      if (elem[r.$key] !== prev[i][r.$key]) return true
      let target = r.targets.find(t => t.type === elem[r.$key])
      if (elem[r.key][target.id] === prev[i][r.key][target.id]) return false
      return true
    }).map(elem => {
      let cur = prev.find(e => e[entity.id] === elem[entity.id])
      return {
        createType: elem[r.$key],
        create: r.ownership ? elem[r.key] : null,
        deleteType: cur[r.$key],
        delete: r.ownership ? cur[r.key][r.targets.find(t => t.type === cur[r.$key]).uuid] : null,
        where: {
          [r.entity.id]: elem[entity.id],
        },
        relation: r.targets.reduce((obj, target) => {
          if (elem[r.$key] === target.type) obj[target.typeId] = elem[r.key][target.id] || null
          else obj[target.typeId] = null
          return obj
        }, {})
      }
    }),
    // destructions   
    deletes: prev.filter((elem, i) => elem[r.$key] && elem[r.key] && (!next[i][r.key])).map(elem => {
      let target = r.targets.find(t => t.type === elem[r.$key])
      return {
        deleteType: elem[r.$key],
        delete: r.ownership ? elem[r.key][target.uuid] : null,
        where: {
          [r.entity.id]: elem[entity.id]
        }
      }
    })
  }))

  /*
    Compare lists of current & updates entities
  */

  let lists = entity.lists.map(r => ({
    // creations
    inserts: next.reduce((array, elem, i) => {
      let ids = prev[i][r.key].map(e => e[r.target.id])
      return array.concat(elem[r.key].filter(e => !ids.includes(e[r.target.id])).map(item => ({
        create: r.ownership ? item : null,
        relation: {
          [r.entity.id]: elem[entity.id],
          [r.target.typeId]: item[r.target.id] || null
        }
      })))
    }, []),
    // destructions
    deletes: prev.reduce((array, elem, i) => {
      let ids = next[i][r.key].map(e => e[r.target.id]).filter(e => e)
      return array.concat(elem[r.key].filter(e => !ids.includes(e[r.target.id])).map(item => ({
        delete: r.ownership ? item[r.target.uuid] : null,
        where: {
          [r.entity.id]: elem[entity.id],
          [r.target.typeId]: item[r.target.id]
        }
      })))
    }, []),
  }))

  /*
    Create entities
  */
  await Promise.all([
    // References
    Promise.all(entity.refs.map((r, i) => {
      let toCreate = [...refs[i].inserts, ...refs[i].updates].filter(e => e.create)
      return this.create(db, r.target, toCreate.map(e => e.create)).then(created => {
        toCreate.forEach((e, i) => e.relation[r.target.typeId] = created[i][r.target.id])
      })
    })),
    // Forks
    Promise.all(entity.forks.map((r, i) => Promise.all(r.targets.map(target => {
      let toCreate = [...forks[i].inserts, ...forks[i].updates].filter(e => e.create && e.createType === target.type)
      return this.create(db, target, toCreate.map(e => e.create)).then(created => {
        toCreate.forEach((e, i) => e.relation[target.typeId] = created[i][target.id])
      })
    })))),
    // Lists
    Promise.all(entity.lists.map((r, i) => {
      let toCreate = lists[i].inserts.filter(e => e.create)
      return this.create(db, r.target, toCreate.map(e => e.create)).then(created => {
        toCreate.forEach((e, i) => e.relation[r.target.typeId] = created[i][r.target.id])
      })
    })),
  ])
  /*
    entity.refs.forEach((r, i) => {
      if (refs[i].inserts.length) console.log(`${r.key} inserts`, refs[i].inserts)
      if (refs[i].updates.length) console.log(`${r.key} updates`, refs[i].updates)
      if (refs[i].deletes.length) console.log(`${r.key} deletes`, refs[i].deletes)
    })
    entity.forks.forEach((r, i) => {
      if (forks[i].inserts.length) console.log(`${r.key} inserts`, forks[i].inserts)
      if (forks[i].updates.length) console.log(`${r.key} updates`, forks[i].updates)
      if (forks[i].deletes.length) console.log(`${r.key} deletes`, forks[i].deletes)
    })
    entity.lists.forEach((r, i) => {
      if (lists[i].inserts.length) console.log(`${r.key} inserts`, lists[i].inserts)
      if (lists[i].deletes.length) console.log(`${r.key} deletes`, lists[i].deletes)
    })
    */

  /*
    Update relations in database
  */
  await Promise.all([
    // References
    Promise.all(refs.map((ref, i) => Promise.all([
      //inserts
      !ref.inserts.length ? Promise.resolve() : db(entity.refs[i].table).insert(ref.inserts.map(r => r.relation)),
      //updates
      Promise.all(ref.updates.map(r => db(entity.refs[i].table).update(r.relation).where(r.where))),
      //deletes
      !ref.deletes.length ? Promise.resolve() : db(entity.refs[i].table).delete().where(q => ref.deletes.forEach(r => q.orWhere(r.where)))
    ]))),
    // Forks
    Promise.all(forks.map((fork, i) => Promise.all([
      //inserts
      !fork.inserts.length ? Promise.resolve() : db(entity.forks[i].table).insert(fork.inserts.map(r => r.relation)),
      //updates
      Promise.all(fork.updates.map(r => db(entity.forks[i].table).update(r.relation).where(r.where))),
      //deletes
      !fork.deletes.length ? Promise.resolve() : db(entity.forks[i].table).delete().where(q => fork.deletes.forEach(r => q.orWhere(r.where)))
    ]))),
    // Lists
    Promise.all(lists.map((list, i) => Promise.all([
      //inserts
      !list.inserts.length ? Promise.resolve() : db(entity.lists[i].table).insert(list.inserts.map(r => r.relation)),
      //deletes
      !list.deletes.length ? Promise.resolve() : db(entity.lists[i].table).delete().where(q => list.deletes.forEach(r => q.orWhere(r.where)))
    ]))),
  ])

  /*
    Delete dependencies
  */

  await Promise.all([
    // References
    Promise.all(refs.map((ref, i) => {
      let deletes = [...ref.updates.filter(r => r.delete), ...ref.deletes.filter(r => r.delete)]
      if (!deletes.length) return Promise.resolve()
      else return this.delete(db, entity.refs[i].target, deletes.map(e => e.delete))
    })),
    // Forks
    Promise.all(forks.map((fork, i) => {
      let deletes = [...fork.updates.filter(r => r.delete), ...fork.deletes.filter(r => r.delete)]
      return Promise.all(entity.forks[i].targets.map(target => {
        let dels = deletes.filter(r => r.deleteType === target.type)
        if (!dels.length) return Promise.resolve()
        else return this.delete(db, target, dels.map(e => e.delete))
      }))
    })),
    // Lists
    Promise.all(lists.map((list, i) => {
      let deletes = list.deletes.filter(r => r.delete)
      if (!deletes.length) return Promise.resolve()
      else return this.delete(db, entity.lists[i].target, deletes.map(e => e.delete))
    })),
  ])

  let key = db.context.base
  let uuids = next.map(e => e[entity.uuid])
  this.removeCached(entity, key, uuids)
  this.emit(`${entity.type}.updated`, {
    timestamp,
    namespace: key,
    uuids
  })

  return next
}