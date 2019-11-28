const bcrypt = require('bcrypt')
const auth = require('../../auth')
const { maintainerSessionKey } = require('../../helpers/constants')

const loginMaintainer = async (body, db) => {
  const { email, password } = body
  const foundMaintainer = await db.collection('maintainers').findOne({ email })
  if (!foundMaintainer) return { success: false, message: 'Login failed; Invalid user ID or password' }
  if (!foundMaintainer.verified) return { success: false, message: 'Email address has not been verified' }
  const passMatch = await bcrypt.compare(password, foundMaintainer.password)
  if (!passMatch) return { success: false, message: 'Login failed; Invalid user ID or password' }

  // Create and store maintainer session token
  const sessionId = await auth.createMaintainerSession(email)
  return { success: true, sessionId }
}

module.exports = async (req, res, fastify) => {
  if (!req.body.email || !req.body.password) {
    res.status(400)
    return res.send()
  }
  try {
    const loginResult = await loginMaintainer(req.body, fastify.mongo)
    if (loginResult.success) { // Dont return session Id, just set cookie
      res.setCookie(maintainerSessionKey, loginResult.sessionId)
      return res.send({ success: true })
    }
    res.send(loginResult)
  } catch (e) {
    console.error(e)
    res.status(500)
    res.send()
  }
}
