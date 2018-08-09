'use strict'

const test = require('tape')
const VirtualArray = require('../src/virtualArray.js')

test('VirtualArray', (t) => {
  let target = [1, 2, 3]
  let a = new VirtualArray(target)
  // console.log(a.wrapper.length)
  // console.log(a.wrapper[1])
  // console.log(...a.wrapper)
  // for (let n of a.wrapper) {
  //   console.log(n)
  // }

  a.wrapper[1] = 0
  console.log(target, a.wrapper, a.patch)

  t.end()
})
