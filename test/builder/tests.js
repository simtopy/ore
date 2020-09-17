const Assert = require("assert")
const Ore = require("../lib")

const Ajv = require("ajv")

describe("Model Builder", function () {

  it("constructs a model", function () {
    this.blog_v1 = new Ore.Model("blog")
      .entity("user", e => {
        e.setField("username", Ore.Types.String)
          .setField("email", Ore.Types.Email)
          .hasMany("favorites", "article", false)
          .hasMany("followers", "user", false)
      })
      .entity("article", e => {
        e.setField("title", Ore.Types.String)
          .setField("body", Ore.Types.Text)
          .setField("favoritesCount", Ore.Types.Natural, {
            default: 0
          })
          .setArray("tagList", Ore.Types.String)
          .hasOne("author", "user", false)
          .hasMany("comments", "comment")
      })
      .entity("comment", e => {
        e.setField("body", Ore.Types.String)
          .setField("rating", Ore.Types.Real)
          .hasOne("author", "user", false)
          .hasOne("article", "article", false)
      })
    Assert.deepStrictEqual(this.blog_v1.entities.map(e => e.type), [
      "user", "article", "comment"
    ])
    Assert.deepStrictEqual(this.blog_v1.relations.map(e => e.table), [
      "user_favorites", "user_followers", "article_author",
      "article_comments", "comment_author", "comment_article"
    ])
  })

  it("loads a model", function () {
    this.blog_v2 = new Ore.Model("blog").fromFiles(__dirname, "entities")
    Assert.deepStrictEqual(this.blog_v1.entities.map(e => e.type), [
      "user", "article", "comment"
    ])
    Assert.deepStrictEqual(this.blog_v1.relations.map(e => e.table), [
      "user_favorites", "user_followers", "article_author",
      "article_comments", "comment_author", "comment_article"
    ])
  })

  it("compile JSON schemas", function () {
    let ajv = new Ajv()
    ajv.compile(this.blog_v1.JSONschema())
    ajv.compile(this.blog_v2.JSONschema())
  })

  it("creates and starts a manager", function () {
    this.manager = Ore.createManager(this.blog_v1)
    return this.manager.start()
  })

  it("generates database", async function () {
    let key = "test_ore_builder"
    await this.manager.deleteBase(key)
    return this.manager.createBase(key)
  })

  it("stops a manager", function () {
    return this.manager.stop()
  })
})