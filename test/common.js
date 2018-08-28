'use strict'

const { inspect } = require('util')

function replaceSymbols (obj) {
  let entries = []
    .concat(
      Object.getOwnPropertySymbols(obj),
      Object.getOwnPropertyNames(obj)
    )
    .map((key) => ({
      key: key.toString(),
      value: obj[key] === undefined ? '__undefined' : obj[key]
    }))

  if (Array.isArray(obj)) {
    // add deleted entries (as set to undefined)
    for (let i = 0; i < obj.length; i++) {
      if (i in obj) continue
      entries.push({
        key: String(i),
        value: '__undefined'
      })
    }
  }

  entries.sort((a, b) => b.key > a.key ? 1 : -1)

  let res = Array.isArray(obj) ? [] : {}
  for (let { key, value } of entries) {
    if (value != null && typeof value === 'object') {
      value = replaceSymbols(value)
    }
    res[key] = value
  }
  return res
}

// XXX hack to convert symbols to strings, since tape doesn't
// support symbols in deepEquals
function deepEquals (t, a, b) {
  t.equals(stringify(a), stringify(b))
}

function stringify (obj) {
  obj = replaceSymbols(obj)
  return inspect(obj, { depth: Infinity })
    .replace(/\s/g, '')
}

module.exports = { replaceSymbols, deepEquals }
