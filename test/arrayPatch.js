'use strict'

const test = require('tape')
const arrayPatch = require('../src/arrayPatch.js')
const {
  PUSH,
  POP,
  UNSHIFT,
  SHIFT
} = arrayPatch

test('arrayPatch', (t) => {
  t.test('create instance', (t) => {
    let state = {}
    let patch = arrayPatch(state)
    t.deepEquals(patch[PUSH], [])
    t.deepEquals(patch[UNSHIFT], [])
    t.equals(patch[POP], 0)
    t.equals(patch[SHIFT], 0)
    t.deepEquals(state, {})
    t.end()
  })

  t.test('non-empty grow array', (t) => {
    let state = {}
    let patch = arrayPatch(state)
    patch[PUSH].push(0)
    t.deepEquals(patch[PUSH], [ 0 ])
    t.deepEquals(state[PUSH], [ 0 ])
    t.end()
  })

  t.test('empty grow array', (t) => {
    let state = {}
    let patch = arrayPatch(state)
    patch[PUSH].push(0)
    patch[PUSH].pop()
    t.deepEquals(patch[PUSH], [])
    t.false(PUSH in state)
    t.end()
  })

  t.test('non-zero shrink amount', (t) => {
    let state = {}
    let patch = arrayPatch(state)
    patch[POP] += 1
    t.equals(patch[POP], 1)
    t.equals(patch[SHIFT], 0)
    t.equals(state[POP], 1)
    t.end()
  })

  t.test('zero shrink amount', (t) => {
    let state = {}
    let patch = arrayPatch(state)
    patch[POP] += 1
    patch[POP] -= 1
    t.equals(patch[POP], 0)
    t.false(POP in state)
    t.end()
  })

  t.test('get/set unknown keys', (t) => {
    let state = {}
    let patch = arrayPatch(state)
    patch.foo = 123
    t.equals(patch.foo, 123)
    t.equals(state.foo, 123)
    t.end()
  })

  t.test('get/set unset keys', (t) => {
    let state = {}
    let patch = arrayPatch(state)
    t.equals(patch.foo, undefined)
    t.equals(state.foo, undefined)
    t.end()
  })

  t.end()
})
