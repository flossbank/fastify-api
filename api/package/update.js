/*
 * Package should be a single package to update
 * String MaintainerId should be id of maintainer making request and owner of package
 *
 * This method is just to update maintainers or owner of the package
 */
const updatePackage = async (newPackage, maintainerId, db, client, ObjectID) => {
  // Only the owner can make a change to a package
  // Fetch package to check if maintainer making request is the owner
  const packageToBeUpdated = await db.collection('packages').findOne({
    _id: ObjectID(newPackage._id)
  })

  // If maintainer making request isn't owner, throw
  if (!packageToBeUpdated || packageToBeUpdated.owner !== maintainerId) {
    throw new Error('No package or non owner attempting to update package')
  }

  // Sanitize the package to insert
  const sanitizedPackage = {
    maintainers: newPackage.maintainers,
    owner: newPackage.owner
  }

  const session = client.startSession()
  // Open transaction to update package and maintainer rels for all maintainers
  await session.withTransaction(async () => {
    // Update package
    await db.collection('packages').updateOne({ _id: ObjectID(newPackage._id) }, { $set: { ...sanitizedPackage } })
    for (const submaintainerId of newPackage.maintainers) {
      // Find maintainer rels with maintainer id. if exists, do nothing
      const maintainerPackageRel = db.collection('packages').findOne({
        packageId: newPackage._id,
        maintainerId: submaintainerId
      })
      // If no rel, add new maintainer package rel with 0 percent revenue share
      if (!maintainerPackageRel) {
        await db.collection('maintainer_package_rel').insertOne({
          maintainerId: submaintainerId,
          packageId: newPackage._id,
          revenuePercent: 0
        })
      }
    }
  })

  // Return success if no errors
  return { success: true }
}

module.exports = async (req, res, fastify) => {
  try {
    if (!req.body.maintainerId || !req.body.package) {
      res.status(400)
      return res.send()
    }
    res.send(await updatePackage(req.body.package, req.body.maintainerId, fastify.mongo, fastify.mongoClient, fastify.mongoObjectID))
  } catch (e) {
    console.error(e)
    res.status(500)
    res.send()
  }
}
