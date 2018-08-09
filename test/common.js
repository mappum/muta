'use strict'

function replaceSymbols (obj) {
  let keys = [].concat(
    Object.getOwnPropertySymbols(obj),
    Object.getOwnPropertyNames(obj)
  )
  let res = {}
  for (let key of keys) {
    let value = obj[key]
    if (value != null && typeof value === 'object') {
      value = replaceSymbols(value)
    }
    if (typeof key === 'symbol') {
      key = key.toString()
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
