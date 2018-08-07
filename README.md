# muta

Virtually mutate data without cloning

This package lets you wrap an object and make mutations to it, while only keeping in memory the unmodified original object and the mutation "patch". The wrapper can be accessed as if the mutations had made to the original object, and the mutations can be eventually committed to the original object if desired.

It provides similar functionality to the [`jsondiffpatch`](https://github.com/benjamine/jsondiffpatch) module, although `muta` is more efficient for large objects since we build the patch as the data is mutated rather than diffing by iterating through all the keys.

## Usage
`npm install muta`

```js
let muta = require('muta')

let originalData = { foo: { bar: 123 } }

// `virtualData` appears to be the same as `originalData`,
// but changes you make to it don't affect `originalData`
let virtualData = muta(originalData)
virtualData.foo.bar += 1
console.log(originalData) // { foo: { bar: 123 } }
console.log(virtualData) // { foo: { bar: 124 } }

// if you want to apply the changes,
// call muta.commit on the muta wrapper
muta.commit(virtualData)
console.log(originalData) // { foo: { bar: 124 } }
```
