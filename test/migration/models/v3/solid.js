module.exports = {
  type: "solid",
  fields: {
    name: "string",
  },
  hasOne: {
    ref: "reference"
  },
  refOne: {
    geometry: "mesh"
  },

}