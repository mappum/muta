'use strict'

function keyToIndex (key) {
  try {
    let index = parseInt(key, 10)
    if (index >= 0 && index.toString() === key) {
      return index
    }
  } catch (err) {}
  return key
}

function getKeys (object) {
  return [].concat(
    Object.getOwnPropertyNames(object),
    Object.getOwnPropertySymbols(object)
  )
}

module.exports = { keyToIndex, getKeys }
