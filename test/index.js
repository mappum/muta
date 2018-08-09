'use strict'

const test = require('tape')
const muta = require('..')
const { deepEquals } = require('./common.js')

test('entry point', (t) => {
  let original = { foo: 5 }
  let wrapper = muta(original)
  wrapper.foo += 1
  t.equals(wrapper.foo, 6)
  t.equals(original.foo, 5)
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

test('patch', (t) => {
  let original = { foo: 5 }
  let wrapper = muta(original)
  wrapper.foo += 1
  let patch = muta.patch(wrapper)
  deepEquals(t, patch, {
    'Symbol(assign)': { foo: 6 }
  })
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

test('patch called on non-wrapper', (t) => {
  try {
    muta.patch({})
    t.fail()
  } catch (err) {
    t.equals(err.message, 'Argument must be a muta wrapped object')
  }
  t.end()
})
