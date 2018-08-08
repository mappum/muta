'use strict'

const test = require('tape')
const VirtualObject = require('../src/virtualObject.js')

test('VirtualObject', (t) => {
  t.test('create root instance', (t) => {
    let target = { foo: 123 }
    let obj = new VirtualObject(target)
    t.true(obj instanceof VirtualObject)
    t.end()
  })

  t.end()
})
