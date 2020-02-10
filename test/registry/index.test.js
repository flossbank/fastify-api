const test = require('ava')
const { Registry } = require('../../registry')
const NpmRegistry = require('../../registry/npm')

test('registry | isSupported', (t) => {
  const registry = new Registry()
  t.false(registry.isSupported('fart'))
})

test('registry | npm', (t) => {
  const registry = new Registry()
  t.true(registry.npm instanceof NpmRegistry)
})
