'use strict'

const ASSIGN = Symbol('assign')
const DELETE = Symbol('delete')

// TODO: change to closure instead of class?
class ObjectPatch {
  constructor (target, parent, key) {
    this.target = target
    this.parent = parent
    this.key = key

    if (parent == null) {
      this.state = {}
    } else {
      this.state = parent.childState(key)
    }
  }

  childState (key) {
    if (this.state == null) {
      return undefined
    }
    return this.state[key]
  }

  createChildState (key) {
    let state = this.getOrCreateState()
    state[key] = {}
    return state[key]
  }

  removeChildState (key) {
    if (this.state == null) return
    delete this.state[key]
    this.removeStateIfEmpty()
  }

  getOrCreateState () {
    if (this.state == null) {
      this.state = this.parent.createChildState(this.key)
    }
    return this.state
  }

  get (key) {
    if (this.state == null) {
      return [ undefined, false ]
    }

    let toSet = this.state[ASSIGN]
    if (toSet != null && key in toSet) {
      return [ toSet[key], true ]
    }

    let toDelete = this.state[DELETE]
    if (toDelete != null && key in toDelete) {
      return [ undefined, true ]
    }

    return [ undefined, false ]
  }

  has (key) {
    if (this.state == null) {
      return [ false, false ]
    }

    let toSet = this.state[ASSIGN]
    if (toSet != null && key in toSet) {
      return [ true, true ]
    }

    let toDelete = this.state[DELETE]
    if (toDelete != null && key in toDelete) {
      return [ false, true ]
    }

    return [ false, false ]
  }

  set (key, value) {
    if (this.target != null && this.target[key] === value) {
      this.removeStateOpKey(ASSIGN, key)
      this.removeStateOpKey(DELETE, key)
      this.removeStateKey(key)
      return
    }

    let state = this.getOrCreateState()
    if (state[ASSIGN] == null) {
      state[ASSIGN] = {}
    }
    state[ASSIGN][key] = value

    this.removeStateOpKey(DELETE, key)
    this.removeStateKey(key)
  }

  deleteProperty (key) {
    if (this.target != null && !(key in this.target)) {
      this.removeStateOpKey(ASSIGN, key)
      this.removeStateOpKey(DELETE, key)
      this.removeStateKey(key)
      return
    }

    let state = this.getOrCreateState()
    if (state[DELETE] == null) {
      state[DELETE] = {}
    }
    state[DELETE][key] = true

    this.removeStateOpKey(ASSIGN, key)
    this.removeStateKey(key)
  }

  removeStateOpKey (op, key) {
    if (this.state == null) return
    if (this.state[op] == null) return
    delete this.state[op][key]
    if (isEmpty(this.state[op])) {
      delete this.state[op]
    }
    this.removeStateIfEmpty()
  }

  removeStateKey (key) {
    if (this.state == null) return
    delete this.state[key]
    this.removeStateIfEmpty()
  }

  removeStateIfEmpty () {
    if (this.parent != null && isEmpty(this.state)) {
      this.parent.removeChildState(this.key)
    }
  }
}

function isEmpty (obj) {
  return Object.getOwnPropertyNames(obj).length === 0
    && Object.getOwnPropertySymbols(obj).length === 0
}

module.exports = ObjectPatch
