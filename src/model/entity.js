const uuid = require("uuid").v4
const Types = require("../types")
const Field = require("./field")
const FieldArray = require("./array")
const camelCase = require("camelcase")

module.exports = class Entity {
  constructor(type, publicId = "uid", privateId = "id") {
    this.uid = uuid()
    this.model = null
    this.type = type
    this.publicId = publicId
    this.privateId = privateId
    this.createTs = "createdAt"
    this.updateTs = "updatedAt"
    this.fields = []
    this.arrays = []
    this.relations = []
    this.setTypeId()
  }

  /*
    getter & setters
  */

  set name(name) {
    this.type = name
    this.setTypeId()
  }

  set id(id) {
    this.privateId = id
    this.setTypeId()
  }

  get id() {
    return this.privateId
  }

  set uuid(key) {
    this.publicId = key
  }

  get uuid() {
    return this.publicId
  }

  get refs() {
    return this.relations.filter(r => r.type === "ref")
  }

  get forks() {
    return this.relations.filter(r => r.type === "fork")
  }

  get lists() {
    return this.relations.filter(r => r.type === "list")
  }

  /*
    methods
  */

  setTypeId() {
    this.typeId = camelCase([this.type, this.privateId])
  }

  key(namespace, uuid) {
    return `${namespace}#${this.type}#${uuid}`
  }

  keys(namespace, uuids) {
    return uuids.map(uuid => `${namespace}#${this.type}#${uuid}`)
  }

  field(key, callback) {
    let field = this.fields.find(e => e.key === key)
    if (!field) {
      field = new Field(this, key, null)
      this.fields.push(field)
    }
    if (typeof callback === "function") {
      callback(field)
      return this
    } else return field
  }

  array(key, callback) {
    let array = this.arrays.find(e => e.key === key)
    if (!array) {
      array = new FieldArray(this, key, null, null)
      this.arrays.push(array)
    }
    if (typeof callback === "function") {
      callback(array)
      return this
    } else return array
  }

  setField(key, type, options = {}) {
    // Ore Type from shorthand
    if (typeof type === "string") type = Object.values(Types).find(t => t.key === type)
    if (!type) throw Error(`"${this.type}" field "${key}" has unknown type "${type}"`)
    // set the field
    return this.field(key, field => {
      field.type = type
    })
  }

  setArray(key, type, index = null, options = {}) {
    // Ore Type from shorthand
    if (typeof type === "string") type = Object.values(Types).find(t => t.key === type)
    if (!type) throw Error(`"${this.type}" field "${key}" has unknown type "${type}"`)
    return this.array(key, array => {
      array.type = type
      array.index = index
    })
  }

  relation(key, callback) {
    let relation = this.relations.find(r => r.key === key)
    if (!relation) {
      relation = this.model.relation(this, key)
      this.relations.push(relation)
    }
    if (typeof callback === "function") {
      callback(relation)
      return this
    } else return relation
  }

  hasOne(key, type, ownership = true, nullable = true) {
    return this.relation(key, relation => {
      // set target
      relation.target = this.model.entity(type)
      // set options
      Object.assign(relation, {
        type: "ref",
        ownership,
        nullable
      })
    })
  }

  hasOneOf(key, $key, types, ownership = true, nullable = true) {
    return this.relation(key, relation => {
      // set target & typeKey
      relation.$key = $key
      relation.target = types.map(type => this.model.entity(type))
      // set options
      Object.assign(relation, {
        type: "fork",
        ownership,
        nullable
      })
    })
  }

  hasMany(key, type, ownership = true) {
    return this.relation(key, relation => {
      // set target
      relation.target = this.model.entity(type)
      // set options
      Object.assign(relation, {
        type: "list",
        ownership,
      })
    })
  }

  fromSchema(schema) {
    // load metadata
    if ("id" in schema) this.id = schema.id
    if ("uuid" in schema) this.uuid = schema.uuid
    if ("createdAt" in schema) this.createTs = schema.createdAt
    if ("updatedAt" in schema) this.updateTs = schema.updatedAt
    // load fields
    if ("fields" in schema) Object.entries(schema.fields).forEach(([key, opts]) => {
      // options from shorthand
      if (typeof opts === "string") opts = {
        type: opts
      }
      // create field
      let {
        type,
        ...options
      } = opts
      this.setField(key, type, options)
    })
    // load arrays
    if ("arrays" in schema) Object.entries(schema.arrays).forEach(([key, opts]) => {
      // options from shorthand
      if (typeof opts === "string") opts = {
        type: opts,
        index: null
      }
      let {
        type,
        index,
        ...options
      } = opts
      // create array
      this.setArray(key, type, index, options)
    })
    /*
      load references
    */
    if ("refOne" in schema) Object.entries(schema.refOne).forEach(([key, opts]) => {
      // options from shorthand
      if (typeof opts === "string") opts = {
        type: opts,
        nullable: true
      }
      // create reference
      this.hasOne(key, opts.type, false, opts.nullable)
    })
    if ("hasOne" in schema) Object.entries(schema.hasOne).forEach(([key, opts]) => {
      // options from shorthand
      if (typeof opts === "string") opts = {
        type: opts,
        nullable: true
      }
      // create reference
      this.hasOne(key, opts.type, true, opts.nullable)
    })
    /*
      load forks
    */
    if ("refOneOf" in schema) Object.entries(schema.refOneOf).forEach(([key, opts]) => {
      // options from shorthand
      if (Array.isArray(opts)) opts = {
        typeKey: `${key}Type`,
        targets: opts,
        nullable: true,
      }
      // create fork
      this.hasOneOf(key, opts.typeKey, opts.targets, false, opts.nullable)
    })
    if ("hasOneOf" in schema) Object.entries(schema.hasOneOf).forEach(([key, opts]) => {
      // options from shorthand
      if (Array.isArray(opts)) opts = {
        typeKey: `${key}Type`,
        targets: opts,
        nullable: true,
      }
      // create fork
      this.hasOneOf(key, opts.typeKey, opts.targets, true, opts.nullable)
    })
    /*
      load lists
    */
    if ("refMany" in schema) Object.entries(schema.refMany).forEach(([key, opts]) => {
      // options from shorthand
      if (typeof opts === "string") opts = {
        type: opts,
      }
      // create reference
      this.hasMany(key, opts.type, false)
    })
    if ("hasMany" in schema) Object.entries(schema.hasMany).forEach(([key, opts]) => {
      // options from shorthand
      if (typeof opts === "string") opts = {
        type: opts,
        nullable: true
      }
      // create reference
      this.hasMany(key, opts.type, true)
    })
  }
}