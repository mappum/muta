'use strict'

const test = require('tape')
const clone = require('clone')
const muta = require('..')

const mutations = {
  set (target) {
    let key = randomKey()
    let value = randomValue()
    target[key] = value
    return `set obj.${key} = ${JSON.stringify(value)}`
  },
  override (target, parentKeys = []) {
    let key = selectKey(target)
    let value = randomValue()
    parentKeys.push(key)
    if (target[key] && typeof target[key] === 'object' && Math.random() < 0.5) {
      return mutations.override(target[key], parentKeys)
    }
    target[key] = value
    return `override obj.${parentKeys.join('.')} = ${JSON.stringify(value)}`
  },
  delete (target) {
    let key = selectKey(target)
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
    let properties = Math.random() * 3 | 0
    for (let i = 0; i < properties; i++) {
      obj[randomKey()] = randomValue()
    }
    return obj
  },
  // array () {
  //   let array = []
  //   let length = Math.random() * 5 | 0
  //   let properties = Math.random() * 2 | 0
  //   for (let i = 0; i < length; i++) {
  //     if (Math.random() < 0.1) continue
  //     array[i] = random(values)()
  //   }
  //   for (let i = 0; i < properties; i++) {
  //     array[keys.property()] = randomValue()
  //   }
  //   return array
  // }
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
    let muts = mutations.concat(arrayMutations)
    return random(muts)(obj)
  }
  return random(mutations)(obj)
}

test('fuzz', (t) => {
  for (let i = 0; i < 20; i++) {
    t.test(`wrapper value is equivalent to original object (${i})`, (t) => {
      let obj = values.object()
      let wrapper = muta(obj)
      t.deepEqual(obj, wrapper)
      t.end()
    })
  }

  // for (let i = 0; i < 20; i++) {
  //   t.test(`wrapper value is equivalent to original array (${i})`, (t) => {
  //     let obj = values.array()
  //     let wrapper = muta(obj)
  //     t.deepEqual(obj, wrapper)
  //     t.end()
  //   })
  // }

  for (let i = 0; i < 40; i++) {
    t.test(`pre-commit wrapper = post-commit target (${i})`, (t) => {
      let obj = values.object()
      let wrapper = muta(obj)
      let mutationLog = []
      for (let i = 0; i < 20; i++) {
        mutationLog.push(randomMutation(wrapper))
      }
      let preCommit = clone(wrapper)
      muta.commit(wrapper)
      t.deepEqual(obj, preCommit)
      t.end()
    })
  }

  t.end()
})
