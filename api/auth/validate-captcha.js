const auth = require('../../auth')

module.exports = async (req, res) => {
  if (!req.body || !req.body.token || !req.body.email || !req.body.response) {
    res.status(400)
    return res.send()
  }
  try {
    const { email, token, response } = req.body
    const apiKey = await auth.validateCaptcha(email, token, response)
    if (!apiKey) {
      res.status(401)
      return res.send()
    }
    res.send({ apiKey })
  } catch (e) {
    console.error(e)
    res.status(500)
    res.send()
  }
}
