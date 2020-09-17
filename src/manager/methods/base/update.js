const Assert = require("assert")

module.exports = async function(key) {
  // select database
  let database = await this.selectBase(key)
  let versions = await this.selectModels(database.versions)
  // get the current model (first in versions list)
  let model = await this.loadModel(versions[0])
  // get migration scripts
  let migrations = this.model.migrateFrom(model.version)
  // starts migration transaction
  if (migrations.length) {
    this.logger.info(`upgrading database ${key} from ${model.version}`)
    return this.transaction(key, async db => {

      const _this = this;

      /*
        migration functions
        t for type
        m for model
        e for entity
      */

      const findEntity = (t, m, cb) => {
        let e = m.entities.find(e => e.type === t)
        if (!e) throw Error(`entity ${e} not in model ${m.name} ${m.version}`)
        else return cb(e)
      }

      const migrationFunctions = {
        renameModel: name => model.name = name,
        createEntity: (t, cb) => model.entity(t, e => {
          _this.logger.info(`> create Entity ${t.green}`)

          const entityCreateFunctions = {
            createField: (key, type) => e.setField(key, type),
            createArray: (key, type, index) => e.setArray(key, type, index)
          }

          if (typeof cb === "function") cb.call(entityCreateFunctions)
          return _this.createEntity(db, e)
        }),
        renameEntity: (t, newType) => findEntity(t, model, e => {
          _this.logger.info(`> rename Entity ${t.yellow} into ${newType.green}`)
          return _this.renameEntity(db, e, newType)
        }),
        updateEntity: (t, cb) => findEntity(t, model, e => {
          _this.logger.info(`> update Entity ${t.green}:`)
          return _this.updateEntity(db, e, cb)
        }),
        deleteEntity: t => findEntity(t, model, e => {
          _this.logger.info(`> delete Entity ${t.red}:`)
          return _this.deleteEntity(db, e)
        }),
        //renameRelation: relation => _this.createRelation(db, relation),
        createRef: (t, key, type, ownership) => model.entity(t, e => {
          _this.logger.info(`> create Ref ${t.green}.${key.magenta} -> ${type.green}`)
          return _this.createRelation(db, e.hasOne(key, type, ownership))
        }),
        createList: (t, key, type, ownership) => model.entity(t, e => {
          _this.logger.info(`> create List ${t.green}.${key.magenta} -> ${type.green}`)
          return _this.createRelation(db, e.hasMany(key, type, ownership))
        }),
        updateRelation: relation => _this.createRelation(db, relation),
        deleteRelation: (t, key) => model.entity(t, e => {
          let relation = e.relation(key)
          _this.logger.info(`> delete Relation ${t.green}.${relation.key.red}`)
          return _this.deleteRelation(db, relation)
        })

      }

      // run migration scripts in sequence
      for (let migration of migrations) {
        this.logger.info(`applying patch ${migration.version} to ${key}`)
        // update the model
        await migration.handler.call(migrationFunctions)
        // save intermediate model
        model.version = migration.version
        await this.saveModel(database, model, "migration")
      }
      // compare the updated model with last version model      
      model.log(str => console.log("Updated model", str))
      this.model.log(str => console.log("Expected model", str))
      Assert.deepStrictEqual(model.JSONschema(), this.model.JSONschema())
      this.logger.info(`migration success :  ${key} is up-to-date`)
      return model
    }).catch(err => {
      this.logger.warn(`migration failed : ${err.message}, rolling back...`)
    })
  }
}