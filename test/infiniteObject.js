'use strict'

const test = require('tape')
const infiniteObject = require('../src/infiniteObject.js')

test('infiniteObject', (t) => {
  t.test('create', (t) => {
    let obj = infiniteObject()
    t.ok(obj)
    t.end()
  })

  t.end()
})
