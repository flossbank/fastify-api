const bcrypt = require('bcrypt')
const sanitizeMaintainer = require('../../sanitize/maintainerInput')

/* Validate payload. Returns boolean */
const valid = (req) => {
  // Assert that an maintainer is passed in with required params
  if (!req.body.maintainer) return false
  const { name, email, password } = req.body.maintainer
  return !!name && !!email && !!password
}

/* Maintainer should be an object of the maintainer to create */
const createMaintainer = async (maintainer, db) => {
  const encPassword = await bcrypt.hash(maintainer.password, 10)
  maintainer.password = encPassword
  const sanitizedMaintainer = sanitizeMaintainer(maintainer)
  const insertedMaintainer = await db.collection('maintainers').insertOne(sanitizedMaintainer)
  return { insertedId: insertedMaintainer.insertedId }
}

module.exports = async (req, res, fastify) => {
  // Check required params
  if (!valid(req)) {
    res.status(400)
    return res.send()
  }
  try {
    res.send(await createMaintainer(req.body.maintainer, fastify.mongo))
  } catch (e) {
    console.error(e)
    res.status(500)
    res.send()
  }
}
