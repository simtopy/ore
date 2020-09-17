module.exports = {
  type: "comment",
  fields: {
    body: "string",
    rating: "real"
  },
  refOne: {
    author: "user",
    article: "article"
  }
}