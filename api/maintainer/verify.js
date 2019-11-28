const auth = require('../../auth')

// First check that the user token is valid
const valid = async (query) => {
  if (!query.email || !query.token) return false
  const { email, token } = query
  return auth.validateUserToken(email, token, auth.authKinds.MAINTAINER)
}

// Update verified field for maintainer
const verifyMaintainer = async (query, db) => {
  const { email } = query
  await db.collection('maintainers').updateOne({ email }, { $set: { verified: true } })
  return { success: true }
}

module.exports = async (req, res, fastify) => {
  try {
    const authValid = await valid(req.query)
    if (!authValid) {
      res.status(400)
      return res.send()
    }
    res.send(await verifyMaintainer(req.query, fastify.mongo))
  } catch (e) {
    console.error(e)
    res.status(500)
    res.send()
  }
}
