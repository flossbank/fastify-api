const { removeUndefinedKeyValues } = require('../../helpers/methods')

/* If there is no ad campaign or the advertiser id does not match the advertiser id of the ad campaign, return false */
const valid = async (req, db, ObjectID) => {
  if (!req.body.advertiserId || !req.body.adCampaignId) return false
  const adCampaign = await db.collection('adCampaigns').findOne({ _id: ObjectID(req.body.adCampaignId) })
  if (!adCampaign || (adCampaign.advertiserId !== req.body.advertiserId)) return false
  return true
}

const updateAdCampaign = async (body, db, ObjectID) => {
  const updateBodySchema = {
    name: body.name,
    ads: body.ads,
    maxSpend: body.maxSpend,
    cpm: body.cpm > 100 ? body.cpm : 100, // Min cpm is 100
    startDate: body.startDate,
    endDate: body.endDate
  }
  const updateBody = removeUndefinedKeyValues(updateBodySchema)
  await db.collection('adCampaigns').updateOne(
    { _id: ObjectID(body.advertiserId) },
    { $set: updateBody }
  )
  return { success: true }
}

module.exports = async (req, res, fastify) => {
  try {
    const isValid = await valid(req, fastify.mongo, fastify.mongoObjectID)
    if (!isValid) {
      res.status(400)
      return res.send()
    }
    res.send(await updateAdCampaign(req.body, fastify.mongo, fastify.mongoObjectID))
  } catch (e) {
    console.error(e)
    res.status(500)
    res.send()
  }
}
