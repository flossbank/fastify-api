/* Validate payload. Returns boolean */
const valid = async (req, db, ObjectID) => {
  if (!req.body.advertiserId || !req.body.ads || !req.body.maxSpend || !req.body.cpm || !req.body.name) return false
  const advertiser = db.collection('advertisers').findOne({ _id: ObjectID(req.body.advertiserId) })
  if (!advertiser) return false
  return true
}

const createAdCampaign = async (body, db) => {
  const adCampaign = {
    name: body.name,
    advertiserId: body.advertiserId,
    ads: body.ads,
    maxSpend: body.maxSpend,
    cpm: body.cpm > 100 ? body.cpm : 100, // Min cpm is 100
    createDate: Date.now(),
    active: false,
    spend: 0
  }
  const insertedAdCampaign = await db.collection('adCampaigns').insertOne(adCampaign)
  return { insertedId: insertedAdCampaign.insertedId }
}

module.exports = async (req, res, fastify) => {
  try {
    const isValid = await valid(req, fastify.mongo, fastify.mongoObjectID)
    if (!isValid) {
      res.status(400)
      return res.send()
    }
    res.send(await createAdCampaign(req.body, fastify.mongo))
  } catch (e) {
    console.error(e)
    res.status(500)
    res.send()
  }
}
