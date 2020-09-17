const toArray = x => Array.isArray(x) ? x : [x]

module.exports = function() {
  this.api = this.model.entities.reduce((api, entity) => Object.assign(api, {
    [entity.type]: {
      /**
       * Select the state of one entity
       *
       * @param {string} uuids - an entity uuid
       * @return {Promise} - the entity state
       */
      state: (key, uuids) => this.transaction(key, db => {
        return this.fetch(db, entity, uuids, true)
      }).catch(err => {
        this.logger.error(`${entity.type}.state failed : ${err.message}`, err)
      }),
      /**
       *  Count the number of entities
       */
      count: (key, where = []) => {
        let db = this.use(key)
        if (!where.length) return this.count(db, entity.type)
        else return this.count(db, entity.type, ...where)
      },
      /**
       * Select one or several entities by uuid
       */
      /*
 schema: {
                  anyOf: [{
                    type: "string",
                    format: "uuid"
                  }, {
                    type: "array",
                    items: {
                      type: "string",
                      format: "uuid"
                    }
                  }]
                },
              */
      select: (key, uuids) => this.transaction(key, db => {
        return this.select(db, entity, toArray(uuids), true)
          .then(entities => Array.isArray(uuids) ? entities : (entities[0] || null))
      }).catch(err => {
        this.logger.warn(`${entity.type}.select failed : ${err.message}`)
      }),
      /**
               * Create one or many entities
               *
               * @param {string} key - the database key
               * @param {object||object[]} items - entity/entities to be created
               * @return {Promise} - the created entity or array of entities
               *  {
      anyOf: [{
        "$ref": `${this.model.name}#/definitions/${entity.type}`
      }, {
        type: "array",
        items: {
          "$ref": `${this.model.name}#/definitions/${entity.type}`
        }
      }]
    },
               */
      create: (key, items) => this.transaction(key, db => {
        return this.create(db, entity, toArray(items))
          .then(entities => this.select(db, entity, entities.map(e => e[entity.uuid])))
          .then(entities => Array.isArray(items) ? entities : (entities[0] || null))
      }).catch(err => {
        this.logger.error(`${entity.type}.create failed : ${err.message}, rolling back...`, err)
      }),
      /**
               * Update one or many entities
               * @param {string} key - the database key
               * @param {object||object[]} items - entity/entities to be created
               * @return {Promise} - the updated entity or array of entities
               * 
               *  anyOf: [{
        "$ref": `${this.model.name}#/definitions/${entity.type}`
      }, {
        type: "array",
        items: {
          "$ref": `${this.model.name}#/definitions/${entity.type}`
        }
      }]
               */
      update: (key, items) => this.transaction(key, db => {
        return this.update(db, entity, toArray(items))
          .then(entities => this.select(db, entity, entities.map(e => e[entity.uuid])))
          .then(entities => Array.isArray(items) ? entities : (entities[0] || null))
      }).catch(err => {
        this.logger.error(`${entity.type}.update failed : ${err.message}, rolling back...`, err)
      }),
      /**
               * Delete one or many entities
               *
               * @param {string} key - the database key
               * @param {string||string[]} items - entity/entities to be created
               * @return {Promise} - 
               *  anyOf: [{
        type: "string",
        format: "uuid"
      }, {
        type: "array",
        items: {
          type: "string",
          format: "uuid"
        }
      }]
               */
      delete: (key, uuids) => this.transaction(key, db => {
        return this.delete(db, entity, toArray(uuids))
      }).catch(err => {
        this.logger.error(`${entity.type}.delete failed : ${err.message}, rolling back...`, err)
      })
    }
  }), {})
}