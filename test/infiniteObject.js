'use strict'

const test = require('tape')
const infiniteObject = require('../src/infiniteObject.js')

test('infiniteObject', (t) => {
  t.test('create root', (t) => {
    let root = infiniteObject()
    t.equals(typeof root, 'object')
    t.equals(Object.keys(root).length, 0)
    t.end()
  })

  t.test('access infinite child', (t) => {
    let root = infiniteObject()
    let child = root.foobar
    t.equals(typeof child, 'object')
    t.equals(Object.keys(child).length, 0)
    t.end()
  })

  t.test('access deep infinite child', (t) => {
    let root = infiniteObject()
    let child = root.foo.bar.baz.a.b.c
    t.equals(typeof child, 'object')
    t.equals(Object.keys(child).length, 0)
    t.end()
  })

  t.test('set on root', (t) => {
    let root = infiniteObject()
    root.foo = 5
    root.foo = 6
    t.equals(Object.keys(root).length, 1)
    t.equals(root.foo, 6)
    t.end()
  })

  t.test('set on child', (t) => {
    let root = infiniteObject()
    root.foo.bar = 5
    root.foo.bar = 6
    t.equals(Object.keys(root).length, 1)
    t.equals(Object.keys(root.foo).length, 1)
    t.equals(root.foo.bar, 6)
    t.end()
  })

  t.test('set on deep child', (t) => {
    let root = infiniteObject()
    root.foo.bar.baz.a.b.c = 5
    root.foo.bar.baz.a.b.c = 6
    t.equals(Object.keys(root).length, 1)
    t.equals(Object.keys(root.foo.bar.baz.a.b).length, 1)
    t.equals(root.foo.bar.baz.a.b.c, 6)
    t.end()
  })

  t.test('set object', (t) => {
    let root = infiniteObject()
    root.foo = { bar: 5 }
    root.foo = { bar: 6 }
    t.equals(root.foo.baz, undefined)
    t.equals(root.foo.bar, 6)
    t.end()
  })

  t.test('delete on root', (t) => {
    let root = infiniteObject()
    root.foo = 5
    delete root.foo
    delete root.foo2
    t.equals(Object.keys(root).length, 0)
    t.end()
  })

  t.test('delete on child', (t) => {
    let root = infiniteObject()
    root.foo.bar = 5
    root.foo.bar2 = 5
    delete root.foo.bar
    delete root.foo.bar2
    t.false('foo' in root)
    t.false('bar' in root.foo)
    t.end()
  })

  t.test('delete on deep child', (t) => {
    let root = infiniteObject()
    root.foo.bar.baz.a.b.c = 5
    delete root.foo.bar.baz.a.b.c
    t.false('foo' in root)
    t.false('c' in root.foo.bar.baz.a.b)
    t.end()
  })

  t.test('"in" on root', (t) => {
    let root = infiniteObject()
    root.foo = 5
    t.true('foo' in root)
    t.false('foo2' in root)
    t.end()
  })

  t.test('"in" on child', (t) => {
    let root = infiniteObject()
    root.foo.bar = 5
    t.true('foo' in root)
    t.true('bar' in root.foo)
    t.end()
  })

  t.end()
})
