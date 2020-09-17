module.exports = {
  type: "article",
  fields: {
    title: "string",
    body: "text",
    favoritesCount: {
      type: "natural",
      default: 0
    }
  },
  arrays: {
    tagList: "string"
  },
  refOne: {
    author: "user"
  },
  hasMany: {
    comments: "comment"
  }
}