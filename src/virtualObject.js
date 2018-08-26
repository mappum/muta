'use strict'

const infiniteObject = require('./infiniteObject.js')

const ASSIGN = Symbol('assign')
const DELETE = Symbol('delete')
const PATCH = Symbol('muta patch')

// VirtualObject represents a wrapper over some target data,
// which when mutated will only mutate a "patch" object, and
// can be accessed as if the mutations were made to the original
// data. The patch changes can be flushed/committed to the target
// data later, or thrown away.
class VirtualObject {
  constructor (target, patch = infiniteObject()) {
    this.target = target
    this.patch = patch
    this.wrapper = new Proxy(this.target, this)
  }

  get (target, key) {
    // lets us unwrap by accessing the PATCH symbol key
    if (key === PATCH) {
      return this
    }

    // key is assigned to, resolve with virtual value as target
    if (this.assignsTo(key)) {
      let childPatch = this.patch[ASSIGN][key]
      return this.wrap(childPatch, childPatch)
    }

    // key is deleted
    if (this.deletes(key)) {
      return undefined
    }

    // key is not overridden by patch,
    // OR key is recursively patched
    return this.wrap(target[key], this.patch[key])
  }

  has (target, key) {
    if (this.assignsTo(key)) {
      return true
    }
    if (this.deletes(key)) {
      return false
    }

    // key is not overridden by patch,
    // OR key is recursively patched
    return key in target
  }

  set (target, key, value) {
    // if this target is virtual, just assign to it
    if (target === this.patch) {
      target[key] = value
      return true
    }

    // if set back to original value, remove from patch
    if (key in target && target[key] === value) {
      if (this.assignsTo(key)) {
        delete this.patch[ASSIGN][key]
      } else if (this.deletes(key)) {
        delete this.patch[DELETE][key]
      }
      return true
    }

    this.patch[ASSIGN][key] = value

    if (key in this.patch) {
      delete this.patch[key]
    } else if (this.deletes(key)) {
      delete this.patch[DELETE][key]
    }
    return true
  }

  deleteProperty (target, key) {
    // we don't need the delete operation if target is virtual or key doesn't
    // exist in target
    if (target !== this.patch && key in target) {
      this.patch[DELETE][key] = true
    }

    if (key in this.patch) {
      delete this.patch[key]
    } else if (this.assignsTo(key)) {
      delete this.patch[ASSIGN][key]
    }
    return true
  }

  ownKeys (target) {
    if (target === this.patch) {
      return Reflect.ownKeys(target)
    }

    // get target keys
    let keys = getKeys(target)

    // filter out deleted keys
    if (DELETE in this.patch) {
      keys = keys.filter((key) => {
        return !(key in this.patch[DELETE])
      })
    }

    // add newly assigned keys
    if (ASSIGN in this.patch) {
      let assignedKeys = getKeys(this.patch[ASSIGN])
      for (let key of assignedKeys) {
        if (key in target) continue
        keys.push(key)
      }
    }

    return keys
  }

  getOwnPropertyDescriptor (target, key) {
    if (DELETE in this.patch) {
      if (key in this.patch[DELETE]) {
        return undefined
      }
    }

    if (ASSIGN in this.patch) {
      if (key in this.patch[ASSIGN]) {
        return {
          value: this.patch[ASSIGN][key],
          writable: true,
          configurable: true,
          enumerable: true
        }
      }
    }

    return Reflect.getOwnPropertyDescriptor(target, key)
  }

  assignsTo (key) {
    return ASSIGN in this.patch &&
      key in this.patch[ASSIGN]
  }

  deletes (key) {
    return DELETE in this.patch &&
      key in this.patch[DELETE]
  }

  commit () {
    // assign
    if (ASSIGN in this.patch) {
      Object.assign(this.target, this.patch[ASSIGN])
      delete this.patch[ASSIGN]
    }

    // delete
    if (DELETE in this.patch) {
      for (let key in this.patch[DELETE]) {
        delete this.target[key]
      }
      delete this.patch[DELETE]
    }

    // recurse
    for (let key in this.patch) {
      console.log(key, this.target, this.patch)
      let child = wrap(this.target[key], this.patch[key], this.wrapper)
      child.commit()
    }
  }

  wrap (target, patch) {
    if (!isWrappable(target)) {
      return target
    }

    let child = wrap(target, patch, this.wrapper)
    return child.wrapper
  }
}

module.exports = VirtualObject
Object.assign(module.exports, {
  ASSIGN,
  DELETE,
  PATCH
})

function wrap (target, patch, wrapper) {
  if (typeof target === 'function') {
    // TODO: do this in a better way,
    // this prevents consumers from re-brinding the function
    target = target.bind(wrapper)
  }

  if (target !== patch && Array.isArray(target)) {
    let VA = require('./virtualArray.js')
    return new VA(target, patch)
  } else {
    return new VirtualObject(target, patch)
  }
}

function isWrappable (value) {
  if (value == null) return false
  return typeof value === 'object' ||
    typeof value === 'function'
}

function getKeys (object) {
  return [].concat(
    Object.getOwnPropertyNames(object),
    Object.getOwnPropertySymbols(object)
  )
}
