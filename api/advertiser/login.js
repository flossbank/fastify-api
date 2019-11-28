const bcrypt = require('bcrypt')
const auth = require('../../auth')
const { advertiserSessionKey } = require('../../helpers/constants')

const loginAdvertiser = async (body, db) => {
  const { email, password } = body
  const foundAdvertiser = await db.collection('advertisers').findOne({ email })
  if (!foundAdvertiser) return { success: false, message: 'Login failed; Invalid user ID or password' }
  if (!foundAdvertiser.verified) return { success: false, message: 'Email address has not been verified' }
  const passMatch = await bcrypt.compare(password, foundAdvertiser.password)
  if (!passMatch) return { success: false, message: 'Login failed; Invalid user ID or password' }

  // Create and store advertiser session token
  const sessionId = await auth.createAdvertiserSession(email)
  return { success: true, sessionId }
}

module.exports = async (req, res, fastify) => {
  if (!req.body.email || !req.body.password) {
    res.status(400)
    return res.send()
  }
  try {
    const loginResult = await loginAdvertiser(req.body, fastify.mongo)
    if (loginResult.success) { // Dont return session Id, just set cookie
      res.setCookie(advertiserSessionKey, loginResult.sessionId)
      return res.send({ success: true })
    }
    res.send(loginResult)
  } catch (e) {
    console.error(e)
    res.status(500)
    res.send()
  }
}
