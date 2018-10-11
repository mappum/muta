'use strict'

const test = require('tape')
const muta = require('..')
const { deepEquals } = require('./common.js')

const mutations = {
  set (target) {
    let key = randomKey()
    let value = randomValue()
    target[key] = value
    return `set obj.${key} = ${JSON.stringify(value)}`
  },
  override (target) {
    let key = selectKey(target)
    let value = randomValue()
    if (
      target[key] != null &&
      typeof target[key] === 'object' &&
      Math.random() < 0.5
    ) {
      return mutate(target[key])
    }
    target[key] = value
    return `override obj.${key} = ${JSON.stringify(value)}`
  },
  delete (target) {
    let key = Math.random() < 0.9 ? selectKey(target) : randomKey()
    delete target[key]
    return `delete obj[${JSON.stringify(key)}]`
  },
  mutaWrap (target) {
    let key = selectKey(target)
    if (Math.random() < 0.05 && target[key] != null && typeof target[key] === 'object') {
      target[key] = muta(target[key])
      return `muta wrap(${key})`
    }
    return 'noop'
  },
  mutaCommit (target) {
    let key = selectKey(target)
    if (muta.isMuta(target[key]) && Math.random() < 0.1) {
      muta.commit(target[key])
      return `muta commit(${key})`
    }
    return 'noop'
  }
}

const arrayMutations = {
  push (target) {
    let values = new Array(Math.random() * 2 | 0 + 1)
    values = values.fill(0).map(randomValue)
    target.push(...values)
    return `push (${values.join(', ')})`
  },
  unshift (target) {
    let values = new Array(Math.random() * 2 | 0 + 1)
    values = values.fill(0).map(randomValue)
    target.unshift(...values)
    return `unshift (${values.join(', ')})`
  },
  shift (target) {
    target.shift()
    return 'shift'
  },
  pop (target) {
    target.pop()
    return 'pop'
  },
  spliceStart (target) {
    let removeCount = Math.random() * 2 | 0
    let insert = new Array(Math.random() * 3 | 0 + 1)
    target.splice(0, removeCount, ...insert)
    return `splice (0, ${removeCount}, ${insert.join(', ')})`
  },
  spliceEnd (target) {
    let removeCount = Math.random() * 2 | 0
    let insert = new Array(Math.random() * 3 | 0 + 1)
    target.splice(target.length - removeCount, removeCount, ...insert)
    return `splice (${target.length - removeCount}, ${removeCount}, ${insert.join(', ')})`
  }
}

let arrayAndObjectMutations = Object.assign(
  {},
  mutations,
  arrayMutations
)

const keys = {
  property () {
    return Math.random().toString(36).slice(2)
  },
  index () {
    return Math.random() * 1000 | 0
  }
}

const values = {
  nullish () {
    return Math.random() < 0.5 ? null : undefined
  },
  boolean () {
    return Math.random() < 0.5
  },
  number () {
    return Math.random() * 100
  },
  string () {
    return Math.random().toString(36).slice(2)
  },
  object () {
    let obj = {}
    let properties = Math.random() * 5 | 0
    for (let i = 0; i < properties; i++) {
      obj[randomKey()] = randomValue()
    }
    return obj
  },
  array () {
    let array = []
    let length = Math.random() * 5 | 0
    let properties = Math.random() * 2 | 0
    for (let i = 0; i < length; i++) {
      if (Math.random() < 0.1) continue
      array[i] = random(values)()
    }
    for (let i = 0; i < properties; i++) {
      array[keys.property()] = randomValue()
    }
    return array
  }
}

function selectKey (target) {
  let keys = Object.keys(target)
  if (Array.isArray(target)) {
    for (let i = 0; i < target.length; i++) {
      if (!(i in target)) keys.push(String(i))
    }
  }
  keys.sort()
  let index = Math.random() * keys.length | 0
  return keys[index]
}

function random (obj) {
  let key = selectKey(obj)
  return obj[key]
}

const randomKey = () => random(keys)()
const randomValue = () => random(values)()
const randomMutation = () => random(mutations)
const randomArrayMutation = () => random(arrayAndObjectMutations)
const mutate = (obj) => {
  if (Array.isArray(obj)) {
    return randomArrayMutation()(obj)
  }
  return randomMutation()(obj)
}

function clone (obj) {
  let cloned = {}
  let keys = Object.keys(obj)

  if (Array.isArray(obj)) {
    cloned = []
    // add deleted properties to keys list
    for (let i = 0; i < obj.length; i++) {
      if (!(i in obj)) keys.push(i)
    }
  }

  keys.sort()

  for (let key of keys) {
    let value = obj[key]
    if (value && typeof value === 'object') {
      value = clone(value)
    }
    cloned[key] = value
  }

  return cloned
}

test('fuzz', (t) => {
  t.test('unmutated wrapper = target', (t) => {
    for (let i = 0; i < 1000; i++) {
      let obj = values.object()
      let wrapper = muta(obj)
      deepEquals(t, obj, wrapper)
    }
    t.end()
  })

  t.test('wrapper mutation result = normal object mutation result', (t) => {
    for (let i = 0; i < 1000; i++) {
      let obj = values.object()
      let cloned = clone(obj)
      let wrapper = muta(obj)
      deepEquals(t, wrapper, cloned)
      for (let i = 0; i < 5; i++) {
        let mutate = randomMutation()

        // reuse same randomness for both mutations
        let random = Math.random
        let values = new Array(5000).fill(0).map(random)
        let j = 0
        Math.random = () => values[j++]

        mutate(wrapper)
        j = 0
        mutate(cloned)

        deepEquals(t, wrapper, cloned)
        Math.random = random
      }
    }
    t.end()
  })

  t.test('pre-commit wrapper = post-commit target', (t) => {
    for (let i = 0; i < 1000; i++) {
      let obj = values.object()
      let wrapper = muta(obj)
      for (let i = 0; i < 5; i++) {
        mutate(wrapper)
      }
      let preCommit = clone(wrapper)
      muta.commit(wrapper)
      deepEquals(t, obj, preCommit)
    }
    t.end()
  })

  t.end()
})
