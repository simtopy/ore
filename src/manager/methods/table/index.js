module.exports = {
  ...require("./entity"),
  ...require("./relation"),
  createTable(db, key, callback) {
    return db.schema.createTable(key, callback)
  },
  renameTable(db, key, newKey) {
    console.log(` - rename table ${key.grey} into ${newKey.blue}`)
    return db.schema.renameTable(key, newKey)
  },
  updateTable(db, key, callback) {
    return db.schema.table(key, callback)
  },
  deleteTable(db, key) {
    return db.schema.dropTable(key).then(() => console.log(` - drop table ${key.red}`))
  }
}