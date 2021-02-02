const { ObjectId } = require('mongodb')

class MaintainerDbController {
  constructor ({ db }) {
    this.db = db
  }

  async getOwnedPackages ({ maintainerId }) {
    const pkgs = await this.db.collection('packages').find({
      owner: maintainerId
    }).toArray()

    return pkgs.map(({ _id: id, ...rest }) => ({ id, ...rest }))
  }

  async getRevenue ({ maintainerId }) {
    const packages = await this.db.collection('packages').find({
      maintainers: { $elemMatch: { maintainerId } }
    }).toArray()
    return packages.reduce((totalRevenue, pkg) => {
      const { revenuePercent } = pkg.maintainers.find((maintainer) => maintainer.maintainerId === maintainerId)
      return totalRevenue + (pkg.totalRevenue * (revenuePercent / 100))
    }, 0)
  }

  async updateIlpPointer ({ userId, ilpPointer }) {
    return this.db.collection('users').updateOne({
      _id: ObjectId(userId)
    }, {
      $set: { 'payoutInfo.ilpPointer': ilpPointer }
    })
  }
}

module.exports = MaintainerDbController
