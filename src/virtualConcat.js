'use strict'

const { keyToIndex } = require('./common.js')

// TODO: allow targets to implement 'pushCapacity'/'unshiftCapacity' so
// we can push/unshift/setLength more efficiently
// (e.g. by mutating target-wrapped VirtualSlice in VirtualArray)

// VirtualConcat points to an array of array-like elements,
// and appears as if the elements were concatenated, but is
// actually just keeping references to the original arrays.
// Mutations to the wrapper are made to the underlying
// references.
class VirtualConcat {
  constructor (targets) {
    this.targets = targets
    this.wrapper = new Proxy([], this)
    return this.wrapper
  }

  length () {
    return this.targets
      .reduce((sum, a) => sum + a.length, 0)
  }

  get (target, key) {
    if (key === 'length') {
      return this.length()
    }

    if (key === Symbol.iterator) {
      return this.iterator()
    }

    let index = keyToIndex(key)

    // key is not an array index, access method
    if (typeof index !== 'number') {
      let value = Reflect.get([], key)
      if (value != null) {
        value = value.bind(this.wrapper)
      }
      return value
    }

    // out of bounds
    if (index > this.length()) {
      return undefined
    }

    // access referenced array
    let res = this.resolveIndex(index)
    return res.array[res.index]
  }

  set (target, key, value) {
    if (key === 'length') {
      return this.setLength(value)
    }

    let index = keyToIndex(key)

    // key is not an array index
    if (typeof index !== 'number') {
      throw Error('Can only set array indexes')
    }

    // out of bounds, increase length
    if (index >= this.length()) {
      this.setLength(index + 1)
    }

    // access referenced array
    let res = this.resolveIndex(index)
    res.array[res.index] = value
    return true
  }

  deleteProperty (target, key) {
    let index = keyToIndex(key)

    // key is not an array index
    if (typeof index !== 'number') {
      throw Error('Can only delete array indexes')
    }

    // out of bounds, noop
    if (index > this.length()) {
      return true
    }

    // access referenced array
    let res = this.resolveIndex(index)
    delete res.array[res.index]
    return true
  }

  has (target, key) {
    if (key === 'length') {
      return true
    }
    if (key === Symbol.iterator) {
      return true
    }

    let index = keyToIndex(key)

    // key is not an array index
    if (typeof index !== 'number') {
      return key in Array.prototype
    }

    // bounds check
    return index < this.length()
  }

  ownKeys () {
    let keys = [ 'length', Symbol.iterator ]
    let length = this.length()
    for (let i = 0; i < length; i++) {
      keys.push(String(i))
    }
    return keys
  }

  getOwnPropertyDescriptor (target, key) {
    if (!this.has(target, key)) {
      return undefined
    }

    // key is not an array index
    let index = keyToIndex(key)
    if (typeof index !== 'number') {
      let descriptor = Reflect.getOwnPropertyDescriptor(target, key)
      if (key === 'length') {
        descriptor.value = this.length
      }
      return descriptor
    }

    return {
      value: this.get(target, key),
      writable: true,
      configurable: true,
      enumerable: true
    }
  }

  // iterates through all elements of all target arrays
  iterator () {
    let { targets } = this
    return function * () {
      for (let array of targets) {
        for (let value of array) {
          yield value
        }
      }
    }
  }

  resolveIndex (index) {
    for (let array of this.targets) {
      // resolved to position in the current array
      if (index < array.length) {
        return { array, index }
      }

      index -= array.length
    }
  }

  setLength (length) {
    if (!Number.isInteger(length) || length < 0) {
      throw RangeError('Invalid array length')
    }

    let lengthChange = length - this.length()

    // noop
    if (lengthChange === 0) {
      return true
    }

    // length increase
    if (lengthChange > 0) {
      let lastArray = this.targets[this.targets.length - 1]
      lastArray.length += lengthChange
      return true
    }

    // length decrease
    lengthChange = -lengthChange
    // TODO: remove from start if shift
    for (let array of this.targets.reverse()) {
      if (lengthChange < array.length) {
        // partially shorten array then break
        array.length -= lengthChange
        break
      }

      // fully shorten array and continue
      lengthChange -= array.length
      array.length = 0
    }
    return true
  }
}

module.exports = VirtualConcat
