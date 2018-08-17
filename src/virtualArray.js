'use strict'

const VirtualSlice = require('./virtualSlice.js')
const { keyToIndex } = require('./common.js')

// VirtualArray represents a wrapper around a target array,
// allowing virtual mutations including overriding elements,
// shrinking, and growing. Currently, splicing is not supported
// so growing and shrinking must happen at the ends (push, unshift, pop, shift).
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
      new VirtualSlice(this.target, shift, -(pop || 0)),
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
      return this.setLength(value)
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

  setLength (length) {
    if (!Number.isInteger(length) || length < 0) {
      throw RangeError('Invalid array length')
    }

    let lengthChange = this.length() - length
    let { push, pop, shift, unshift } = this.patch

    // noop
    if (lengthChange === 0) {
      return true
    }

    // increase length by setting on 'push' values
    if (lengthChange > 0) {
      if (push == null) {
        this.patch.push = new Array(lengthChange)
      } else {
        push.length += lengthChange
      }
      return true
    }

    // decrease length (lengthChange is < 0)

    // shorten or remove push array if it exists
    if (push != null) {
      // shorten push array
      if (-lengthChange < push.length) {
        push.length += lengthChange
        return true
      }

      // remove whole push array
      delete this.patch.push

      // done if no more elements to remove
      if (push.length === -lengthChange) {
        return true
      }

      lengthChange += push.length
    }

    // shorten target range via pop count
    let pop = pop || 0
    let shift = shift || 0
    let targetSliceLength = this.target.length - pop - shift
    this.patch.pop = pop
    if (-lengthChange <= targetSliceLength) {
      // target slice is long enough, now we're done
      this.patch.pop -= lengthChange
      return true
    } else {
      // pop all of target slice and continue
      this.patch.pop -= targetSliceLength
      lengthChange += targetSliceLength
    }

    if (-lengthChange < unshift.length) {
      // shorten unshift array
      unshift.length += lengthChange
    } else {
      // remove whole unshift array
      delete this.patch.unshift
    }
    return true
  }
}

module.exports = VirtualArray
