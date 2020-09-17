module.exports = {
  /*
    Create / connect to manager database
  */
  connect(retryDelay = 100, timeoutDelay = 1000) {
    return new Promise((resolve, reject) => {
      let con = this.use()
      let timeout = setTimeout(reject, timeoutDelay)
      let retry = setInterval(() => {
        con.raw(`SELECT @@VERSION`).then(res => {
          let version = res[0][0]["@@VERSION"]
          this.logger.info(`Connected to ${version}`)
          clearTimeout(timeout)
          clearInterval(retry)
          resolve(con)
        }).catch(err => {
          //if (err.code === )
          this.logger.info(err)
          this.logger.debug(`Could not connect to ${this.options.connection.host}:`, err.message)
        })
      }, retryDelay)
    })
  }
}