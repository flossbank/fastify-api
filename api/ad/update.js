const valid = (req) => {
  // Assert that an advertiser is passed in with required params
  if (!req.body.ad) return false
  const ad = req.body.ad
  if (!ad.name || !ad.content) return false
  if (!ad.content.body || !ad.content.url || !ad.content.title) return false
  return true
}

/**
 * @param ad is the ad to update
 * @param db is the db instance
 * @param ObjectID is the mongo objectID function to construct an object id from a string
 */
const updateAds = async (ad, db, ObjectID) => {
  // Sanitize the ad to only allow update of certain fields
  const sanitizedAd = {
    name: ad.name,
    content: {
      body: ad.content.body,
      url: ad.content.url,
      title: ad.content.title
    }
  }
  await db.collection('ads').updateOne({ _id: ObjectID(ad._id) }, { $set: sanitizedAd })

  return { success: true }
}

module.exports = async (req, res, fastify) => {
  if (!valid(req)) {
    res.status(400)
    return res.send()
  }
  try {
    res.send(await updateAds(req.body.ad, fastify.mongo, fastify.mongoObjectID))
  } catch (e) {
    console.error(e)
    res.status(500)
    res.send()
  }
}
