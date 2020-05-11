const { ObjectId } = require('mongodb')

class PackageDbController {
  constructor ({ db }) {
    this.db = db
  }

  async createPackage ({ pkg }) {
    const { insertedId } = await this.db.collection('packages').insertOne(pkg)
    return insertedId
  }

  async getPackage ({ packageId }) {
    const pkg = await this.db.collection('packages').findOne({
      _id: ObjectId(packageId)
    })

    if (!pkg) return pkg

    const { _id: id, ...rest } = pkg
    return { id, ...rest }
  }

  async getPackageByName ({ name, registry }) {
    const pkg = await this.db.collection('packages').findOne({
      name, registry
    })

    if (!pkg) return pkg

    const { _id: id, ...rest } = pkg
    return { id, ...rest }
  }

  async updatePackage ({ packageId, maintainers, owner }) {
    return this.db.collection('packages').updateOne({
      _id: ObjectId(packageId)
    }, {
      $set: { maintainers, owner }
    })
  }

  async refreshPackageOwnership ({ packages, registry, maintainerId }) {
    const existingPackages = await this.db.collection('packages').find({
      $or: [
        { name: { $in: packages } },
        { owner: maintainerId }
      ],
      registry
    }).toArray()

    const packageDeletions = existingPackages
      .filter(pkg => !packages.includes(pkg.name))
      .map(pkg => ({
        criteria: { name: pkg.name, registry },
        update: {
          $set: { owner: null },
          $pull: { maintainers: { maintainerId } }
        }
      }))
    const packageInsertions = packages
      .filter(pkg => !existingPackages.some((ePkg) => ePkg.name === pkg))
      .map(pkg => ({
        name: pkg,
        registry,
        owner: maintainerId,
        maintainers: [{ maintainerId, revenuePercent: 100 }]
      }))
    const packageUpdates = existingPackages
      .filter(pkg => pkg.owner !== maintainerId)
      .map(pkg => {
        const alreadyMaintains = pkg.maintainers.some(maintainer => maintainer.maintainerId === maintainerId)
        return {
          criteria: { name: pkg.name, registry },
          update: {
            $set: {
              owner: maintainerId,
              maintainers: alreadyMaintains
                ? pkg.maintainers
                : pkg.maintainers.concat([{ maintainerId, revenuePercent: 0 }])
            }
          }
        }
      })
    const bulkPackages = this.db.collection('packages').initializeUnorderedBulkOp()

    for (const insertion of packageInsertions) {
      bulkPackages.insert(insertion)
    }
    for (const update of packageUpdates) {
      bulkPackages.find(update.criteria).update(update.update)
    }
    for (const deletion of packageDeletions) {
      bulkPackages.find(deletion.criteria).update(deletion.update)
    }

    return bulkPackages.execute()
  }
}

module.exports = PackageDbController
