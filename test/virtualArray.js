'use strict'

const test = require('tape')
const VirtualArray = require('../src/virtualArray.js')
const VirtualObject = require('../src/virtualObject.js')
const {
  PUSH,
  POP,
  UNSHIFT,
  SHIFT
} = require('../src/arrayPatch.js')
const { ASSIGN } = VirtualObject
let { deepEquals } = require('./common.js')

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
    t.false(POP in obj.patch)
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
    t.false(SHIFT in obj.patch)
    t.deepEquals(obj.patch[UNSHIFT], [ 0 ])

    t.end()
  })

  t.test('pop from pushed values', (t) => {
    let target = [1, 2, 3]
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper

    wrapper.push(4)
    wrapper.pop()

    t.false(POP in obj.patch)
    t.false(PUSH in obj.patch)

    t.end()
  })

  t.test('shift from unshifted values', (t) => {
    let target = [1, 2, 3]
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper

    wrapper.unshift(0)
    wrapper.shift()

    t.false(SHIFT in obj.patch)
    t.false(UNSHIFT in obj.patch)

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
    t.false(SHIFT in obj.patch)
    t.false(PUSH in obj.patch)

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

  t.test('splice', (t) => {
    let target = [1, 2, 3]
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper

    // at beginning
    wrapper.splice(0, 1, 1.1)

    // at end
    wrapper.splice(2, 1, 3.1)

    // in middle
    try {
      wrapper.splice(1, 1)
      t.fail()
    } catch (err) {
      t.equals(err.message, 'VirtualArray currently only supports slicing at the end of the array')
    }

    t.end()
  })

  t.test('commit pop', (t) => {
    let target = [1, 2, 3]
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper

    wrapper.pop()
    obj.commit()

    t.deepEquals(target, [ 1, 2 ])

    t.end()
  })

  t.test('commit shift', (t) => {
    let target = [1, 2, 3]
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper

    wrapper.shift()
    obj.commit()

    t.deepEquals(target, [ 2, 3 ])

    t.end()
  })

  t.test('commit push', (t) => {
    let target = [1, 2, 3]
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper

    wrapper.push(4)
    obj.commit()

    t.deepEquals(target, [ 1, 2, 3, 4 ])

    t.end()
  })

  t.test('commit unshift', (t) => {
    let target = [1, 2, 3]
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper

    wrapper.unshift(0)
    obj.commit()

    t.deepEquals(target, [ 0, 1, 2, 3 ])

    t.end()
  })

  t.test('delete and unshift', (t) => {
    let target = [1, 2, 3]
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper

    delete wrapper[2]
    wrapper.unshift(0)

    t.equals(wrapper[0], 0)
    t.equals(wrapper[1], 1)
    t.equals(wrapper[2], 2)
    t.false(3 in wrapper)
    t.equals(wrapper.length, 4)
    t.deepEquals(
      Object.keys(wrapper),
      [ '0', '1', '2' ]
    )

    t.end()
  })

  t.test('push and shift', (t) => {
    let target = [1, 2, 3]
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper

    wrapper.push(4)
    wrapper.shift()

    t.equals(wrapper[0], 2)
    t.equals(wrapper[1], 3)
    t.equals(wrapper[2], 4)
    t.equals(wrapper.length, 3)
    t.deepEquals(
      Object.keys(wrapper),
      [ '0', '1', '2' ]
    )

    t.end()
  })

  t.test('shift from pushed', (t) => {
    let target = [1]
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper

    wrapper.push(2)
    wrapper.shift()
    wrapper.shift()

    t.false(0 in wrapper)
    t.false(1 in wrapper)
    t.equals(wrapper.length, 0)
    t.deepEquals(Object.keys(wrapper), [])

    obj.commit()

    t.false(0 in target)
    t.false(1 in target)
    t.equals(target.length, 0)
    t.deepEquals(Object.keys(target), [])

    t.end()
  })

  t.test('pop from unshifted', (t) => {
    let target = [2]
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper

    wrapper.unshift(1)
    wrapper.pop()
    wrapper.pop()

    t.false(0 in wrapper)
    t.false(1 in wrapper)
    t.equals(wrapper.length, 0)
    t.deepEquals(Object.keys(wrapper), [])

    obj.commit()

    t.false(0 in target)
    t.false(1 in target)
    t.equals(target.length, 0)
    t.deepEquals(Object.keys(target), [])

    t.end()
  })

  t.test('mutate virtual child array', (t) => {
    let target = []
    let obj = new VirtualArray(target)
    let wrapper = obj.wrapper

    wrapper.push([])
    wrapper[0].push(0)

    deepEquals(t, obj.patch, {
      [PUSH]: [ [0] ]
    })

    obj.commit()

    t.deepEquals(target, [ [0] ])

    t.end()
  })

  t.test('shift then unshift child', (t) => {
    let target = { foo: [1, 2, 3] }
    let obj = new VirtualObject(target)
    let wrapper = obj.wrapper

    wrapper.foo.shift()
    wrapper.foo.unshift(0)

    t.deepEquals(wrapper, { foo: [ 0, 2, 3 ] })

    deepEquals(t, obj.patch, {
      foo: {
        [ASSIGN]: { '0': 0 }
      }
    })

    obj.commit()

    t.deepEquals(target, { foo: [ 0, 2, 3 ] })

    t.end()
  })

  t.test('shift then unshift multiple', (t) => {
    let target = [1, 2, 3]
    let arr = new VirtualArray(target)
    let wrapper = arr.wrapper

    wrapper.shift()
    wrapper.unshift(0, 0.9)

    t.deepEquals(wrapper, [ 0, 0.9, 2, 3 ])

    deepEquals(t, arr.patch, {
      [ASSIGN]: { '0': 0.9 },
      [UNSHIFT]: [ 0 ]
    })

    arr.commit()

    t.deepEquals(target, [ 0, 0.9, 2, 3 ])

    t.end()
  })

  t.test('pop then push multiple', (t) => {
    let target = [1, 2, 3]
    let arr = new VirtualArray(target)
    let wrapper = arr.wrapper

    wrapper.pop()
    wrapper.push(3.1, 4)

    t.deepEquals(wrapper, [ 1, 2, 3.1, 4 ])

    deepEquals(t, arr.patch, {
      [ASSIGN]: { '2': 3.1 },
      [PUSH]: [ 4 ]
    })

    arr.commit()

    t.deepEquals(target, [ 1, 2, 3.1, 4 ])

    t.end()
  })

  t.end()
})
