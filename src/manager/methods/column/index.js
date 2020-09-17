module.exports = {
  renameField(table, field, key) {
    table.renameColumn(field.key, key)
  },
  createField(table, field) {
    let {
      key,
      type,
      ...opts
    } = field
    switch (type.key) {
      case "uuid":
        table.uuid(key).nullable().defaultTo(null)
        break
      case "timestamp":
        table.bigInteger(key).nullable().defaultTo(null)
        break
      case "date":
        table.date(key).nullable().defaultTo(null)
        break
      case "time":
        table.time(key).nullable().defaultTo(null)
        break
      case "datetime":
        table.datetime(key).nullable().defaultTo(null)
        break
      case "boolean":
        table.boolean(key).nullable().defaultTo(opts.default || true)
        break
      case "enum":
        table.enu(key, type.values).nullable()
        break
      case "natural":
        table.integer(key).unsigned().nullable().defaultTo(opts.default || null)
        break
      case "integer":
        table.integer(key).nullable().defaultTo(opts.default || null)
        break
      case "bigint":
        table.bigInteger(key).nullable().defaultTo(opts.default || null)
        break
      case "real":
        table.real(key, type.precision, type.scale).nullable().defaultTo(opts.default || null)
        break
      case "email":
        table.string(key, type.length).nullable().defaultTo(opts.default || null)
        break
      case "string":
        table.string(key, opts.length).nullable().defaultTo(opts.default || null)
        break
      case "text":
        table.text(key, "mediumtext").nullable().defaultTo(opts.default || null)
        break
      case "json":
        table.json(key).nullable()
        break
      case "blob":
        table.text(key, opts.textType).nullable()
        break
      default:
        throw Error(`column ${type.key} is not supported`, field)
    }
  },
  deleteFields(table, fields) {
    table.dropColumns(...fields.map(f => f.key))
  },
  createArray(db, entity, array) {
    return this.createTable(db, array.table, table => {
      // primary key
      table.increments("id")
      // parent foreign field
      table.integer(entity.typeId).unsigned().nullable().defaultTo(null)
      table.foreign(entity.typeId).references(entity.id).inTable(entity.type)
      // index
      if (array.index) table.integer(array.index).unsigned().defaultTo(0)
      // data
      this.createField(table, array)
    })
  },
}