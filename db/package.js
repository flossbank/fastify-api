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
    // This is also guarded by the API Schema, so it's not testable
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
    const hasMaintainers = !!maintainers.length
    const updateOp = hasMaintainers
      ? { $set: { hasMaintainers, maintainers } }
      : { $unset: { maintainers: '' }, $set: { hasMaintainers } }

    return this.db.collection('packages').updateOne({ _id: ObjectId(packageId) }, updateOp)
  }

  async getUserInstalledPackages ({ userId }) {
    const aggPipeline = [
      {
        $match: {
          'installs.userId': userId.toString()
        }
      }, {
        $project: {
          _id: 1,
          name: 1,
          language: 1,
          registry: 1,
          installs: {
            $filter: {
              input: '$installs',
              as: 'install',
              cond: {
                $eq: [
                  '$$install.userId', userId.toString()
                ]
              }
            }
          }
        }
      }, {
        $project: {
          _id: 1,
          name: 1,
          language: 1,
          registry: 1,
          installCount: {
            $size: '$installs'
          }
        }
      }
    ]
    const installedPackages = await this.db.collection('packages').aggregate(aggPipeline).toArray()

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

    const packagesUpdatedToOneMaintainer = []

    // of the packages already marked as maintained by me where my source is registry,
    // whichever aren't in the list of
    // packages provided, remove my id from their maintainers list
    const packageDeletions = existingPackages
      .filter(pkg => {
        const packagesNoLongerRegistryVerified = !packages.includes(pkg.name)
        const maintainerIsRegistryMaintainer = pkg.maintainers && pkg.maintainers.some(m => (m.userId === userId && m.source === packageOwnershipSourceEnum.REGISTRY))
        return packagesNoLongerRegistryVerified && maintainerIsRegistryMaintainer
      })
      .map(pkg => {
        // If there are strictly two maintainers, then when we delete one maintainer
        // we'll need to set the remaining 1 maintainer to rev share of 100%
        if (pkg.maintainers.length === 2) packagesUpdatedToOneMaintainer.push({ criteria: { _id: pkg._id } })
        if (pkg.maintainers.length === 1) {
          return {
            criteria: { _id: pkg._id },
            update: {
              $set: { hasMaintainers: false },
              $unset: { maintainers: '' }
            }
          }
        }
        return {
          criteria: { _id: pkg._id },
          update: {
            $pull: { maintainers: { userId } }
          }
        }
      })

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
          $set: {
            hasMaintainers: true
          },
          $push: {
            maintainers: {
              userId,
              revenuePercent: 100,
              source: packageOwnershipSourceEnum.REGISTRY
            }
          }
        }
      }))

    // For existing packages, if i exist in the maintainer list AND
    // this package is returned by my owned packages by the registry, but have a source "invite",
    // update the source to 'registry'
    const packageMaintainerSourceUpdates = existingPackages
      .filter(pkg => {
        // This is a situation where the registry comes back and says I _dont_ own this package anymore.
        // In this case, we dont want to set myself to be source registry, because that's not true.
        // I'm still source invite for some packages that my registry says I don't maintain. That's great,
        // we just need to filter out existing packages that the registry says I dont maintain anymore.
        /**
         * Example:
         *
         * existingPackages: [{
         *   name: 'saturn',
         *   maintainers: [{
         *     userId: me,
         *     source: 'invite'
         *   }]
         * }]
         * registry returned pkgs: []
         *
         * Expected packages after update: [{
         *   name: 'saturn',
         *   maintainers: [{
         *     userId: me,
         *     source: 'invite'
         *   }]
         * }]
         *
         * This block should _not_ remove me from maintaining "moon" OR set me to source registry.
         */
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
          $set: {
            hasMaintainers: true
          },
          $push: {
            maintainers: {
              userId,
              revenuePercent: (pkg.maintainers && pkg.maintainers.length) ? 0 : 100,
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
    for (const maintainerUpdate of packageMaintainerSourceUpdates) {
      bulkPackages.find(maintainerUpdate.criteria).update(maintainerUpdate.update)
    }

    // Need to update the packages we are deleting us from to see if there
    // is only one maintainer, in which case we need to set their rev to 100%
    if (packagesUpdatedToOneMaintainer.length) {
      const percentUpdateCall = {
        $set: {
          'maintainers.$[].revenuePercent': 100
          // https://docs.mongodb.com/manual/reference/operator/update/positional-all/#up._S_[]
        }
      }
      for (const percentUpdate of packagesUpdatedToOneMaintainer) {
        bulkPackages.find(percentUpdate.criteria).update(percentUpdateCall)
      }
    }

    // If no updates - bail
    if (!bulkPackages.length) return

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
