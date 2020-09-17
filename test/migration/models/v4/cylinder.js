module.exports = {
  type: "cylinder",
  fields: {
    length: "real",
    radius: "real",
  },
  hasOne: {
    mesh: "mesh"
  },
}