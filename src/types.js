module.exports = {
  Uuid: {
    key: "uuid",
    schema: {
      type: "string",
      format: "uuid"
    },
    sql: {
      mysql: "char(36)"
    }
  },
  Timestamp: {
    key: "timestamp",
    schema: {
      type: "integer",
    },
    sql: {
      mysql: "bigint(20)"
    }
  },
  Date: {
    key: "date",
    schema: {
      type: "string",
      format: "date"
    },
    sql: {
      mysql: null
    }
  },
  Time: {
    key: "time",
    schema: {
      type: "string"
    },
    sql: {
      mysql: null
    }
  },
  DateTime: {
    key: "datetime",
    schema: {
      type: "string",
      format: "datetime"
    },
    sql: {
      mysql: null
    }
  },
  Enum(...values) {
    return {
      key: "enum",
      schema: {
        "enum": values
      },
      values,
    }
  },
  Boolean: {
    key: "boolean",
    schema: {
      type: "boolean",
    },
    sql: {
      mysql: null
    }
  },
  Natural: {
    key: "natural",
    schema: {
      type: "integer",
      minimum: 0,
      maximum: Number.MAX_SAFE_INTEGER
    },
    sql: {
      mysql: "int(10) unsigned"
    }
  },
  Integer: {
    key: "integer",
    schema: {
      type: "integer",
      minimum: Number.MIN_SAFE_INTEGER,
      maximum: Number.MAX_SAFE_INTEGER
    },
    sql: {
      mysql: "int(10)"
    }
  },
  BigInteger: {
    key: "bigint",
    schema: {
      type: "string"
    },
    sql: {
      mysql: null
    }
  },
  Real: {
    key: "decimal",
    schema: {
      type: "number"
    },
    sql: {
      mysql: "decimal(8,2)"
    }
  },
  String: {
    key: "string",
    schema: {
      type: "string"
    },
    sql: {
      mysql: "varchar(255)"
    }
  },
  Text: {
    key: "text",
    schema: {
      type: "string"
    },
    sql: {
      mysql: "mediumtext"
    }
  },
  Email: {
    key: "email",
    schema: {
      type: "string",
      format: "email"
    },
    sql: {
      mysql: "varchar(254)"
    },
    // options
    length: 254
  }
}