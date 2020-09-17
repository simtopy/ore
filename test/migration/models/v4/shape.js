module.exports = {
  type: "shape",
  fields: {
    name: "string",
  },
  hasOneOf: {
    surface: ["sphere", "cube", "cylinder"]
  }
}