const test = require('ava')
const { Registry } = require('../../registry')
const NpmRegistry = require('../../registry/npm')

test('registry | npm', (t) => {
  const registry = new Registry()
  t.true(registry.npm instanceof NpmRegistry)
})
