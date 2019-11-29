const auth = require('../../auth')

module.exports = async (req, res) => {
  if (!req.body || !req.body.email) {
    res.status(400)
    return res.send()
  }
  try {
    await auth.sendUserToken(req.body.email, auth.authKinds.USER)
    res.send()
  } catch (e) {
    console.error(e)
    res.status(500)
    res.send()
  }
}
