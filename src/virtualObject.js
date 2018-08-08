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
  }

  wrapper () {
    return new Proxy(this.target, this)
  }

  get (target, key) {
    // lets us unwrap by accessing the PATCH symbol key
    if (key === PATCH) {
      return this
    }

    // key is assigned to, resolve with virtual value as target
    if (this.assignsTo(key)) {
      let childPatch = this.patch[ASSIGN][key]
      return wrap(childPatch, childPatch)
    }

    // key is deleted
    if (this.deletes(key)) {
      return undefined
    }

    // key is not overridden by patch,
    // OR key is recursively patched
    return wrap(target[key], this.patch[key])
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
    if (target[key] === value) {
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
      let child = new VirtualObject(this.target[key], this.patch[key])
      child.commit()
    }
  }
}

module.exports = VirtualObject
Object.assign(module.exports, {
  ASSIGN,
  DELETE,
  PATCH
})

function wrap (target, patch) {
  if (!isWrappable(target)) {
    return target
  }

  // TODO: use VirtualArray for arrays
  let virtual = new VirtualObject(target, patch)
  return virtual.wrapper()
}

function isWrappable (value) {
  if (value == null) return false
  return typeof value === 'object' ||
    typeof value === 'function'
}
