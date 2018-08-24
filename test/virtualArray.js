'use strict'

const test = require('tape')
const VirtualArray = require('../src/virtualArray.js')
const VirtualObject = require('../src/virtualObject.js')
const {
  PUSH,
  POP,
  UNSHIFT,
  SHIFT
} = VirtualArray

test('VirtualArray', (t) => {
  t.test('create root instance', (t) => {
    let target = [1, 2, 3]
    let array = new VirtualArray(target)
    t.true(array instanceof VirtualArray)
    t.true(array instanceof VirtualObject)
    t.end()
  })

  t.test('get wrapper', (t) => {
    let target = [1, 2, 3]
    let array = new VirtualArray(target)
    let wrapper = array.wrapper
    t.false(wrapper instanceof VirtualArray)
    t.true(Array.isArray(wrapper))
    t.equals(typeof wrapper, 'object')
    t.equals(Object.keys(wrapper).length, 3)
    t.end()
  })

  t.test('get root target element', (t) => {
    let target = [1, 2, 3]
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper
    t.equals(wrapper[0], 1)
    t.end()
  })

  t.test('get object element property', (t) => {
    let target = [ { x: 5 } ]
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper
    t.equals(wrapper[0].x, 5)
    t.end()
  })

  t.test('get root assigned element', (t) => {
    let target = [1, 2, 3]
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper
    wrapper[0] += 1
    t.equals(wrapper[0], 2)
    t.equals(target[0], 1)
    t.end()
  })

  t.test('get root property', (t) => {
    let target = [1, 2, 3]
    target.x = 5
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper
    t.equals(wrapper.x, 5)
    t.end()
  })

  t.test('get root assigned property', (t) => {
    let target = [1, 2, 3]
    target.x = 5
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper
    wrapper.x += 1
    t.equals(wrapper.x, 6)
    t.equals(target.x, 5)
    t.end()
  })

  t.test('push', (t) => {
    let target = [1, 2, 3]
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper
    wrapper.push(4, 5)
    t.equals(wrapper.length, 5)
    t.equals(wrapper[3], 4)
    t.equals(wrapper[4], 5)
    t.equals(target.length, 3)
    t.equals(target[3], undefined)
    t.equals(target[4], undefined)
    t.end()
  })

  t.test('unshift', (t) => {
    let target = [1, 2, 3]
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper
    wrapper.unshift(4, 5)
    t.equals(wrapper.length, 5)
    t.equals(wrapper[0], 4)
    t.equals(wrapper[1], 5)
    t.equals(wrapper[3], 2)
    t.equals(wrapper[4], 3)
    t.equals(target.length, 3)
    t.equals(target[3], undefined)
    t.equals(target[4], undefined)
    t.end()
  })

  t.test('pop', (t) => {
    let target = [1, 2, 3]
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper
    wrapper.pop()
    t.equals(wrapper.length, 2)
    t.false(2 in wrapper)
    t.equals(wrapper[1], 2)
    t.equals(target.length, 3)
    t.equals(target[2], 3)
    t.end()
  })

  t.test('shift', (t) => {
    let target = [1, 2, 3]
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper
    wrapper.shift()
    t.equals(wrapper.length, 2)
    t.false(2 in wrapper)
    t.equals(wrapper[1], 3)
    t.equals(target.length, 3)
    t.equals(target[2], 3)
    t.end()
  })

  t.test('decrease length', (t) => {
    let target = [1, 2, 3]
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper
    wrapper.length -= 1
    t.equals(wrapper.length, 2)
    t.false(2 in wrapper)
    t.equals(wrapper[1], 2)
    t.equals(target.length, 3)
    t.equals(target[2], 3)
    t.end()
  })

  t.test('increase length', (t) => {
    let target = [1, 2, 3]
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper
    wrapper.length += 1
    t.equals(wrapper.length, 4)
    t.false(3 in wrapper)
    t.equals(wrapper[3], undefined)
    t.equals(target.length, 3)
    t.false(3 in target)
    t.end()
  })

  t.test('get out-of-bounds value', (t) => {
    let target = [1, 2, 3]
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper
    t.false(5 in wrapper)
    t.equals(wrapper[5], undefined)
    t.end()
  })

  t.test('assign out-of-bounds value', (t) => {
    let target = [1, 2, 3]
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper
    wrapper[5] = 1
    t.equals(wrapper.length, 6)
    t.true(5 in wrapper)
    t.equals(wrapper[5], 1)
    t.end()
  })

  t.test('push over popped values', (t) => {
    let target = [1, 2, 3]
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper

    wrapper.pop()
    wrapper.push(3.5)
    wrapper.push(4)

    t.equals(wrapper[2], 3.5)
    t.equals(obj.patch[POP], 0)
    t.deepEquals(obj.patch[PUSH], [ 4 ])

    t.end()
  })

  t.test('unshift over shifted values', (t) => {
    let target = [1, 2, 3]
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper

    wrapper.shift()
    wrapper.unshift(1.5)
    wrapper.unshift(0)

    t.equals(wrapper[1], 1.5)
    t.equals(obj.patch[SHIFT], 0)
    t.deepEquals(obj.patch[UNSHIFT], [ 0 ])

    t.end()
  })

  t.test('pop from pushed values', (t) => {
    let target = [1, 2, 3]
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper

    wrapper.push(4)
    wrapper.pop()

    t.equals(obj.patch[POP], 0)
    t.equals(obj.patch[PUSH].length, 0)

    t.end()
  })

  t.test('shift from unshifted values', (t) => {
    let target = [1, 2, 3]
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper

    wrapper.unshift(0)
    wrapper.shift()

    t.equals(obj.patch[SHIFT], 0)
    t.equals(obj.patch[UNSHIFT].length, 0)

    t.end()
  })

  t.test('pop/shift on empty array', (t) => {
    let target = []
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper
    wrapper.shift()
    wrapper.pop()
    t.end()
  })

  t.test('iterator', (t) => {
    let target = [1, 2, 3]
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper

    let cloned = [ ...wrapper ]
    t.deepEquals(cloned, target)

    t.end()
  })

  t.test('commit', (t) => {
    let target = [1, 2, 3]
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper

    wrapper.shift()
    wrapper.push(4, 5)
    obj.commit()

    t.deepEquals(target, [ 2, 3, 4, 5 ])
    t.deepEquals(wrapper, [ 2, 3, 4, 5 ])
    t.equals(obj.patch[SHIFT], 0)
    t.equals(obj.patch[PUSH].length, 0)

    t.end()
  })

  t.test('keys', (t) => {
    let target = [1, 2, 3]
    target.x = 5
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper

    delete wrapper[1]
    wrapper.y = 6

    let keys = Object.keys(wrapper)
    t.true(keys.includes('0'))
    t.false(keys.includes('1'))
    t.true(keys.includes('2'))
    t.true(keys.includes('x'))
    t.true(keys.includes('y'))
    t.false(keys.includes('length'))

    t.end()
  })

  t.test('getOwnPropertyDescriptor', (t) => {
    let target = [1, 2, 3]
    target.x = 5
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper

    t.deepEquals(
      Object.getOwnPropertyDescriptor(wrapper, '0'),
      {
        value: 1,
        writable: true,
        enumerable: true,
        configurable: true
      }
    )
    t.deepEquals(
      Object.getOwnPropertyDescriptor(wrapper, 'length'),
      {
        value: 3,
        writable: true,
        enumerable: false,
        configurable: false
      }
    )
    t.deepEquals(
      Object.getOwnPropertyDescriptor(wrapper, 'x'),
      {
        value: 5,
        writable: true,
        enumerable: true,
        configurable: true
      }
    )
    t.deepEquals(
      Object.getOwnPropertyDescriptor(wrapper, 'y'),
      undefined
    )

    t.end()
  })

  t.test('in', (t) => {
    let target = [1, 2, 3]
    target.x = 5
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper
    delete wrapper[1]
    wrapper.push(4)

    t.true(0 in wrapper)
    t.true('0' in wrapper)
    t.false(1 in wrapper)
    t.false('1' in wrapper)
    t.true(3 in wrapper)
    t.true('3' in wrapper)
    t.true('length' in wrapper)
    t.true('x' in wrapper)
    t.false('y' in wrapper)

    t.end()
  })

  t.test('delete non-index property', (t) => {
    let target = [1, 2, 3]
    target.x = 5
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper
    delete wrapper.x

    t.false('x' in wrapper)

    t.end()
  })

  t.test('delete out-of-bounds index', (t) => {
    let target = [1, 2, 3]
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper
    delete wrapper[100]
    t.equals(wrapper.length, 3)
    t.end()
  })

  t.test('delete pushed value', (t) => {
    let target = [1, 2, 3]
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper
    wrapper.push(4)
    delete wrapper[3]
    t.equals(wrapper.length, 4)
    t.equals(wrapper[3], undefined)
    t.false(3 in wrapper)
    t.end()
  })

  t.test('set length to current value', (t) => {
    let target = [1, 2, 3]
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper
    wrapper.length = 3
    t.equals(wrapper.length, 3)
    t.end()
  })

  t.test('increase length', (t) => {
    let target = [1, 2, 3]
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper

    wrapper.length += 1

    t.equals(wrapper.length, 4)
    t.equals(wrapper[0], 1)
    t.equals(wrapper[3], undefined)
    t.false(3 in wrapper)

    t.end()
  })

  t.test('decrease length', (t) => {
    let target = [1, 2, 3]
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper

    wrapper.length -= 1

    t.equals(wrapper.length, 2)
    t.equals(wrapper[0], 1)
    t.equals(wrapper[2], undefined)
    t.false(2 in wrapper)

    t.end()
  })

  t.test('decrease length with pushed value', (t) => {
    let target = [1, 2, 3]
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper

    wrapper.push(4)
    wrapper.length -= 2

    t.equals(wrapper.length, 2)
    t.equals(wrapper[0], 1)
    t.equals(wrapper[2], undefined)
    t.equals(wrapper[3], undefined)
    t.false(2 in wrapper)
    t.false(3 in wrapper)

    t.end()
  })

  t.test('decrease length with pushed values', (t) => {
    let target = [1, 2, 3]
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper

    wrapper.push(4, 5)
    wrapper.length -= 1

    t.equals(wrapper.length, 4)
    t.equals(wrapper[0], 1)
    t.equals(wrapper[3], 4)
    t.equals(wrapper[4], undefined)

    t.end()
  })

  t.test('decrease length with unshifted value', (t) => {
    let target = [1]
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper

    wrapper.unshift(0)
    wrapper.length -= 1

    t.equals(wrapper.length, 1)
    t.equals(wrapper[0], 0)

    t.end()
  })

  t.test('decrease length with unshifted value', (t) => {
    let target = [1]
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper

    wrapper.unshift(0)
    wrapper.length = 0

    t.equals(wrapper.length, 0)

    t.end()
  })

  t.test('set invalid length', (t) => {
    let target = [1, 2, 3]
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper

    try {
      wrapper.length = -1
      t.fail()
    } catch (err) {
      t.equals(err.message, 'Invalid array length')
    }

    try {
      wrapper.length = 'x'
      t.fail()
    } catch (err) {
      t.equals(err.message, 'Invalid array length')
    }

    t.end()
  })

  t.end()
})
