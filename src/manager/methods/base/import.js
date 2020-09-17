module.exports = async function(key, dumpfile) {
  await this.deleteBase(key)
  await this.server.raw(`CREATE DATABASE IF NOT EXISTS ${key}`)
  return new Promise((resolve, reject) => {
    this.logger.info(`restoring ${key}...`)
    let con = this.server.context.client.driver.createConnection({
      ...this.options.connection,
      database: key,
      multipleStatements: true
    })
    con.query(dumpfile.toString(), err => {
      if (err) {
        con.end()
        reject(err)
      } else {
        this.logger.info(`${key} restored succesfully`)
        con.end()
        resolve()
      }
    })
  })
}