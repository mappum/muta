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
  constructor (target, patch) {
    if (!(PUSH in patch)) {
      patch[SHIFT] = 0
      patch[POP] = 0
      patch[PUSH] = []
      patch[UNSHIFT] = []
    }
    super(target, patch)
  }

  length () {
    let length = this.target.length
    length -= this.patch[SHIFT]
    length -= this.patch[POP]
    length += this.patch[PUSH].length
    length += this.patch[UNSHIFT].length
    return length
  }

  resolveIndex (index) {
    let unshiftLen = this.patch[UNSHIFT].length
    if (index < unshiftLen) {
      return { index, array: this.patch[UNSHIFT] }
    }

    index -= unshiftLen
    index += this.patch[SHIFT]

    let targetLen = this.target.length - this.patch[POP]
    if (index < targetLen) {
      return { index, array: this.target }
    }

    index -= this.patch[SHIFT]
    index -= targetLen

    let pushLen = this.patch[PUSH].length
    if (index < pushLen) {
      return { index, array: this.patch[PUSH] }
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
      return super.get(target, key)
    }

    let res = this.resolveIndex(index)
    if (res == null) return

    if (res.array === this.target) {
      return super.get(target, res.index)
    }

    return res.array[res.index]
  }

  set (target, key, value) {
    if (key === 'length') {
      return this.setLength(value)
    }

    let index = keyToIndex(key)
    if (typeof index !== 'number') {
      return super.set(target, key, value)
    }

    if (index >= this.length()) {
      this.setLength(index + 1)
    }

    let res = this.resolveIndex(index)

    if (res.array === this.target) {
      return super.set(target, res.index, value)
    }

    res.array[res.index] = value
    return true
  }

  deleteProperty (target, key) {
    let index = keyToIndex(key)
    if (typeof index !== 'number') {
      return super.deleteProperty(target, key)
    }

    let res = this.resolveIndex(index)
    if (res == null) {
      return true
    }

    if (res.array === this.target) {
      return super.deleteProperty(target, res.index)
    }

    delete res.array[res.index]
    return true
  }

  has (target, key) {
    let deleted = this.deletes(key)
    if (deleted) return false

    let index = keyToIndex(key)
    if (typeof index !== 'number') {
      return super.has(target, key)
    }

    if (index < target.length) {
      return super.has(target, key)
    } else if (index < this.length()) {
      return true
    }
    
    return false
  }

  getOwnPropertyDescriptor (target, key) {
    let has = this.has(target, key)
    if (!has) return

    let index = keyToIndex(key)
    if (typeof index !== 'number') {
      return super.getOwnPropertyDescriptor(target, key)
    }

    return {
      value: this.get(target, key),
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

    let objectKeys = super.ownKeys(target)
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
    let push = this.patch[PUSH]
    let unshift = this.patch[UNSHIFT]
    let pop = this.patch[POP]
    let shift = this.patch[SHIFT]

    // noop
    if (lengthChange === 0) {
      return true
    }

    // increase length by setting on 'push' values
    // TODO: subtract from pop count if > 0 (and delete index?)
    if (lengthChange > 0) {
      push.length += lengthChange
      return true
    }

    // decrease length (lengthChange is < 0)
    lengthChange = -lengthChange

    // shorten or remove push array
    if (lengthChange <= push.length) {
      push.length -= lengthChange
      return true
    }
    lengthChange -= push.length

    // shorten target range via pop count
    let targetSliceLength = this.target.length - pop - shift
    if (lengthChange <= targetSliceLength) {
      // target slice is long enough, now we're done
      this.patch[POP] += lengthChange
      return true
    } else {
      // pop all of target slice and continue
      this.patch[POP] -= targetSliceLength
      lengthChange -= targetSliceLength
    }

    if (lengthChange < unshift.length) {
      // shorten unshift array
      unshift.length -= lengthChange
    }
    return true
  }

  iterator () {
    let self = this
    return function * () {
      for (let i = 0; i < this.length(); i++) {
        yield self.get(null, i)
      }
    }
  }

  commit () {
    super.commit()

    let push = this.patch[PUSH]
    let unshift = this.patch[UNSHIFT]
    let pop = this.patch[POP]
    let shift = this.patch[SHIFT]
    this.target.splice(0, shift, ...unshift)
    this.target.splice(-pop, pop, ...push)

    this.patch[PUSH] = []
    this.patch[UNSHIFT] = []
    this.patch[POP] = 0
    this.patch[SHIFT] = 0
  }
}

const methods = {
  pop () {
    let length = this.length()
    if (length === 0) return
    let value = this.get(this.target, length - 1)
    this.setLength(length - 1)
    return value
  },

  shift () {
    if (this.length() === 0) return
    let value = this.get(this.target, 0)
    this.patch[SHIFT] += 1
    return value
  }
}

module.exports = VirtualArray
