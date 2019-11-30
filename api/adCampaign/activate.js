const valid = async (req, db, ObjectID) => {
  if (!req.body.advertiserId || !req.body.adCampaignId) {
    return { success: false, message: 'advertiserId and adCampaignId are required' }
  }

  const adCampaign = await db.collection('adCampaigns').findOne({ _id: ObjectID(req.body.adCampaignId) })
  if (!adCampaign || (adCampaign.advertiserId !== req.body.advertiserId)) {
    return { success: false, message: 'Invalid advertiser id for ad campaign' }
  }

  // validate ads
  const ads = await db.collection('ads').find({
    _id: { $in: adCampaign.ads.map(ObjectID) }
  }).toArray()
  if (!ads.every(ad => ad.approved)) {
    return {
      success: false,
      message: 'All ads in a campaign must be approved before activating'
    }
  }
  return { success: true }
}

const activateAdCampaign = async (body, fastify) => {
  const { mongoClient, mongo: db, mongoObjectID } = fastify
  const campaign = await db.collection('adCampaigns').findOne({
    _id: mongoObjectID(body.adCampaignId)
  })

  // activate ads and campaign in a transaction
  const session = mongoClient.startSession()
  try {
    await session.withTransaction(async () => {
      await db.collection('ads').updateMany({
        _id: { $in: campaign.ads.map(mongoObjectID) }
      }, {
        $set: { active: true }
      }, { session })
      await db.collection('adCampaigns').updateOne({
        _id: mongoObjectID(body.adCampaignId)
      }, {
        $set: { active: true }
      }, { session })
    })
  } catch (e) {
    console.error(e)
    return { success: false }
  } finally {
    await session.endSession()
  }
  return { success: true }
}

module.exports = async (req, res, fastify) => {
  try {
    const isValid = await valid(req, fastify.mongo, fastify.mongoObjectID)
    if (!isValid.success) {
      res.status(400)
      return res.send(isValid)
    }
    res.send(await activateAdCampaign(req.body, fastify))
  } catch (e) {
    console.error(e)
    res.status(500)
    res.send()
  }
}
