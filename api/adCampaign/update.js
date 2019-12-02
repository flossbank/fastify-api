const { removeUndefinedKeyValues } = require('../../helpers/methods')

/* If there is no ad campaign or the advertiser id does not match the advertiser id of the ad campaign, return false */
const valid = async (req, db, ObjectID) => {
  if (!req.body.advertiserId || !req.body.adCampaignId) return false
  const adCampaign = await db.collection('adCampaigns').findOne({ _id: ObjectID(req.body.adCampaignId) })
  if (!adCampaign || (adCampaign.advertiserId !== req.body.advertiserId)) return false
  if (!await validateCampaignAds(req, db, ObjectID)) return false
  return true
}

const validateCampaignAds = async (req, db, ObjectID) => {
  if (!req.body.ads || !Array.isArray(req.body.ads) || !req.body.ads.length) {
    // valid to not update ads or update it with empty list
    return true
  }
  // all ads in a campaign must be owned by the campaign advertiser
  const dbAds = await db.collection('ads').find({
    _id: { $in: req.body.ads.map(ObjectID) }
  }).toArray()
  return dbAds.every(ad => ad.advertiserId === req.body.advertiserId)
}

const updateAdCampaign = async (body, db, ObjectID) => {
  let cpm
  if (typeof body.cpm === 'undefined' || body.cpm > 100) {
    cpm = body.cpm // undefined or bigger than our min of 100
  } else {
    cpm = 100
  }
  const updateBodySchema = {
    name: body.name,
    ads: body.ads,
    maxSpend: body.maxSpend,
    cpm,
    startDate: body.startDate,
    endDate: body.endDate
  }
  const updateBody = removeUndefinedKeyValues(updateBodySchema)
  await db.collection('adCampaigns').updateOne({
    _id: ObjectID(body.adCampaignId)
  }, {
    $set: updateBody
  })
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
