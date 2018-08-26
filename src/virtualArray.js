'use strict'

const VirtualObject = require('./virtualObject.js')
const { keyToIndex } = require('./common.js')

const SHIFT = Symbol('shift')
const POP = Symbol('pop')
const PUSH = Symbol('push')
const UNSHIFT = Symbol('unshift')

// VirtualArray represents a wrapper around a target array,
// allowing virtual mutations including overriding elements,
// shrinking, and growing. Currently, splicing is not supported
// so growing and shrinking must happen at the ends (push, unshift, pop, shift).
class VirtualArray extends VirtualObject {
  length () {
    let length = this.target.length
    if (PUSH in this.patch) {
      length += this.patch[PUSH].length
    }
    if (POP in this.patch) {
      length -= this.patch[POP]
    }
    if (UNSHIFT in this.patch) {
      length += this.patch[UNSHIFT].length
    }
    if (SHIFT in this.patch) {
      length -= this.patch[SHIFT]
    }
    return length
  }

  resolveIndex (index) {
    if (UNSHIFT in this.patch) {
      let unshiftLen = this.patch[UNSHIFT].length
      if (index < unshiftLen) {
        return { index, array: this.patch[UNSHIFT] }
      }
      index -= unshiftLen
      if (SHIFT in this.patch) {
        index += this.patch[SHIFT]
      }
    }

    let targetLen = this.target.length - notObj(this.patch[POP], 0)
    if (index < targetLen) {
      return { index, array: this.target }
    }

    index -= notObj(this.patch[SHIFT], 0)
    index -= targetLen

    if (PUSH in this.patch) {
      let pushLen = this.patch[PUSH].length
      if (index < pushLen) {
        return { index, array: this.patch[PUSH] }
      }
    }
  }

  get (target, key) {
    if (key === 'length') {
      return this.length()
    }

    if (key === Symbol.iterator) {
      return this.iterator()
    }

    let index = keyToIndex(key)
    if (typeof index !== 'number') {
      if (key in methods) {
        return methods[key].bind(this)
      }
      return super.get(this.target, key)
    }

    let res = this.resolveIndex(index)
    if (res == null) return

    if (res.array === this.target) {
      return super.get(this.target, res.index)
    }

    return super.wrap(res.array[res.index], this.patch[key])
  }

  set (target, key, value) {
    if (key === 'length') {
      return this.setLength(value)
    }

    let index = keyToIndex(key)
    if (typeof index !== 'number') {
      return super.set(this.target, key, value)
    }

    if (index >= this.length()) {
      this.setLength(index + 1)
    }

    let res = this.resolveIndex(index)

    if (res.array === this.target) {
      return super.set(this.target, res.index, value)
    }

    res.array[res.index] = value
    return true
  }

  deleteProperty (target, key) {
    let index = keyToIndex(key)
    if (typeof index !== 'number') {
      return super.deleteProperty(this.target, key)
    }

    let res = this.resolveIndex(index)
    if (res == null) {
      return true
    }

    if (res.array === this.target) {
      return super.deleteProperty(this.target, res.index)
    }

    delete res.array[res.index]
    return true
  }

  has (target, key) {
    let deleted = this.deletes(key)
    if (deleted) return false

    let index = keyToIndex(key)
    if (typeof index !== 'number') {
      return super.has(this.target, key)
    }

    let res = this.resolveIndex(index)
    if (res == null) return false

    if (res.array === this.target) {
      return super.has(this.target, res.index)
    }
    return res.index in res.array
  }

  getOwnPropertyDescriptor (target, key) {
    let has = this.has(this.target, key)
    if (!has) return

    let index = keyToIndex(key)
    if (typeof index !== 'number') {
      return super.getOwnPropertyDescriptor(this.target, key)
    }

    return {
      value: this.get(this.target, key),
      writable: true,
      enumerable: true,
      configurable: true
    }
  }

  ownKeys (target) {
    let keys = []
    for (let i = 0; i < this.length(); i++) {
      let key = String(i)
      if (this.deletes(key)) continue
      keys.push(key)
    }

    let objectKeys = super.ownKeys(this.target)
    for (let key of objectKeys) {
      let index = keyToIndex(key)
      if (typeof index === 'number') continue
      keys.push(key)
    }

    return keys
  }

  setLength (length) {
    if (!Number.isInteger(length) || length < 0) {
      throw RangeError('Invalid array length')
    }

    let lengthChange = length - this.length()
    let push = notObj(this.patch[PUSH], [])
    let unshift = notObj(this.patch[UNSHIFT], [])
    let pop = notObj(this.patch[POP], 0)
    let shift = notObj(this.patch[SHIFT], 0)

    let done = () => {
      if (push.length > 0) {
        this.patch[PUSH] = push
      } else {
        delete this.patch[PUSH]
      }
      if (unshift.length > 0) {
        this.patch[UNSHIFT] = unshift
      } else {
        delete this.patch[UNSHIFT]
      }
      if (pop > 0) {
        this.patch[POP] = pop
      } else {
        delete this.patch[POP]
      }
      if (shift > 0) {
        this.patch[SHIFT] = shift
      } else {
        delete this.patch[SHIFT]
      }
      return true
    }

    // noop
    if (lengthChange === 0) {
      return true
    }

    // increase length by setting on 'push' values
    // TODO: subtract from pop count if > 0 (and delete index?)
    if (lengthChange > 0) {
      push.length += lengthChange
      return done()
    }

    // decrease length (lengthChange is < 0)
    lengthChange = -lengthChange

    // shorten or remove push array
    if (lengthChange <= push.length) {
      push.length -= lengthChange
      return done()
    }
    lengthChange -= push.length
    push.length = 0

    // shorten target range via pop count
    let targetSliceLength = this.target.length - pop - shift
    if (lengthChange <= targetSliceLength) {
      // target slice is long enough, now we're done
      pop += lengthChange
      return done()
    } else {
      // pop all of target slice and continue
      pop += targetSliceLength
      lengthChange -= targetSliceLength
    }

    // shorten unshift array
    unshift.length -= lengthChange
    return done()
  }

  iterator () {
    let self = this
    return function * () {
      for (let i = 0; i < self.length(); i++) {
        yield self.get(null, i)
      }
    }
  }

  commit () {
    super.commit()

    let push = notObj(this.patch[PUSH], [])
    let unshift = notObj(this.patch[UNSHIFT], [])
    let pop = notObj(this.patch[POP], 0)
    let shift = notObj(this.patch[SHIFT], 0)

    this.target.splice(0, shift, ...unshift)
    this.target.splice(this.target.length, pop, ...push)

    delete this.patch[PUSH]
    delete this.patch[UNSHIFT]
    delete this.patch[POP]
    delete this.patch[SHIFT]
  }
}

const methods = {
  pop () {
    let length = this.length()
    if (length === 0) return

    if (PUSH in this.patch && this.patch[PUSH].length > 0) {
      return this.patch[PUSH].pop()
    }

    let value = this.get(this.target, length - 1)
    this.setLength(length - 1)
    return value
  },

  shift () {
    if (this.length() === 0) return

    if (UNSHIFT in this.patch && this.patch[UNSHIFT].length > 0) {
      return this.patch[UNSHIFT].shift()
    }

    let value = this.get(this.target, 0)
    this.patch[SHIFT] = notObj(this.patch[SHIFT], 0) + 1
    return value
  },

  unshift (...args) {
    let { patch } = this
    while (SHIFT in patch && patch[SHIFT] > 0 && args.length > 0) {
      patch[SHIFT] -= 1
      this.set(this.target, 0, args.shift())
    }
    if (args.length > 0) {
      patch[UNSHIFT] = notObj(patch[UNSHIFT], [])
      patch[UNSHIFT].unshift(...args)
    }
  },

  push (...args) {
    let { patch } = this
    while (POP in patch && patch[POP] > 0 && args.length > 0) {
      patch[POP] -= 1
      this.set(this.target, this.length() - 1, args.shift())
    }
    if (args.length > 0) {
      patch[PUSH] = notObj(patch[PUSH], [])
      patch[PUSH].push(...args)
    }
  },

  splice () {
    throw Error('splice not supported by VirtualArray')
  }
}

module.exports = VirtualArray
Object.assign(module.exports, {
  PUSH,
  POP,
  UNSHIFT,
  SHIFT
})

function notObj (a, b) {
  if (a && typeof a === 'object' && !Array.isArray(a)) {
    return b
  }
  return a
}
