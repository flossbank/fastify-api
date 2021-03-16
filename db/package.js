const { ObjectId } = require('mongodb')

const packageOwnershipSourceEnum = {
  REGISTRY: 'registry',
  INVITE: 'invite'
}

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

  // Grab top ten donating orgs for a package
  async getSupportingCompanies ({ packageId }) {
    const pkg = await this.db.collection('packages').findOne({ _id: ObjectId(packageId) })
    if (!pkg || !pkg.donationRevenue) return []
    // Get top ten package supporters
    // @returns [[<org_id>, <donation_amount], [<org_id>, <donation_amount>]]
    const supportingCompanies = Object.entries(pkg.donationRevenue.reduce((acc, curr) => {
      if (!curr.organizationId) return acc
      if (acc[curr.organizationId]) {
        acc[curr.organizationId] += curr.amount
      } else {
        acc[curr.organizationId] = curr.amount
      }
      return acc
    }, {})).sort((a, b) => b[1] - a[1]).slice(0, 10)
    // Grab org names and id's from org db
    const companyIdsArray = supportingCompanies.reduce((acc, [orgId]) => acc.concat(ObjectId(orgId)), [])
    const companies = await this.db.collection('organizations').find({
      _id: {
        $in: companyIdsArray
      }
    }, {
      _id: 1,
      name: 1,
      avatarUrl: 1,
      publicallyGive: 1
    }).toArray()

    return supportingCompanies.map(([orgId, amount]) => {
      const company = companies.find((comp) => comp._id.toString() === orgId)
      // If a company doesnt exist or hasn't opted in to having their donations shown, return null
      if (!company || !company.publicallyGive) return null
      const { name, avatarUrl } = company
      return ({
        organizationId: orgId,
        contributionAmount: amount,
        name,
        avatarUrl
      })
    }).filter((c) => !!c) // filter out null
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
      $set: {
        ...(maintainers && { maintainers })
      }
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

    // of the packages already marked as maintained by me where my source is registry,
    // whichever aren't in the list of
    // packages provided, remove my id from their maintainers list
    const packageDeletions = existingPackages
      .filter(pkg => {
        const packagesNoLongerRegistryVerified = !packages.includes(pkg.name)
        const maintainerIsRegistryMaintainer = pkg.maintainers.some(m => (m.userId === userId && m.source === packageOwnershipSourceEnum.REGISTRY))
        return packagesNoLongerRegistryVerified && maintainerIsRegistryMaintainer
      })
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
            maintainers: {
              userId,
              revenuePercent: 100,
              source: packageOwnershipSourceEnum.REGISTRY
            }
          }
        }
      }))

    // For existing packages, if i exist in the maintainer list, but have a source "invite",
    // update the source to 'registry'
    const packageMaintainerUpdates = existingPackages
      .filter(pkg => {
        // IF now currently maintained packages doesn't include this old package, filter it out, we don't want
        // to update it in this loop, that's handled by the deletion block.
        if (!packages.includes(pkg.name)) return false
        // If maintainers don't exist on this package, skip, this will be handled by the
        // package updates function below
        if (!pkg.maintainers) return false
        return pkg.maintainers.some(m => (m.userId === userId && m.source === packageOwnershipSourceEnum.INVITE))
      })
      .map(pkg => ({
        criteria: { _id: pkg._id, 'maintainers.userId': userId },
        update: {
          $set: {
            'maintainers.$.source': packageOwnershipSourceEnum.REGISTRY
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
              revenuePercent: 0,
              source: packageOwnershipSourceEnum.REGISTRY
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
    for (const maintainerUpdate of packageMaintainerUpdates) {
      bulkPackages.find(maintainerUpdate.criteria).update(maintainerUpdate.update)
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
