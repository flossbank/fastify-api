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

  async update ({ packageId, maintainers }) {
    return this.db.collection('packages').updateOne({
      _id: ObjectId(packageId)
    }, {
      $set: { maintainers }
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

  async refreshOwnership ({ packages, language, registry, userId }) {
    // find all the packages in the DB that either are marked as maintained by me,
    // or simply have the provided registry and a name that's in the list provided by the registry
    const existingPackages = await this.db.collection('packages').find({
      $or: [
        { name: { $in: packages } },
        { 'maintainers.userId': userId }
        // https://docs.mongodb.com/manual/tutorial/query-array-of-documents/#specify-a-query-condition-on-a-field-in-an-array-of-documents
      ],
      registry,
      language
    }).toArray()

    // of the packages already marked as maintained by me, whichever aren't in the list of
    // packages provided, remove my id from their maintainers list
    const packageDeletions = existingPackages
      .filter(pkg => !packages.includes(pkg.name))
      .map(pkg => ({
        criteria: { _id: pkg._id },
        update: {
          $pull: { maintainers: { userId } }
        }
      }))

    // of the packages provided, whichever aren't already in the db, create them and
    // push my id to their maintainers list
    const packageInsertions = packages
      .filter(pkg => !existingPackages.some((ePkg) => ePkg.name === pkg))
      .map(pkg => ({
        criteria: {
          name: pkg,
          registry,
          language
        },
        update: {
          $push: {
            maintainers: { userId, revenuePercent: 100 }
          }
        }
      }))

    // of the packages found in the DB, make sure I am marked as a maintainer
    // of the ones I maintain
    const packageUpdates = existingPackages
      .filter(pkg => !pkg.maintainers || !pkg.maintainers.some(m => m.userId === userId))
      .map(pkg => ({
        criteria: { _id: pkg._id },
        update: {
          $push: {
            maintainers: {
              userId,
              revenuePercent: 0
            }
          }
        }
      }))

    const bulkPackages = this.db.collection('packages').initializeUnorderedBulkOp()

    for (const insertion of packageInsertions) {
      bulkPackages.find(insertion.criteria).upsert().update(insertion.update)
    }
    for (const deletion of packageDeletions) {
      bulkPackages.find(deletion.criteria).update(deletion.update)
    }
    for (const update of packageUpdates) {
      bulkPackages.find(update.criteria).update(update.update)
    }

    // due to how the insertions/updates were done, there may be some packages that were upserted
    // or updated and have only one maintainer with 0 percent revenue share. to fix that, we'll
    // change those to 100%
    bulkPackages.find({
      registry,
      language,
      maintainers: { $size: 1 }
    }).update({
      $set: {
        'maintainers.$[].revenuePercent': 100
        // https://docs.mongodb.com/manual/reference/operator/update/positional-all/#up._S_[]
      }
    })

    return bulkPackages.execute()
  }

  async getOwnedPackages ({ userId, registry, language }) {
    const pkgs = await this.db.collection('packages').find({
      'maintainers.userId': userId,

      // optional qualifiers
      ...(registry && { registry }),
      ...(language && { language })
    }).toArray()

    return pkgs.map(({ _id: id, ...rest }) => ({ id: id.toString(), ...rest }))
  }
}

module.exports = PackageDbController
