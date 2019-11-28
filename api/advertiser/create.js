const bcrypt = require('bcrypt')
const sanitizeAdvertiser = require('../../sanitize/advertiserInput')

/* Validate payload. Returns boolean */
const valid = (req) => {
  // Assert that an advertiser is passed in with required params
  if (!req.body.advertiser) return false
  const { name, email, password } = req.body.advertiser
  return !!name && !!email && !!password
}

/* Advertiser should be an object of the advertiser to create */
const createAdvertiser = async (advertiser, db) => {
  const encPassword = await bcrypt.hash(advertiser.password, 10)
  advertiser.password = encPassword
  const sanitizedAdvertiser = sanitizeAdvertiser(advertiser)
  const insertedAdvertiser = await db.collection('advertisers').insertOne(sanitizedAdvertiser)
  return { insertedId: insertedAdvertiser.insertedId }
}

module.exports = async (req, res, fastify) => {
  // Check required params
  if (!valid(req)) {
    res.status(400)
    return res.send()
  }
  try {
    res.send(await createAdvertiser(req.body.advertiser, fastify.mongo))
  } catch (e) {
    console.error(e)
    res.status(500)
    res.send()
  }
}
