const sanitizePackageInput = require('../../sanitize/packageInput')
const santizePackageMantainerRel = require('../../sanitize/packageMaintainerRelInput')

// Set of supported package managers
const validPackageManagers = new Set(['npm'])

// Map of package manager to token key
const packageManagerKeys = {
  npm: 'npmToken'
}

/** Insert newly discovered packages into our system */
const insertNewPackages = async (packagesToCreate, maintainerId, db, client) => {
  const session = client.startSession()

  let insertedPackages = []
  // Insert any packages we don't already have
  const sanitizedPackages = sanitizePackageInput(packagesToCreate, maintainerId)
  await session.withTransaction(async () => {
    insertedPackages = await db.collection('packages').insertMany(sanitizedPackages).toArray()
    const maintainerPackageRels = santizePackageMantainerRel(insertedPackages, maintainerId)
    await db.collection('maintainer_package_rel').insertMany(maintainerPackageRels).toArray()
  })
  return insertedPackages
}

/** Remove maintainer as the owner of packages they no longer own */
const removeOutdatedPackages = async (ownedPackages, maintainerId, db, ObjectID) => {
  const previouslyOwnedPackages = await db.collection('packages').find({
    owner: maintainerId
  }).toArray()

  // For each package they no longer own, remove them as owners
  for (const pkg of previouslyOwnedPackages) {
    // If no longer owned, updated the package with undefined as the owner
    if (!ownedPackages.includes(pkg.name)) {
      await db.collection('packages').updateOne({
        _id: ObjectID(pkg._id)
      }, { $set: { owner: undefined } })
    }
  }
}

/** Refresh existing packages with their new owner or create new packages */
const refreshExistingPackagesAndCreateNew = async (packages, maintainerId, db, client, ObjectID) => {
  // Loop through packages to determine which packages are _new_ and need to be created in our system,
  // also ensure that all found packages that are already in our system are actually owned by this maintainer,
  // and if not, update package to reflect owner in npm's system.
  const packagesToCreate = []

  for (let i = 0; i < packages.length; i++) {
    const pkgName = packages[i]
    const foundPackage = await db.collection('packages').findOne({
      name: pkgName
    })

    if (!foundPackage) packagesToCreate.push({ name: pkgName })

    // Check if the owner is this maintainerId, if not, then update the owner to this owner
    // I.e. syncing the truth of npm to be reflected in our DB and add owner as maintainer
    if (!foundPackage || foundPackage.owner === maintainerId) continue

    // Update the package to have the new owner as well as the new owner as a maintainer
    const maintainers = foundPackage.maintainers
    const newMaintainerAlreadyAMantainer = maintainers.includes(maintainerId)
    if (!newMaintainerAlreadyAMantainer) {
      maintainers.push(maintainerId)
    }
    await db.collection('packages').updateOne({
      _id: ObjectID(foundPackage._id)
    }, { $set: { owner: maintainerId, maintainers } })

    // And add a maintainerPackageRel if it didn't exist, and set rev percent to 0.
    if (!newMaintainerAlreadyAMantainer) {
      const maintainerPackageRel = {
        maintainerId,
        packageId: foundPackage._id,
        revenuePercent: 0
      }
      await db.collection('maintainer_package_rel').insertOne(maintainerPackageRel)
    }
  }

  // Bail early if no new packages to create
  if (!packagesToCreate.length) return []

  return insertNewPackages(packagesToCreate, maintainerId, db, client)
}

const fetchNpmPackages = async (token) => {
  const packages = [] // await getOwnedPackagesModule.getOwnedPackages(token)
  // Prepend npm to the name so packages with same name accross pkg managers dont conflict
  return packages.map((pkg) => `npm:${pkg}`)
}

/** Controller for which package manager to fetch packages from and update the maintainers stored tokens */
const fetchPackageManagerPackages = async (packageManager, maintainer) => {
  switch (packageManager) {
    case 'npm': {
      const packageToken = maintainer[packageManagerKeys.npm]
      return fetchNpmPackages(packageToken)
    }
    default:
      throw new Error('should never get passed validation if invalid package manager')
  }
}

/** Refresh packages for maintainer given a package manager token. */
const refreshPackages = async (maintainerId, packageManager, db, client, ObjectID) => {
  // Try to find token for maintainer
  const maintainer = await db.collection('maintainers').findOne({ _id: ObjectID(maintainerId) })

  // Dont reveal that the maintainer id is bad
  if (!maintainer) return { success: false, message: 'invalid params' }
  if (!maintainer[packageManagerKeys[packageManager]]) return { success: false, message: 'Invalid token' }

  const packages = await fetchPackageManagerPackages(packageManager, maintainer)

  if (!packages) return { success: false, message: 'failure to get packages' }

  // In turn, remove outdated packages from our system to sync with npm as well as update existing packages
  await removeOutdatedPackages(packages, maintainerId, db, ObjectID)
  return refreshExistingPackagesAndCreateNew(packages, maintainerId, db, client, ObjectID)
}

/** This endpoint will do the following:
 * 1) fetch all packages from the package manager given the stored token
 * 2) remove the requesting maintainer as an owner for any packages they no longer own
 * 3) make the requesting maintainer the new owner for any packages they are new owners for
 * 4) create any packages that aren't in our system but were returned from the package manager
 * 5) return any newly created packages
 */
module.exports = async (req, res, fastify) => {
  if (!req.body || !req.body.maintainerId || !req.body.packageManager) {
    res.status(400)
    return res.send()
  }
  // Only refresh packages for supported package manager
  if (!validPackageManagers.has(req.body.packageManager)) {
    res.status(400)
    return res.send()
  }
  try {
    res.send(await refreshPackages(req.body.maintainerId, req.body.packageManager, fastify.mongo, fastify.mongoClient, fastify.mongoObjectID))
  } catch (e) {
    console.error(e)
    res.status(500)
    res.send()
  }
}
