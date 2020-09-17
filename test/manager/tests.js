const Assert = require("assert")
const Ore = require("../lib")

describe("Manager api", function () {

  const N = 50
  const key = "test_ore_store"
  const model = require("./model")
  const manager = Ore.createManager(model)

  before(function () {
    return manager.start()
  })

  after(function () {
    return manager.stop()
  })

  it("delete test_ore_store database", function () {
    return manager.deleteBase(key)
  })

  it("creates test_ore_store database", function () {
    return manager.createBase(key)
  })

  it("test creation", async function () {
    let uid = manager.uuid()
    let [root, refB] = await Promise.all([
      manager.api.root.create(key, {
        uid,
        name: "root (init)",
      }),
      manager.api.itemB.create(key, [{
        name: "B0"
      }, {
        name: "B1"
      }])
    ])
    Assert.strictEqual(root.uid, uid)
    this.root = root
    this.refB = refB
  })

  it("test update fields only", async function () {
    let name = "root (name updated)"
    this.root = await manager.api.root.update(key, {
      uid: this.root.uid,
      name,
    })
    Assert.strictEqual(this.root.name, name)
  })

  it("test update with reference creation", async function () {
    let uid = manager.uuid()
    this.root = await manager.api.root.update(key, {
      uid: this.root.uid,
      name: "root (hasA & refB set)",
      refB: this.refB[0].uid,
      hasA: {
        uid,
        name: "A0"
      }
    })
    Assert.strictEqual(this.root.hasA, uid)
    let [cntA, cntB] = await Promise.all([
      manager.api.itemA.count(key),
      manager.api.itemB.count(key)
    ])
    Assert.strictEqual(cntA, 1, "incorrect itemA count")
    Assert.strictEqual(cntB, 2, "incorrect itemB count")
  })

  it("test update with reference substitution", async function () {
    let uid = manager.uuid()
    this.root = await manager.api.root.update(key, {
      uid: this.root.uid,
      name: "root (hasA & refB replaced)",
      refB: this.refB[1].uid,
      hasA: {
        uid,
        name: "A1"
      }
    })
    Assert.strictEqual(this.root.hasA, uid)
    Assert.strictEqual(this.root.refB, this.refB[1].uid)
    let [cntA, cntB] = await Promise.all([
      manager.api.itemA.count(key),
      manager.api.itemB.count(key)
    ])
    Assert.strictEqual(cntA, 1, "incorrect itemA count")
    Assert.strictEqual(cntB, 2, "incorrect itemB count")
  })

  it("test update with reference destruction", async function () {
    this.root = await manager.api.root.update(key, {
      uid: this.root.uid,
      name: "root (hasA & refB removed)",
      refB: null,
      hasA: null
    })
    Assert.strictEqual(this.root.hasA, null)
    Assert.strictEqual(this.root.refB, null)
    let [cntA, cntB] = await Promise.all([
      manager.api.itemA.count(key),
      manager.api.itemB.count(key)
    ])
    Assert.strictEqual(cntA, 0, "incorrect itemA count")
    Assert.strictEqual(cntB, 2, "incorrect itemB count")
  })

  it("test update with fork creation", async function () {
    let uid = manager.uuid()
    this.root = await manager.api.root.update(key, {
      uid: this.root.uid,
      name: "root (hasAB & refAB set)",
      refABType: "itemB",
      refAB: this.refB[0].uid,
      hasABType: "itemA",
      hasAB: {
        uid,
        name: "A2"
      }
    })
    Assert.strictEqual(this.root.refABType, "itemB")
    Assert.strictEqual(this.root.refAB, this.refB[0].uid)
    Assert.strictEqual(this.root.hasABType, "itemA")
    Assert.strictEqual(this.root.hasAB, uid)
    let [cntA, cntB] = await Promise.all([
      manager.api.itemA.count(key),
      manager.api.itemB.count(key)
    ])
    Assert.strictEqual(cntA, 1, "incorrect itemA count")
    Assert.strictEqual(cntB, 2, "incorrect itemB count")
  })

  it("test update with fork substitution", async function () {
    let uid = manager.uuid()
    this.root = await manager.api.root.update(key, {
      uid: this.root.uid,
      name: "root (hasAB & refAB replaced)",
      refABType: "itemB",
      refAB: this.refB[1].uid,
      hasABType: "itemB",
      hasAB: {
        uid,
        name: "B2"
      }
    })
    Assert.strictEqual(this.root.refABType, "itemB")
    Assert.strictEqual(this.root.refAB, this.refB[1].uid)
    Assert.strictEqual(this.root.hasABType, "itemB")
    Assert.strictEqual(this.root.hasAB, uid)
    let [cntA, cntB] = await Promise.all([
      manager.api.itemA.count(key),
      manager.api.itemB.count(key)
    ])
    Assert.strictEqual(cntA, 0, "incorrect itemA count")
    Assert.strictEqual(cntB, 3, "incorrect itemB count")
  })

  it("test update with fork destruction", async function () {
    this.root = await manager.api.root.update(key, {
      uid: this.root.uid,
      name: "root (hasAB & refAB removed)",
      refAB: null,
      hasAB: null
    })
    Assert.strictEqual(this.root.hasAB, null)
    Assert.strictEqual(this.root.refAB, null)
    Assert.strictEqual(this.root.hasABType, null)
    Assert.strictEqual(this.root.refABType, null)
    let [cntA, cntB] = await Promise.all([
      manager.api.itemA.count(key),
      manager.api.itemB.count(key)
    ])
    Assert.strictEqual(cntA, 0, "incorrect itemA count")
    Assert.strictEqual(cntB, 2, "incorrect itemB count")
  })

  it("test update with list creation", async function () {
    let uid1 = manager.uuid()
    let uid2 = manager.uuid()
    this.root = await manager.api.root.update(key, {
      uid: this.root.uid,
      name: "root (hasAs & refBs set)",
      refBs: [this.refB[0].uid],
      hasAs: [{
        uid: uid1,
        name: "A3"
      }, {
        uid: uid2,
        name: "A4"
      }]
    })
    Assert.deepStrictEqual(this.root.hasAs, [uid1, uid2])
    Assert.deepStrictEqual(this.root.refBs, [this.refB[0].uid])
    let [cntA, cntB] = await Promise.all([
      manager.api.itemA.count(key),
      manager.api.itemB.count(key)
    ])
    Assert.strictEqual(cntA, 2, "incorrect itemA count")
    Assert.strictEqual(cntB, 2, "incorrect itemB count")
  })

  it("test update with list substitution", async function () {
    let uid1 = this.root.hasAs[0]
    let uid2 = manager.uuid()
    this.root = await manager.api.root.update(key, {
      uid: this.root.uid,
      name: "root (hasAB & refAB replaced)",
      refBs: [this.refB[1].uid, this.refB[0].uid],
      hasAs: [uid1, {
        uid: uid2,
        name: "A5"
      }]
    })
    Assert.strictEqual(this.root.hasAs.length, 2)
    Assert.strictEqual(this.root.refBs.length, 2)
    Assert(this.root.hasAs.includes(uid1))
    Assert(this.root.hasAs.includes(uid2))
    Assert(this.root.refBs.includes(this.refB[0].uid))
    Assert(this.root.refBs.includes(this.refB[1].uid))
    let [cntA, cntB] = await Promise.all([
      manager.api.itemA.count(key),
      manager.api.itemB.count(key)
    ])
    Assert.strictEqual(cntA, 2, "incorrect itemA count")
    Assert.strictEqual(cntB, 2, "incorrect itemB count")
  })

  it("test update with list destruction", async function () {
    this.root = await manager.api.root.update(key, {
      uid: this.root.uid,
      name: "root (hasAB & refAB removed)",
      refBs: [],
      hasAs: []
    })
    Assert.strictEqual(this.root.hasAs.length, 0)
    Assert.strictEqual(this.root.refBs.length, 0)
    let [cntA, cntB] = await Promise.all([
      manager.api.itemA.count(key),
      manager.api.itemB.count(key)
    ])
    Assert.strictEqual(cntA, 0, "incorrect itemA count")
    Assert.strictEqual(cntB, 2, "incorrect itemB count")
  })

  it("test destruction", async function () {
    await manager.api.root.delete(key, this.root.uid)
    await manager.api.itemB.delete(key, this.refB.map(e => e.uid))
    let [cntR, cntA, cntB] = await Promise.all([
      manager.api.root.count(key),
      manager.api.itemA.count(key),
      manager.api.itemB.count(key)
    ])
    Assert.strictEqual(cntR, 0, "incorrect itemR count")
    Assert.strictEqual(cntA, 0, "incorrect itemA count")
    Assert.strictEqual(cntB, 0, "incorrect itemB count")
  })

  it("test deep creation", async function () {
    this.root = await manager.api.root.create(key, {
      name: "(lvl1)",
      hasA: {},
      hasAs: [{}, {}],
      hasAB: {},
      hasABType: "itemB",
      root: {
        name: "(lvl 2)",
        hasA: {},
        hasAs: [{}, {}],
        hasAB: {},
        hasABType: "itemB",
        root: {
          name: "(lvl3)",
          hasA: {},
          hasAs: [{}, {}],
          hasAB: {},
          hasABType: "itemB",
        }
      }
    })
    let [cntR, cntA, cntB] = await Promise.all([
      manager.api.root.count(key),
      manager.api.itemA.count(key),
      manager.api.itemB.count(key)
    ])
    Assert.strictEqual(cntR, 3, "incorrect itemR count")
    Assert.strictEqual(cntA, 9, "incorrect itemA count")
    Assert.strictEqual(cntB, 3, "incorrect itemB count")
  })

  it("test deep destruction", async function () {
    this.root = await manager.api.root.delete(key, this.root.uid)
    let [cntR, cntA, cntB] = await Promise.all([
      manager.api.root.count(key),
      manager.api.itemA.count(key),
      manager.api.itemB.count(key)
    ])
    Assert.strictEqual(cntR, 0, "incorrect itemR count")
    Assert.strictEqual(cntA, 0, "incorrect itemA count")
    Assert.strictEqual(cntB, 0, "incorrect itemB count")
  })

  it("test batch create", async function () {
    let index = Array(N).fill().map((e, i) => i)
    this.roots = await manager.api.root.create(key, index.map(n => ({
      name: `root ${n}`,
      hasA: {
        name: `A (root ${n})`
      },
      hasABType: "itemB",
      hasAB: {
        name: `hasAB (root ${n})`
      },
      hasAs: index.map(i => ({
        name: `A (root ${n}, ${i})`
      }))
    })))
    let [cntR, cntA, cntB] = await Promise.all([
      manager.api.root.count(key),
      manager.api.itemA.count(key),
      manager.api.itemB.count(key)
    ])
    Assert.strictEqual(cntR, N, "incorrect itemR count")
    Assert.strictEqual(cntA, N * (N + 1), "incorrect itemA count")
    Assert.strictEqual(cntB, N, "incorrect itemB count")
  })

  it("test batch update", async function () {
    let update = this.roots.map((root, n) => ({
      ...root,
      name: `root ${n} (updated)`,
      hasA: {
        name: `A (root ${n}) (replaced)`
      },
      hasAs: [...root.hasAs, {
        name: `A (root ${n}, ${root.hasAs.length})`
      }]
    }))

    this.roots = await manager.api.root.update(key, update)
    let [cntR, cntA, cntB] = await Promise.all([
      manager.api.root.count(key),
      manager.api.itemA.count(key),
      manager.api.itemB.count(key)
    ])
    Assert.strictEqual(cntR, N, "incorrect itemR count")
    Assert.strictEqual(cntA, N * (N + 2), "incorrect itemA count")
    Assert.strictEqual(cntB, N, "incorrect itemB count")
  })

  it("test batch delete", async function () {
    this.roots = await manager.api.root.delete(key, this.roots.map(r => r.uid))
    let [cntR, cntA, cntB] = await Promise.all([
      manager.api.root.count(key),
      manager.api.itemA.count(key),
      manager.api.itemB.count(key)
    ])
    Assert.strictEqual(cntR, 0, "incorrect itemR count")
    Assert.strictEqual(cntA, 0, "incorrect itemA count")
    Assert.strictEqual(cntB, 0, "incorrect itemB count")
  })
})