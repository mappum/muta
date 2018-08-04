'use strict'

const ObjectPatch = require('./objectPatch.js')
const ArrayPatch = require('./arrayPatch.js')

function wrap (target, patch) {
  let wrapper = new Proxy(target, {
    get (target, key) {
      let [ value, resolved ] = patch.get(key)

      // fall through to target if not in patch
      if (!resolved) {
        value = target[key]
      }

      // don't wrap if not object or function
      if (!isWrappable(value)) {
        return value
      }

      // functions should be bound to parent
      if (typeof target === 'function') {
        value = value.bind(wrapper)
      }

      // create child patch object
      let childPatch
      // use array patch if value is array and defined in target
      if (!resolved && Array.isArray(value)) {
        childPatch = new ArrayPatch(target[key], patch, key)
      } else {
        childPatch = new ObjectPatch(target[key], patch, key)
      }

      // recursively wrap to create child proxy which mutates child patch
      return wrap(value, childPatch)
    },

    // setting mutates patch
    set (target, key, value) {
      patch.set(key, value)
      return true
    },

    // deleting mutates patch
    deleteProperty (target, key) {
      patch.deleteProperty(key)
      return true
    },

    // ovverride ownKeys to exclude symbol properties
    ownKeys (target) {
      return patch.ownKeys(target)
    },

    has (target, key) {
      let [ has, resolved ] = patch.has(key)
      if (resolved) return has
      return key in target
    },

    setPrototypeOf () {
      throw Error('Cannot call Object.setPrototypeOf on wrapped value')
    },
    preventExtensions () {
      throw Error('Cannot call Object.preventExtensions on wrapped value')
    },
    defineProperty () {
      throw Error('Cannot call Object.defineProperty on wrapped value')
    }
  })

  return wrapper
}

function isWrappable (value) {
  return (value != null) &&
    (typeof value === 'object') ||
    (typeof value === 'function')
}

module.exports = wrap
