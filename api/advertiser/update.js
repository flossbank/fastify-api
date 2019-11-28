const { removeUndefinedKeyValues } = require('../../helpers/methods')

/* Validate payload. Returns boolean */
const valid = (req) => {
  // Assert that an advertiser is passed in with at least one updating param
  if (!req.body.advertiser) return false
  return !!req.body.advertiser._id
}

/* Advertiser should be an object of the advertiser to update */
const updateAdvertiser = async (advertiser, db, ObjectID) => {
  const updateAdvertiserSchema = {
    organization: advertiser.organization,
    adCampaigns: advertiser.adCampaigns,
    billingInfo: advertiser.billingInfo
  }
  const updateBody = removeUndefinedKeyValues(updateAdvertiserSchema)
  await db.collection('advertisers').updateOne({ _id: ObjectID(advertiser._id) }, { $set: updateBody })
  return { success: true }
}

module.exports = async (req, res, fastify) => {
  // Check required params
  if (!valid(req)) {
    res.status(400)
    return res.send()
  }
  try {
    res.send(await updateAdvertiser(req.body.advertiser, fastify.mongo, fastify.mongoObjectID))
  } catch (e) {
    console.error(e)
    res.status(500)
    res.send()
  }
}
