const test = require('ava')
const sinon = require('sinon')
const gop = require('get-owned-packages')
const NpmRegistry = require('../../registry/npm')

test.before(() => {
  sinon.stub(gop, 'getOwnedPackages').resolves(['js-deep-equals'])
})

test.after.always(() => {
  gop.getOwnedPackages.restore()
})

test('npm registry | get owned pkgs', async (t) => {
  const npm = new NpmRegistry()
  t.deepEqual(await npm.getOwnedPackages(), ['js-deep-equals'])
})
