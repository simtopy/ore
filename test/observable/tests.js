return

const Assert = require("assert")
const Ore = require("../lib")
let base = "test_ore_observable"
let model = require("./model")

describe("Observables", function () {

  before(function () {
    this.broker = new ServiceBroker({
      validator: new Ore.validator(model)
    })

    this.store = this.broker.createService({
      name: "store",
      mixins: [Ore.probe(model), Ore.store(model)],
      settings: {
        debug: true,
      }
    })
    return this.broker.start()
  })

  it("delete test_ore_observable database", async function () {
    return this.broker.call("store.deleteBase", {
      key: base
    })
  })

  it("creates test_ore_observable database", async function () {
    return this.broker.call("store.createBase", {
      key: base
    })
  })

  it("creates the library", async function () {
    this.library = this.broker.call("store.library.create", {
      items: [{
        size: 10
      }, {
        size: 20
      }, {
        size: 30
      }]
    }, opts)
  })

  it("creates an observable set for test_ore_observable", async function () {
    this.store.createObservableSet(base)
    let obs = new Observable("project")
      .watch("project", )
      .subscribe()
  })

  after(function (done) {
    setTimeout(() => {
      this.broker.stop().then(() => done())
    }, 1000)
  })
})