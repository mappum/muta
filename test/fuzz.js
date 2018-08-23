'use strict'

const test = require('tape')
const muta = require('..')

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
      return randomMutation(target[key])
    }
    target[key] = value
    return `override obj.${key} = ${JSON.stringify(value)}`
  },
  delete (target) {
    let key = Math.random() < 0.9 ? selectKey(target) : randomKey()
    delete target[key]
    return `delete obj[${JSON.stringify(key)}]`
  }
}

const arrayMutations = {
  push (target) {
    let values = new Array(Math.random() * 2 | 0 + 1)
    values = values.fill(0).map(randomValue)
    target.push(...values)
  },
  unshift (target) {
    let values = new Array(Math.random() * 2 | 0 + 1)
    values = values.fill(0).map(randomValue)
    target.unshift(...values)
  },
  shift (target) {
    target.shift()
  },
  pop (target) {
    target.pop()
  }
}

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
  let index = Math.random() * keys.length | 0
  return keys[index]
}

function random (obj) {
  let key = selectKey(obj)
  return obj[key]
}

const randomKey = () => random(keys)()
const randomValue = () => random(values)()
const randomMutation = (obj) => {
  if (Array.isArray(obj)) {
    let muts = { ...mutations, ...arrayMutations }
    return random(muts)(obj)
  }
  return random(mutations)(obj)
}

function clone (obj) {
  let cloned = {}
  if (Array.isArray(obj)) {
    cloned = []
  }

  let keys = Object.keys(obj)
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
  for (let i = 0; i < 10; i++) {
    t.test(`unmutated wrapper = target (${i})`, (t) => {
      let obj = values.object()
      let wrapper = muta(obj)
      t.deepEqual(obj, wrapper)
      t.end()
    })
  }

  for (let i = 0; i < 400; i++) {
    t.test(`pre-commit wrapper = post-commit target (${i})`, (t) => {
      let obj = values.object()
      let wrapper = muta(obj)
      let mutationLog = []
      for (let i = 0; i < 40; i++) {
        mutationLog.push(randomMutation(wrapper))
      }
      let preCommit = clone(wrapper)
      muta.commit(wrapper)
      t.deepEquals(obj, preCommit)
      t.end()
    })
  }

  t.end()
})
