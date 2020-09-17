module.exports = {
  type: "project",
  arrays: {
    files: "uuid"
  },
  hasOne: {
    scene: "scene"
  },
  hasMany: {
    settings: "settings"
  },
  refMany: {
    users: "user"
  }
}