const EventEmitter = require("events")

class ObservableSet {
  constructor(model, namespace) {
    this.namespace = namespace
    this.observables = this.index(model.entities.map(e => e.type))
  }

  index(types) {
    return types.reduce((index, type) => Object.assign(index, {
      [type]: {}
    }), {})
  }
  /*
  update(type, uuid) {
    let obs = this.observables[type][uuid]
    if (obs) obs.update(this.name)
  }
  */
}

class Observable extends EventEmitter {
  constructor(index) {
    super()
    this.entities = {}
    this.observables = []
    this.index = index
  }

  update(state) {
    console.log(`observable ${this.entity.type}#${this.uuid} update`, state)
    /*
    this.index[this.entity.type][this.uuid] = state[this.entity.updateTs]
    console.log(`observable ${this.entity.type}#${this.uuid} update`, state)
    //Object.entries(state.relations).forEach(([type, elements]) => {})
    console.log(this.index)
    */
  }

  watch(observable) {
    observable.on("update", index => {
      this.merge(index)
    })
  }
}

module.exports = {
  Observable,
  ObservableSet
}

/*

class ObservableSet {
  constructor(broker, model, store, name) {
    this.name = name
    this.store = store
    this.broker = broker
    this.observables = this.index(model.entities.map(e => e.type))
  }

  index(types) {
    return types.reduce((index, type) => Object.assign(index, {
      [type]: {}
    }), {})
  }

  update(type, uuid) {
    let obs = this.observables[type][uuid]
    if (obs) obs.update(this.name)
  }

  async addObservable(entity, uuid) {
    let index = this.index(Object.keys(this.observables))
    let obs = new Observable(this.broker, this.store, index, entity, uuid)
    await obs.update(this.name)
    this.observables[entity.type][uuid] = obs
    return obs
  }
}

class Observable extends EventEmitter {
  constructor(broker, store, index, entity, uuid) {
    super()
    this.store = store
    this.broker = broker
    this.entity = entity
    this.uuid = uuid
    this.index = index
    this.index[entity.type][uuid] = null
  }

  update(name) {
    this.broker.call(`${this.store}.${this.entity.type}.state`, this.uuid, {
        meta: {
          base: name
        }
      })
      .then(state => {
        this.index[this.entity.type][this.uuid] = state.timestamp
        console.log(`observable ${this.entity.type}#${this.uuid} update`, state)
        //Object.entries(state.relations).forEach(([type, elements]) => {})
        console.log(this.index)
      })
  }
}
*/