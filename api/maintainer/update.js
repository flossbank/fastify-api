/* Validate payload. Returns boolean */
const valid = (req) => {
  // Assert that an maintainer is passed in with at least one updating param
  if (!req.body.maintainer || !req.body.maintainer.payoutEmail) return false
  return !!req.body.maintainer._id
}

/* maintainer should be an object of the maintainer to update. Only allow update of payout email */
const updateMaintainer = async (maintainer, db, ObjectID) => {
  const sanitizedmaintainer = {
    payoutEmail: maintainer.payoutEmail
  }
  await db.collection('maintainers').updateOne({ _id: ObjectID(maintainer._id) }, { $set: sanitizedmaintainer })
  return { success: true }
}

module.exports = async (req, res, fastify) => {
  // Check required params
  if (!valid(req)) {
    res.status(400)
    return res.send()
  }
  try {
    res.send(await updateMaintainer(req.body.maintainer, fastify.mongo, fastify.mongoObjectID))
  } catch (e) {
    console.error(e)
    res.status(500)
    res.send()
  }
}
