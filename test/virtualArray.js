'use strict'

const test = require('tape')
const VirtualArray = require('../src/virtualArray.js')
const VirtualObject = require('../src/virtualObject.js')

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
    console.log(obj.patch)
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

  t.end()
})
