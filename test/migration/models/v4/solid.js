module.exports = {
  type: "solid",
  fields: {
    name: "string",
    isVisible: {
      type: "boolean",
      default: true
    }
  },
  hasOne: {
    ref: "reference"
  },
  refOneOf: {
    geometry: ["shape", "mesh"]
  },
}