const { ObjectId } = require('mongodb')

class PackageDbController {
  constructor ({ db }) {
    this.db = db
  }

  async create ({ name, registry, avatarUrl, language }) {
    const newPackage = {
      name,
      registry,
      avatarUrl,
      language
    }
    const { insertedId } = await this.db.collection('packages').insertOne(newPackage)
    return { id: insertedId, ...newPackage }
  }

  // DO NOT CALL THIS IN ANY ROUTES, THIS IS FOR TEST MOCKING ONLY
  async updatePackageInternalDANGER ({ id, installs, adRevenue, donationRevenue }) {
    const updateObject = {}
    if (installs) updateObject.installs = installs
    if (adRevenue) updateObject.adRevenue = adRevenue
    if (donationRevenue) updateObject.donationRevenue = donationRevenue

    return this.db.collection('packages').updateOne({
      _id: ObjectId(id)
    }, {
      $set: updateObject
    })
  }

  async get ({ packageId }) {
    const pkg = await this.db.collection('packages').findOne({
      _id: ObjectId(packageId)
    })

    if (!pkg) return pkg

    const { _id: id, ...rest } = pkg
    return { id, ...rest }
  }

  async searchByName ({ name }) {
    // only allow alphanumeric characters and hyphens
    const safeName = name.replace(/[^a-z0-9-]/gi, '')
    if (!safeName) return [] // handle case where all the characters were dangerous

    const partialNameMatch = new RegExp(`.*${safeName}.*`, 'i')
    const packages = await this.db.collection('packages').find({
      name: partialNameMatch
      // TODO there may be cases where a package does not want to appear
      // in search results; if so, we can add a flag to their profiles in
      // the DB and filter it out here
    }, {
      limit: 10,
      projection: {
        _id: 1,
        name: 1,
        language: 1,
        registry: 1,
        avatarUrl: 1
      }
    }).toArray()

    return packages.map(({ _id, ...rest }) => ({ id: _id, ...rest }))
  }

  async getByNameAndRegistry ({ name, registry }) {
    const pkg = await this.db.collection('packages').findOne({
      name, registry
    })

    if (!pkg) return pkg

    const { _id: id, ...rest } = pkg
    return { id, ...rest }
  }

  async update ({ packageId, maintainers, owner }) {
    return this.db.collection('packages').updateOne({
      _id: ObjectId(packageId)
    }, {
      $set: { maintainers, owner }
    })
  }

  async getUserInstalledPackages ({ userId }) {
    const installedPackages = await this.db.collection('packages').aggregate([
      {
        $match: { 'installs.userId': userId.toString() }
      }, {
        $unwind: { path: '$installs' }
      }, {
        $match: { 'installs.userId': userId.toString() }
      }, {
        $group: {
          _id: '$_id',
          name: { $first: '$name' },
          language: { $first: '$language' },
          registry: { $first: '$registry' },
          installCount: { $sum: 1 }
        }
      }, {
        $project: {
          _id: 0,
          name: 1,
          language: 1,
          registry: 1,
          installCount: 1
        }
      }
    ]).toArray()

    return installedPackages
  }

  async refreshOwnership ({ packages, registry, maintainerId }) {
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
