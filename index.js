'use strict'

const VirtualObject = require('./src/virtualObject.js')

module.exports = function muta (target) {
  let patch = new VirtualObject(target)
  return patch.wrapper()
}

module.exports.commit = function commit (wrapper) {
  let patch = wrapper[VirtualObject.PATCH]
  if (patch == null) {
    throw Error('Argument to commit must be a muta wrapped object')
  }
  patch.commit()
}
