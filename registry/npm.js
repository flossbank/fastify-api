const gop = require('get-owned-packages')

function NpmRegistry () {}

NpmRegistry.prototype.getOwnedPackages = async function getOwnedPackages (token) {
  return gop.getOwnedPackages(token)
}

module.exports = NpmRegistry
