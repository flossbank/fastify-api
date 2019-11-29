const auth = require('../../auth')

module.exports = async (req, res) => {
  if (!req.body || !req.body.token || !req.body.email || !req.body.kind) {
    res.status(400)
    return res.send()
  }
  try {
    const valid = await auth.validateUserToken(req.body.email, req.body.token, req.body.kind)
    res.send({ valid })
  } catch (e) {
    console.error(e)
    res.status(500)
    res.send()
  }
}
