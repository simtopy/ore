module.exports = {
  type: "user",
  fields: {
    username: "string",
    email: "email"
  },
  refMany: {
    favorites: "article",
    followers: "user"
  },
}