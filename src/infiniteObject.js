'use strict'

function infiniteObject (parent, selfKey) {
  let state = {}
  let nKeys = 0

  let object = new Proxy(state, {
    get (target, key) {
      if (key in target) {
        return target[key]
      }

      return infiniteObject(object, key)
    },

    has (target, key) {
      return key in target
    },

    set (target, key, value) {
      if (parent != null && nKeys === 0) {
        parent[selfKey] = object
      }

      if (!(key in target)) {
        nKeys += 1
      }

      target[key] = value
      return true
    },

    deleteProperty (target, key) {
      if (!(key in target)) return

      nKeys -= 1
      if (parent != null && nKeys === 0) {
        delete parent[selfKey]
        return true
      }

      delete target[key]
      return true
    }
  })

  return object
}

module.exports = infiniteObject
