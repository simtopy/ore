module.exports = {
  toArray(o) {
    return Array.isArray(o) ? o : [o]
  },
  partition(array, test) {
    return array.reduce((r, e) => {
      if (test(e)) r[0].push(e)
      else r[1].push(e)
      return r
    }, [
      [],
      []
    ])
  }
}