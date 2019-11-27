const sanitizeAd = require('../../sanitize/adInput')

/* Validate payload. Returns boolean */
const valid = (req) => {
  // Assert that an advertiser is passed in with required params
  if (!req.body.ad) return false
  const ad = req.body.ad
  if (!ad.advertiserId || !ad.content || !ad.name) return false
  // Validate content
  if (!ad.content.body || !ad.content.url || !ad.content.title) return false

  return true
}

/* Ad should be a single ad to insert */
const createAds = async (ad, db) => {
  const sanitizedAd = sanitizeAd(ad)
  return db.collection('ads').insertOne(sanitizedAd)

}

module.exports = async (req, res, fastify) => {
  if (!valid(req)) {
    res.status(400)
    return res.send()
  }
  try {
    res.send(await createAds(req.body.ad, fastify.mongo))
  } catch (e) {
    console.error(e)
    res.status(500)
    res.send()
  }
}
