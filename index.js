'use strict'

const VirtualObject = require('./src/virtualObject.js')
const { ASSIGN, DELETE } = VirtualObject

module.exports = function muta (target) {
  let patch = new VirtualObject(target)
  return patch.wrapper()
}

module.exports.commit = function commit (wrapper) {
  let patch = unwrap(wrapper)
  patch.commit()
}

module.exports.patch = function patch (wrapper) {
  let patch = unwrap(wrapper)
  return patch.patch
}

Object.assign(module.exports, {
  ASSIGN,
  DELETE
})

function unwrap (wrapper) {
  let patch = wrapper[VirtualObject.PATCH]
  if (patch == null) {
    throw Error('Argument must be a muta wrapped object')
  }
  return patch
}
