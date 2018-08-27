'use strict'

function replaceSymbols (obj) {
  let entries = []
    .concat(
      Object.getOwnPropertySymbols(obj),
      Object.getOwnPropertyNames(obj)
    )
    .map((key) => ({
      key: key.toString(),
      value: obj[key]
    }))
    .sort((a, b) => b.key > a.key ? 1 : -1)
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
  t.equals(
    JSON.stringify(replaceSymbols(a)),
    JSON.stringify(replaceSymbols(b))
  )
}

module.exports = { replaceSymbols, deepEquals }
