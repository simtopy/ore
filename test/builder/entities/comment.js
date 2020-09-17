module.exports = {
  type: "comment",
  fields: {
    body: "string",
    rating: "decimal"
  },
  refOne: {
    author: "user",
    article: "article"
  }
}