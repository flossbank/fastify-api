const bcrypt = require('bcrypt')
const auth = require('../../auth')

const registerMaintainer = async (body, db) => {
  const { email, password, name } = body
  const encPassword = await bcrypt.hash(password, 10)
  const maintainer = {
    name,
    email,
    password: encPassword,
    verified: false
  }
  await db.collection('maintainers').insertOne(maintainer)
  await auth.sendUserToken(email, auth.authKinds.MAINTAINER)
  return { success: true }
}

module.exports = async (req, res, fastify) => {
  if (!req.body.email || !req.body.password || !req.body.name) {
    res.status(400)
    return res.send()
  }
  // TODO: validate email against regex
  try {
    res.send(await registerMaintainer(req.body, fastify.mongo))
  } catch (e) {
    console.error(e)
    res.status(500)
    res.send()
  }
}
