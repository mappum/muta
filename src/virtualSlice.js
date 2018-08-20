'use strict'

const { keyToIndex } = require('./common.js')

// VirtualSlice points to a range of elements in a target array,
// without copying the values. It can be modified virtually by
// overriding elements, but cannot be grown or shrunk.
class VirtualSlice {
  constructor (target, start = 0, end = target.length) {
    this.target = target
    this.start = start
    this.end = end
    if (end < 0) {
      this.end = target.length + end + 1
    }
    return new Proxy(this.target, this)
  }

  length () {
    return this.end - this.start
  }

  assertIndex (index) {
    if (index > this.length()) {
      throw Error('Index out of bounds')
    }
  }

  get (target, key) {
    if (key === 'length') {
      return this.length()
    }

    if (key === Symbol.iterator) {
      let { start, end } = this
      return function * () {
        for (let i = start; i < end; i++) {
          return target[i]
        }
      }
    }

    let index = keyToIndex(key)
    if (typeof index !== 'number') {
      return Reflect.get(target, key)
    }

    return this.target[this.start + index]
  }

  set (target, key, value) {
    if (key === 'length') {
      throw Error('Cannot set "length" property')
    }

    let index = keyToIndex(key)
    if (typeof index !== 'number') {
      return Reflect.set(target, key, value)
    }
    this.assertIndex()

    target[index + this.start] = value
    return true
  }

  deleteProperty (target, key) {
    let index = keyToIndex(key)
    if (typeof index !== 'number') {
      return Reflect.deleteProperty(target, key, value)
    }
    this.assertIndex()

    delete target[index + this.start]
    return true
  }
}

module.exports = VirtualSlice
