require("colors")
const Fs = require("fs")
const Path = require("path")
const Types = require("../types")
const Entity = require("./entity")
const Relation = require("./relation")

module.exports = class Model {

  /* beautify preserve:start */
  #version
  /* beautify preserve:end */

  constructor(name, version) {
    this.name = name || "model"
    this.#version = version || "0.0.0"
    this.entities = []
    this.relations = []
    this.migrations = []
  }

  /*
    returns > 0 if "a" version is higher
    returns < 0 if "b" version is higher
    returns 0 if versions are the same
  */
  static compareVersions(a, b) {
    a = a.split('.')
    b = b.split('.')
    // major
    let major = a[0] - b[0]
    if (major) return major
    // minor
    let minor = a[1] - b[1]
    if (minor) return minor
    // patch
    let patch = a[2] - b[2]
    if (patch) return patch
    // same version
    return 0
  }

  log(logger = console.log) {
    logger([
      `name: ${this.name.yellow}`,
      `(${String(this.relations.length).yellow}) relations, (${String(this.entities.length).yellow}) entities:`,
      ...this.entities.map(e => [
        `- ${e.type.green}:`,
        ...e.fields.map(f => `  - ${f.type.key.padEnd(8).grey} ${f.key.blue}`),
        ...e.arrays.map(a => `  - ${a.type.key.padEnd(8).grey} ${a.key.blue} [${a.index ? "sorted".grey : "unsorted".grey}]`),
        ...e.relations.map(r => `  - ${`${r.type}${r.ownership ? '' : '*' }`.padEnd(8).grey} ${r.key.magenta} -> ${r.targets.map(t => t.type.green).join(", ")}`)
      ].join('\n')),
    ].join('\n'))
    return this
  }

  get version() {
    if (!this.migrations.length) return this.#version
    else return this.migrations[this.migrations.length - 1].version
  }

  set version(v) {
    this.#version = v
  }

  entity(type, callback) {
    let entity = this.entities.find(e => e.type === type)
    if (!entity) {
      entity = new Entity(type)
      entity.model = this
      this.entities.push(entity)
    }
    if (typeof callback === "function") {
      callback(entity)
      return this
    } else return entity
  }

  relation(entity, key, callback) {
    let relation = this.relations.find(r => r.entity === entity && r.key === key)
    if (!relation) {
      relation = new Relation(null, entity, key)
      this.relations.push(relation)
    }
    if (typeof callback === "function") {
      callback(relation)
      return this
    } else return relation
  }

  migration(version, handler) {
    this.migrations = [...this.migrations, {
      version: version,
      handler: handler
    }].sort((m1, m2) => Model.compareVersions(m1.version, m2.version))
    return this
  }

  migrateFrom(version) {
    return this.migrations.filter(m => Model.compareVersions(version, m.version) < 0)
  }

  fromFiles(...dirpath) {
    let path = Path.resolve(...dirpath)
    let files = Fs.readdirSync(path).map(file => Path.resolve(path, file))
    files.forEach(path => {
      let schema = require(path)
      if (!"type" in schema) throw Error(`missing key "type" in schema ${path}`)
      let entity = this.entity(schema.type)
      entity.fromSchema(schema)
    })
    return this
  }

  JSONschema() {
    return {
      "$id": this.name,
      "definitions": this.entities.reduce((obj, entity) => {
        obj[entity.type] = {
          "type": "object",
          "properties": {
            [entity.id]: Types.Natural.schema,
            [entity.uuid]: Types.Uuid.schema,
            [entity.createTs]: Types.Timestamp.schema,
            [entity.updateTs]: Types.Timestamp.schema,
            ...entity.fields.reduce((obj, field) => {
              obj[field.key] = {
                anyOf: [{
                  type: "null"
                }, field.type.schema]
              }
              return obj
            }, {}),
            ...entity.refs.reduce((obj, r) => {
              let anyOf = [Types.Uuid.schema]
              if (r.nullable) anyOf.push({
                type: "null"
              })
              if (r.ownership) anyOf.push({
                "$ref": `#/definitions/${r.target.type}`
              })
              obj[r.key] = {
                anyOf
              }
              return obj
            }, {}),
            ...entity.forks.reduce((obj, r) => {
              // type key
              let enums = r.targets.map(t => t.type)
              if (r.nullable) enums.push(null)
              obj[r.$key] = {
                "enum": enums
              }
              // key
              let anyOf = [Types.Uuid.schema]
              if (r.nullable) anyOf.push({
                type: "null"
              })
              if (r.ownership) anyOf.push(...r.targets.map(t => ({
                "$ref": `#/definitions/${t.type}`
              })))
              obj[r.key] = {
                anyOf
              }
              return obj
            }, {}),
            ...entity.lists.reduce((obj, r) => {
              let anyOf = [Types.Uuid.schema]
              if (r.ownership) anyOf.push({
                "$ref": `#/definitions/${r.target.type}`
              })
              obj[r.key] = {
                type: "array",
                items: {
                  anyOf
                }
              }
              return obj
            }, {})

          },
          "additionalProperties": false
        }
        return obj
      }, {})
    }
  }

  static Ore() {
    let m = new Model("ore")

    m.entity("database", e => {
      e.setField("key", Types.String)
        .hasMany("versions", "model")
    })

    m.entity("model", e =>
      e.setField("name", Types.String)
      .setField("version", Types.String)
      .setField("event", Types.Enum("creation", "migration", "import", "export"))
      .hasMany("entities", "entity")
      .hasMany("relations", "relation")
    )

    m.entity("relation", e =>
      e.setField("type", Types.Enum("ref", "list", "fork"))
      .setField("key", Types.String)
      .setField("table", Types.String)
      .setField("nullable", Types.Boolean)
      .setField("ownership", Types.Boolean)
      .hasOne("source", "entity", false, false)
      .hasMany("targets", "entity", false, false)
    )

    m.entity("entity", e =>
      e.setField("type", Types.String)
      .setField("privateId", Types.String)
      .setField("publicId", Types.String)
      .setField("createTs", Types.String)
      .setField("updateTs", Types.String)
      .hasMany("fields", "field", true)
      .hasMany("arrays", "array", true)
    )

    m.entity("field", e =>
      e.setField("key", Types.String)
      .setField("type", Types.String)
    )

    m.entity("array", e =>
      e.setField("key", Types.String)
      .setField("type", Types.String)
      .setField("index", Types.String)
      .setField("table", Types.String)
    )

    return m
  }
}