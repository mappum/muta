'use strict'

const { inspect } = require('util')
const test = require('tape')
const VirtualObject = require('../lib/virtualObject.js')
const { ASSIGN, DELETE } = VirtualObject
const { deepEquals } = require('./common.js')

test('VirtualObject', (t) => {
  t.test('create root instance', (t) => {
    let target = { foo: 123 }
    let obj = new VirtualObject(target)
    t.true(obj instanceof VirtualObject)
    t.end()
  })

  t.test('get wrapper', (t) => {
    let target = { foo: 123 }
    let obj = new VirtualObject(target)
    let wrapper = obj.wrapper
    t.false(wrapper instanceof VirtualObject)
    t.equals(typeof wrapper, 'object')
    t.equals(Object.keys(wrapper).length, 1)
    t.end()
  })

  t.test('get root target property', (t) => {
    let target = { foo: 123 }
    let obj = new VirtualObject(target)
    let wrapper = obj.wrapper
    t.equals(wrapper.foo, 123)
    t.end()
  })

  t.test('get child target property', (t) => {
    let target = { foo: { bar: 123 } }
    let obj = new VirtualObject(target)
    let wrapper = obj.wrapper
    t.equals(wrapper.foo.bar, 123)
    t.deepEquals(wrapper.foo, { bar: 123 })
    t.end()
  })

  t.test('get root assigned property', (t) => {
    let target = { foo: 123 }
    let obj = new VirtualObject(target)
    let wrapper = obj.wrapper
    wrapper.foo += 1
    t.equals(wrapper.foo, 124)
    t.equals(target.foo, 123)
    t.end()
  })

  t.test('get child assigned property', (t) => {
    let target = { foo: { bar: 123 } }
    let obj = new VirtualObject(target)
    let wrapper = obj.wrapper
    wrapper.foo.bar += 1
    t.equals(wrapper.foo.bar, 124)
    t.equals(target.foo.bar, 123)
    t.end()
  })

  t.test('get root deleted property', (t) => {
    let target = { foo: 123 }
    let obj = new VirtualObject(target)
    let wrapper = obj.wrapper
    delete wrapper.foo
    t.false('foo' in wrapper)
    t.equals(wrapper.foo, undefined)
    t.true('foo' in target)
    t.equals(target.foo, 123)
    t.end()
  })

  t.test('get child deleted property', (t) => {
    let target = { foo: { bar: 123 } }
    let obj = new VirtualObject(target)
    let wrapper = obj.wrapper
    delete wrapper.foo.bar
    t.false('bar' in wrapper.foo)
    t.equals(wrapper.foo.bar, undefined)
    t.true('bar' in target.foo)
    t.equals(target.foo.bar, 123)
    t.end()
  })

  t.test('get root added property', (t) => {
    let target = { foo: 123 }
    let obj = new VirtualObject(target)
    let wrapper = obj.wrapper
    wrapper.bar = 456
    t.true('foo' in wrapper)
    t.true('bar' in wrapper)
    t.equals(wrapper.foo, 123)
    t.equals(wrapper.bar, 456)
    t.true('foo' in target)
    t.false('bar' in target)
    t.equals(target.foo, 123)
    t.equals(target.bar, undefined)
    t.end()
  })

  t.test('get child added property', (t) => {
    let target = { foo: { bar: 123 } }
    let obj = new VirtualObject(target)
    let wrapper = obj.wrapper
    wrapper.foo.baz = 456
    t.true('bar' in wrapper.foo)
    t.true('baz' in wrapper.foo)
    t.equals(wrapper.foo.bar, 123)
    t.equals(wrapper.foo.baz, 456)
    t.true('bar' in target.foo)
    t.false('baz' in target.foo)
    t.equals(target.foo.bar, 123)
    t.equals(target.foo.baz, undefined)
    t.end()
  })

  t.test('delete child added property', (t) => {
    let target = { foo: { bar: 123 } }
    let obj = new VirtualObject(target)
    let wrapper = obj.wrapper
    wrapper.foo = { bar: 123 }
    delete wrapper.foo.bar
    t.false('bar' in wrapper.foo)
    t.end()
  })

  t.test('keys', (t) => {
    let s1 = Symbol('1')
    let s2 = Symbol('2')
    let target = { foo: 123, foo2: 4, [s1]: 456 }
    let obj = new VirtualObject(target)
    let wrapper = obj.wrapper
    wrapper.bar = true
    wrapper[s1] = true
    wrapper[s2] = true
    delete wrapper.foo2
    let names = Object.getOwnPropertyNames(wrapper)
    t.deepEquals(names, [ 'foo', 'bar' ])
    let symbols = Object.getOwnPropertySymbols(wrapper)
    t.deepEquals(symbols, [ s1, s2 ])
    let keys = Object.keys(wrapper)
    t.deepEquals(keys, [ 'foo', 'bar' ])
    let inspected = inspect(wrapper)
    if (process.browser || process.versions.node.split('.')[0] < 8) {
      t.equals(inspected, '{ foo: 123, bar: true }')
    } else {
      t.equals(inspected, '{ foo: 123, bar: true, [Symbol(1)]: true, [Symbol(2)]: true }')
    }
    t.end()
  })

  t.test('commit', (t) => {
    let target = { foo: { bar: 123 } }
    let oldFoo = target.foo
    let obj = new VirtualObject(target)
    let wrapper = obj.wrapper
    delete wrapper.foo.bar
    wrapper.foo2 = { bar: 456 }
    wrapper.x = 5
    obj.commit()
    t.deepEquals(target, {
      foo: {},
      foo2: { bar: 456 },
      x: 5
    })
    t.equals(target.foo, oldFoo)
    t.end()
  })

  t.test('function binding', (t) => {
    let target = {
      f: function () { return this.x },
      x: 5
    }
    let obj = new VirtualObject(target)
    let wrapper = obj.wrapper
    wrapper.x += 1
    t.equals(wrapper.f(), 6)
    t.equals(target.f(), 5)
    t.end()
  })

  t.test('patch snapshot', (t) => {
    let target = {
      bar: { baz: 123 },
      xyz: { abc: true },
      y: 5
    }
    let originalBar = target.bar
    let obj = new VirtualObject(target)
    let wrapper = obj.wrapper

    // if setting/mutating, add the value to the parent in ASSIGN
    wrapper.bar.baz++
    deepEquals(t, obj.patch, {
      bar: { [ASSIGN]: { baz: 124 } }
    })

    // same rule as above
    // bar mutations get deleted when overriding
    wrapper.bar = { x: 5 }
    wrapper.a = 1
    deepEquals(t, obj.patch, {
      [ASSIGN]: { bar: { x: 5 }, a: 1 }
    })

    // if mutating an object in ASSIGN, mutate the object inside the patch
    delete wrapper.bar.x
    deepEquals(t, obj.patch, {
      [ASSIGN]: { bar: {}, a: 1 }
    })

    // if deleting a target property, add key to DELETE
    delete wrapper.xyz.abc
    deepEquals(t, obj.patch, {
      [ASSIGN]: { bar: {}, a: 1 },
      xyz: { [DELETE]: { abc: true } }
    })

    // override deletions with ASSIGN
    wrapper.xyz.abc = 123
    deepEquals(t, obj.patch, {
      [ASSIGN]: { bar: {}, a: 1 },
      xyz: { [ASSIGN]: { abc: 123 } }
    })

    // ASSIGN added object back to target value
    wrapper.xyz.abc = 5
    deepEquals(t, obj.patch, {
      [ASSIGN]: { bar: {}, a: 1 },
      xyz: { [ASSIGN]: { abc: 5 } }
    })

    // DELETE added value
    wrapper.x = 5
    delete wrapper.x
    deepEquals(t, obj.patch, {
      [ASSIGN]: { bar: {}, a: 1 },
      xyz: { [ASSIGN]: { abc: 5 } }
    })

    // DELETE assigned value
    delete wrapper.a
    deepEquals(t, obj.patch, {
      [ASSIGN]: { bar: {} },
      xyz: { [ASSIGN]: { abc: 5 } }
    })

    // ASSIGN to original value
    wrapper.y += 1
    wrapper.y -= 1
    deepEquals(t, obj.patch, {
      [ASSIGN]: { bar: {} },
      xyz: { [ASSIGN]: { abc: 5 } }
    })

    // ASSIGN to added value
    wrapper.bar.x = 5
    deepEquals(t, obj.patch, {
      [ASSIGN]: { bar: { x: 5 } },
      xyz: { [ASSIGN]: { abc: 5 } }
    })

    // ASSIGN to deleted original value
    delete wrapper.y
    wrapper.y = 5
    deepEquals(t, obj.patch, {
      [ASSIGN]: { bar: { x: 5 } },
      xyz: { [ASSIGN]: { abc: 5 } }
    })

    // ASSIGN back to original object value
    wrapper.bar = originalBar
    deepEquals(t, obj.patch, {
      xyz: { [ASSIGN]: { abc: 5 } }
    })

    // ASSIGN recursive object value to itself
    wrapper.bar.baz += 1
    wrapper.bar = originalBar
    deepEquals(t, obj.patch, {
      xyz: { [ASSIGN]: { abc: 5 } },
      bar: { [ASSIGN]: { baz: 124 } }
    })

    t.end()
  })

  t.end()
})
