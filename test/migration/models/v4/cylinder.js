module.exports = {
  type: "cylinder",
  fields: {
    length: "decimal",
    radius: "decimal",
  },
  hasOne: {
    mesh: "mesh"
  },
}