module.exports = {
  Uuid: {
    key: "uuid",
    schema: {
      type: "string",
      format: "uuid"
    }
  },
  Timestamp: {
    key: "timestamp",
    schema: {
      type: "integer",
    }
  },
  Date: {
    key: "date",
    schema: {
      type: "string",
      format: "date"
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
    }
  },
  Natural: {
    key: "natural",
    schema: {
      type: "integer",
      minimum: 0,
      maximum: Number.MAX_SAFE_INTEGER
    }
  },
  Integer: {
    key: "integer",
    schema: {
      type: "integer",
      minimum: Number.MIN_SAFE_INTEGER,
      maximum: Number.MAX_SAFE_INTEGER
    }
  },
  BigInteger: {
    key: "bigint",
    schema: {
      type: "string"
    }
  },
  Real: {
    key: "real",
    schema: {
      type: "number"
    }
  },
  String: {
    key: "string",
    schema: {
      type: "string"
    }
  },
  Text: {
    key: "text",
    schema: {
      type: "string"
    }
  },
  Email: {
    key: "email",
    schema: {
      type: "string",
      format: "email"
    },
    // options
    length: 254
  }
}