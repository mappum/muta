'use strict'

const test = require('tape')
const muta = require('..')
const { deepEquals } = require('./common.js')

test('wrap object', (t) => {
  let original = { foo: 5 }
  let wrapper = muta(original)
  wrapper.foo += 1
  t.equals(wrapper.foo, 6)
  t.equals(original.foo, 5)
  t.end()
})

test('wrap array', (t) => {
  let original = [ 1, 2 ]
  let wrapper = muta(original)
  wrapper.push(3)
  t.equals(wrapper[2], 3)
  t.equals(original[2], undefined)
  t.end()
})

test('commit', (t) => {
  let original = { foo: 5 }
  let wrapper = muta(original)
  wrapper.foo += 1
  muta.commit(wrapper)
  t.equals(original.foo, 6)
  t.end()
})

test('getPatch', (t) => {
  let original = { foo: 5 }
  let wrapper = muta(original)
  wrapper.foo += 1
  let patch = muta.getPatch(wrapper)
  deepEquals(t, patch, {
    'Symbol(assign)': { foo: 6 }
  })
  t.end()
})

test('isMuta', (t) => {
  let original = { foo: { bar: 5 } }
  let wrapper = muta(original)
  t.true(muta.isMuta(wrapper))
  t.true(muta.isMuta(wrapper.foo))
  t.false(muta.isMuta(wrapper.foo.bar))
  t.false(muta.isMuta(original))
  t.false(muta.isMuta(original.foo))
  t.false(muta.isMuta(original.foo.bar))
  t.false(muta.isMuta(null))
  t.end()
})

test('commit called on non-wrapper', (t) => {
  try {
    muta.commit({})
    t.fail()
  } catch (err) {
    t.equals(err.message, 'Argument must be a muta wrapped object')
  }
  t.end()
})

test('getPatch called on non-wrapper', (t) => {
  try {
    muta.getPatch({})
    t.fail()
  } catch (err) {
    t.equals(err.message, 'Argument must be a muta wrapped object')
  }
  t.end()
})

test('access buffer property', (t) => {
  let obj = muta({ foo: Buffer.from([ 1, 2, 3 ]) })
  t.equals(obj.foo.toString('hex'), '010203')
  t.end()
})

test('access buffer element', (t) => {
  let arr = muta([ Buffer.from([ 1, 2, 3 ]) ])
  t.equals(arr[0].toString('hex'), '010203')
  t.end()
})
