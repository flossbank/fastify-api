const fetchOwnedPackages = async (maintainerId, db) => {
  return db.collection('packages').find({
    owner: maintainerId
  }).toArray()
}

module.exports = async (req, res, fastify) => {
  try {
    if (!req.query.maintainerId) {
      res.status(400)
      return res.send()
    }
    res.send(await fetchOwnedPackages(req.query.maintainerId, fastify.mongo))
  } catch (e) {
    console.error(e)
    res.status(500)
    res.send()
  }
}
