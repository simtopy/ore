module.exports = {
  type: "scene",
  fields: {
    name: "string",
  },
  hasMany: {
    meshes: "mesh",
    shapes: "shape",
    solids: "solid"
  }
}