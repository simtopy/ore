# Sqlore

Sqlore is 

* [Getting Started](#gettingstarted).
* This site was built using [GitHub Pages](https://pages.github.com/).

## The Observable Relational Entities Model

### Concepts

A model is a set of entities and relations. The entities describes basic data structures, and relationships describes the hierarchy and links between entities.

### Types

Sqlore defines 

* Uuid
* Enum
* Boolean
* Date
* Time
* Datetime
* Timestamp
* Natural: a non-negative integer
* Integer: an integer
* BigInteger: a big integer, encoded as string
* Real : a real number
* String
* Text
* Email

### Entity

An entity is at least described by a set of metadata :

```yml
  type: "name" # type of the entity (String)
  id: "id" # the private identifier (Natural)
  uuid: "uid" # the public identifier (Uuid)
  createTs: "createdAt" # the creation timestamp (Timestamp)
  createTs: "createdAt" # the creation timestamp (Timestamp)
```

An entity can have several typed fields and arrays. Fields are described by a key and a type, arrays can additionally have an index (used for sorting).

### Relation

All relations are described by a source entity, a key (unique within the source entity scope) and One can distinguish three types of relations, wich are described slightly differently:

* References are 1:1 relationships

```yml
type: "ref"
```

* Forks are 1:1 polymorphic relationships
* Lists are 1:n relationships

## Getting started

### Installation

```bash
# install lasest version of sqlore
npm i sqlore

# also install one of the supported drivers
npm i mysql
```

### Creating a model

```js
const ore = require('sqlore')

// create a new model
const model = new ore.Model("blog")

  // create a "user" Entity
  model.entity("user", e => {
    e.setField("username", Ore.Types.String)
      .setField("email", Ore.Types.Email)
      .hasMany("favorites", "article", false)
      .hasMany("followers", "user", false)

  })
  // create an "article" Entity
  model.entity("article", e => {
    e.setField("title", Ore.Types.String)
      .setField("body", Ore.Types.Text)
      .setField("favoritesCount", Ore.Types.Natural, {
        default: 0
      })
      .setArray("tagList", Ore.Types.String)
      .hasOne("author", "user", false)
      .hasMany("comments", "comment")
  })
  // create a "comment" Entity
  model.entity("comment", e => {
    e.setField("body", Ore.Types.String)
      .setField("rating", Ore.Types.Real)
      .hasOne("author", "user", false)
      .hasOne("article", "article", false)
  })
```

### Using a model

