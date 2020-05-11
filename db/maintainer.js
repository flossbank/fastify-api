const bcrypt = require('bcrypt')
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

  async createMaintainer ({ maintainer }) {
    const maintainerWithDefaults = Object.assign({}, maintainer, {
      verified: false,
      active: true,
      password: await bcrypt.hash(maintainer.password, 10)
    })
    const { insertedId } = await this.db.collection('maintainers').insertOne(maintainerWithDefaults)
    return insertedId
  }

  async getMaintainer ({ maintainerId }) {
    const maintainer = await this.db.collection('maintainers')
      .findOne({ _id: ObjectId(maintainerId) })

    if (!maintainer) return maintainer

    const { _id: id, ...rest } = maintainer
    delete rest.password
    return { id, ...rest }
  }

  async getMaintainerByEmail ({ email }) {
    const maintainer = await this.db.collection('maintainers')
      .findOne({ email })

    if (!maintainer) return maintainer

    const { _id: id, ...rest } = maintainer
    delete rest.password
    return { id, ...rest }
  }

  async authenticateMaintainer ({ email, password }) {
    const foundMaintainer = await this.db.collection('maintainers').findOne({ email })
    if (!foundMaintainer) return null
    if (!foundMaintainer.verified) return null
    const passMatch = await bcrypt.compare(password, foundMaintainer.password)
    if (!passMatch) return null
    const { _id: id, ...rest } = foundMaintainer
    delete rest.password
    return { id, ...rest }
  }

  async verifyMaintainer ({ email }) {
    return this.db.collection('maintainers').updateOne({
      email
    }, {
      $set: { verified: true }
    })
  }

  async updateMaintainerPayoutInfo ({ maintainerId, payoutInfo }) {
    return this.db.collection('maintainers').updateOne({
      _id: ObjectId(maintainerId)
    }, {
      $set: { payoutInfo }
    })
  }
}

module.exports = MaintainerDbController
