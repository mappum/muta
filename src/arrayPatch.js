'use strict'

const ops = {
  SPLICE: Symbol('splice'),
  PUSH: Symbol('push'),
  POP: Symbol('pop'),
  SHIFT: Symbol('shift'),
  UNSHIFT: Symbol('unshift')
}

const methodOps = new Map([
  [ Array.prototype.splice, ops.SPLICE ],
  [ Array.prototype.push, ops.PUSH ],
  [ Array.prototype.pop, ops.POP ],
  [ Array.prototype.shift, ops.SHIFT ],
  [ Array.prototype.unshift, ops.UNSHIFT ]
])

function wrapArray (target, store) {
  return new Proxy(target, {
    get (target, key) {
      let value = target[key]

      // if getting an array method, return a wrapped function to apply the
      // operation when called
      let op = methodOps.get(value)
      if (op != null) {
        return function (...args) {
          if (this !== target) {
            throw Error('Called array method with incorrect context')
          }
          return store.mutate(op, ...args)
        }
      }

      // lookup key in store (tree)
      let [ value, exists ] = store.get(key)
      if (exists) return value
      return target[key]
    }
  })
}

module.exports = wrapArray
