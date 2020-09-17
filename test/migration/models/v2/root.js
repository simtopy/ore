module.exports = {
  type: "root",
  fields: {
    name: "string"
  },
  arrays: {
    files: "uuid"
  },
  hasOne: {
    scene: "scene",
  }
}