const Path = require("path")
const mysqldump = require("mysqldump")

module.exports = function(key) {
  if (!["mysql"].includes(this.options.client)) {
    throw Error(`unsupported client ${this.options.client}`)
  } else {
    let dumpToFile = Path.join(this.options.dumpdir || ".", [key, "dump", "sql"].join('.'))
    this.logger.info(`dumping ${key} in ${dumpToFile}`)
    mysqldump({
      dumpToFile,
      connection: {
        database: key,
        ...this.options.connection
      },
    })
    this.logger.info(`${key} dumped succesfully`)
    return dumpToFile
  }
}