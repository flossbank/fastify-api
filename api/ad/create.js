const sanitizeAd = require('../../sanitize/adInput')

/* Validate payload. Returns boolean */
const valid = (req) => {
  // Assert that an advertiser is passed in with required params
  if (!req.body.ads) return false
  for (const ad of req.body.ads) {
    if (!ad.advertiserId || !ad.content || !ad.maxImpressions || !ad.name) return false
    // Validate content
    if (!ad.content.body || !ad.content.url || !ad.content.title) return false
  }
  return true
}

/* Ads should be an array of ads to insert */
const createAds = async (ads, db) => {
  const sanitizedAds = ads.map(sanitizeAd)
  const insertedAds = await db.collection('ads').insertMany(sanitizedAds)
  return insertedAds.ops
}

module.exports = async (req, res, fastify) => {
  if (!valid(req)) {
    res.status(400)
    return res.send()
  }
  try {
    res.send(await createAds(req.body.ads, fastify.mongo))
  } catch (e) {
    console.error(e)
    res.status(500)
    res.send()
  }
}
