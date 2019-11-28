const getAdvertiser = async (advertiserId, db, ObjectID) => {
  return db.collection('advertisers').findOne({ _id: ObjectID(advertiserId) })
}

module.exports = async (req, res, fastify) => {
  // Check required params
  if (!req.query.advertiserId) {
    res.status(400)
    return res.send()
  }
  try {
    res.send(await getAdvertiser(req.query.advertiserId, fastify.mongo, fastify.mongoObjectID))
  } catch (e) {
    console.error(e)
    res.status(500)
    res.send()
  }
}
