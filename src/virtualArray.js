'use strict'

const MutableSlice = require('./mutableSlice.js')
const { keyToIndex } = require('./common.js')

class VirtualArray {
  constructor (target, patch = {}) {
    this.target = target
    this.patch = patch
    this.wrapper = new Proxy(this.target, this)
  }

  length () {
    let { shift, pop, push, unshift } = this.patch
    let length = this.target.length
    length -= shift || 0
    length -= pop || 0
    if (push != null) length += push.length
    if (unshift != null) length += unshift.length
    return length
  }

  resolveIndex (index) {
    let { shift, pop, push, unshift } = this.patch

    let containers = [
      unshift,
      new MutableSlice(this.target, shift, -(pop || 0)),
      push
    ]

    for (let container of containers) {
      if (container == null) continue
      if (container.length <= index) {
        return {
          container,
          index,
          isTarget: container === containers[1]
        }
      }
      index -= container.length
    }
  }

  get (target, key) {
    if (key === 'length') {
      return this.length()
    }

    if (key === Symbol.iterator) {
      let self = this
      let length = this.length()
      return function * () {
        for (let i = 0; i < length; i++) {
          yield self.get(target, i)
        }
      }
    }

    let index = keyToIndex(key)
    if (typeof index !== 'number') {
      // TODO: wrap
      return Reflect.get(target, key)
    }

    let res = this.resolveIndex(index)
    if (res == null) {
      // out of bounds
      return undefined
    }

    if (res.isTarget) {
        // console.log(key, res, '1' in this.patch)
      if (res.index in this.patch) {
        // TODO: wrap
        return this.patch[res.index]
      }
    }

    // TODO: wrap
    return res.container[res.index]
  }

  set (target, key, value) {
    if (key === 'length') {
      throw Error('Cannot set "length" property')
    }

    let index = keyToIndex(key)
    if (typeof index !== 'number') {
      return super.set(target, key, value)
    }

    let res = this.resolveIndex(index)
    if (res == null) {
      // out of bounds
      return false
    }

    if (res.isTarget) {
      this.patch[res.index] = value
    } else {
      res.container[res.index] = value
    }
    return true
  }

  deleteProperty (target, key) {
    let index = keyToIndex(key)
    if (typeof index !== 'number') {
      return super.deleteProperty(target, key)
    }

    let res = this.resolveIndex(index)
    if (res == null) {
      // out of bounds
      return false
    }

    delete res.container[res.index]
  }
}

module.exports = VirtualArray
