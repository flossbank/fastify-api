const fetchRevenue = async (maintainerId, db) => {
  const packageRels = await db.collection('maintainer_package_rel').find({
    maintainerId
  }).toArray()

  return packageRels.reduce(async (sum, rel) => {
    if (!rel.packageId) return sum
    const packageMaintained = await db.collection('packages').findOne({
      _id: rel.packageId
    })

    return await sum + (packageMaintained.totalRevenue * (rel.revenuePercent / 100))
  }, 0)
}

module.exports = async (req, res, fastify) => {
  try {
    if (!req.query.maintainerId) {
      res.status(400)
      return res.send()
    }
    res.send(await fetchRevenue(req.query.maintainerId, fastify.mongo))
  } catch (e) {
    console.error(e)
    res.status(500)
    res.send()
  }
}
