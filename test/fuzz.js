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
      return mutate(target[key])
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
  let keys = Object.keys(target).sort()
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
const randomArrayMutation = () => {
  let muts = { ...mutations, ...arrayMutations }
  return random(muts)
}
const mutate = (obj) => {
  if (Array.isArray(obj)) {
    return randomArrayMutation()(obj)
  }
  return randomMutation()(obj)
}

function clone (obj) {
  let cloned = {}
  if (Array.isArray(obj)) {
    cloned = []
  }

  let keys = Object.keys(obj).sort()
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
    for (let i = 0; i < 100; i++) {
      let obj = values.object()
      let wrapper = muta(obj)
      t.deepEqual(obj, wrapper)
    }
    t.end()
  })

  t.test('wrapper mutation result = normal object mutation result', (t) => {
    for (let i = 0; i < 200; i++) {
      let obj = values.object()
      let cloned = clone(obj)
      let wrapper = muta(obj)
      t.deepEquals(wrapper, cloned)
      for (let i = 0; i < 20; i++) {
        let mutate = randomMutation()

        // reuse same randomness for both mutations
        let random = Math.random
        let values = new Array(1000).fill(0).map(random)
        let j = 0
        Math.random = () => values[j++]

        mutate(wrapper)
        j = 0
        mutate(cloned)

        t.deepEquals(wrapper, cloned)
        Math.random = random
      }
    }
    t.end()
  })

  t.test('pre-commit wrapper = post-commit target', (t) => {
    for (let i = 0; i < 4000; i++) {
      let obj = values.object()
      let wrapper = muta(obj)
      let mutationLog = []
      for (let i = 0; i < 5; i++) {
        mutationLog.push(mutate(wrapper))
      }
      let preCommit = clone(wrapper)
      muta.commit(wrapper)
      t.deepEquals(obj, preCommit)
    }
    t.end()
  })

  t.end()
})
