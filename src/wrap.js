'use strict'

const VirtualObject = require('./virtualObject.js')

function wrap (target, patch) {
  if (!isWrappable(target)) {
    return target
  }

  // TODO: use VirtualArray for arrays
  let wrapper = new VirtualObject(target, patch)
  return wrapper.wrapper()
}

function isWrappable (value) {
  return (value != null) &&
    (typeof value === 'object') ||
    (typeof value === 'function')
}

module.exports = wrap
