module.exports = {
  type: "group",
  hasMany: {
    users: "user",
    projects: "project"
  },
}