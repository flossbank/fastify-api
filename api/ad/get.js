const sanitizeAds = require('../../sanitize/adOutput')
const auth = require('../../auth')

const VALID_PACKAGE_MANAGERS = new Set(['npm', 'yarn'])

const fetchAdBatch = async (db) => {
  const ads = await db.collection('ads').find({
    $expr: {
      $lt: [{ $size: '$impressions' }, '$maxImpressions']
    }
  }).limit(12).toArray()
  return sanitizeAds(ads)
}

module.exports = async (req, res, fastify) => {
  // TODO use req as context for ad retrieval (phase 2)
  if (!await auth.isRequestAllowed(req)) {
    res.status(401)
    return res.send()
  }
  if (!req.body || !req.body.packages || !req.body.packageManager) {
    res.status(400)
    return res.send()
  }
  if (!VALID_PACKAGE_MANAGERS.has(req.body.packageManager)) {
    res.status(400)
    return res.send()
  }
  try {
    const ads = await fetchAdBatch(fastify.mongo)
    const sessionId = (req.body && req.body.sessionId) || await auth.createAdSession(req)
    res.send({ ads, sessionId })
  } catch (e) {
    console.error(e)
    res.status(500)
    res.send()
  }
}
