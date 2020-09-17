const knex = require("knex")

module.exports = {
  /*
    Finds / create a connection to a database
  */
  use(key = null) {
    if (key in this.connections) return this.connections[key]
    else {
      let con = knex({
        debug: this.options.debug,
        client: this.options.client,
        connection: {
          database: key,
          user: this.options.connection.user,
          host: this.options.connection.host,
          password: this.options.connection.password,
        },
        log: {
          debug: m => console.log(m)
          //debug: m => this.toArray(m).forEach(m => this.logger.info(m.sql, m.bindings))
        }
      })
      if (key) this.connections[key] = con
      return con
    }
  },
  /*
  use(key) {
    let db = this.bases[key]
    if (!db) {
      db = this.bases[key] = knex({
        debug: this.settings.debug,
        client: this.settings.client,
        connection: {
          user: this.settings.connection.user,
          host: this.settings.connection.host,
          password: this.settings.connection.password,
          database: key
        },
        log: {
          debug: m => this.toArray(m).forEach(m => this.logger.info(m.sql, m.bindings))
        }
      })
      db.context.base = key
    }
    return db
  },
  */
  listBases() {
    return this.server.raw("SHOW DATABASES").then(res => {
      return res[0].map(r => r.Database).filter(key => ![
        "mysql", "information_schema", "performance_schema"
      ].includes(key))
    })
  },
  /*
    select all records of database version
    return in antecchronological order
  */
  /*
   async versions(key) {
     let db = await this.use(key)
     return db("mModel").select().then(res => res.map(r => ({
       uid: r.uid,
       date: r.createdAt,
       event: r.event,
       version: r.version,
     })).sort((e1, e2) => e2.date - e1.date))
   },
   */
  selectBase: require("./select"),
  exportBase: require("./export"),
  importBase: require("./import"),
  createBase: require("./create"),
  updateBase: require("./update"),
  deleteBase: require("./delete"),
  /*
  connectToServer() {
    return new Promise((resolve, reject) => {
      let retry = setInterval(() => {
        let db = knex({
          debug: this.settings.debug,
          client: this.settings.client,
          connection: {
            user: this.settings.connection.user,
            host: this.settings.connection.host,
            password: this.settings.connection.password,
          }
        })
        db.raw(`SELECT @@VERSION`).then(res => {
          let version = res[0][0]["@@VERSION"]
          this.logger.info(`Connected to ${version}`)
          clearInterval(retry)
          resolve(db)
        }).catch(err => {
          this.logger.debug(`Could not connect to ${this.settings.connection.host}:`, err.message)
        })
      }, this.settings.retryDelay)
    })
  },
  disconnectFromServer() {
    return Promise.all([this.server, ...Object.values(this.bases)].map(con => {
      return new Promise(resolve => {
        try {
          con.destroy(resolve)
        } catch (err) {
          if (err) this.logger.error(err)
          resolve()
        }
      })
    }))
  }*/
}