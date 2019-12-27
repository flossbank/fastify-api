const { getOwnedPackages: gop } = require('get-owned-packages')

function NpmRegistry () {}

NpmRegistry.prototype.getOwnedPackages = async function getOwnedPackages (token) {
  return gop(token)
}

module.exports = NpmRegistry
