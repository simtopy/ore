module.exports = function(db, table, ...whereArgs) {
  let query = db(table).count(["*"])
  if (whereArgs.length) query.where(...whereArgs)
  return query.then(res => res[0]["count(*)"])
}