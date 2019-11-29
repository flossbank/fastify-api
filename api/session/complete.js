const auth = require('../../auth')
const sqs = require('../../sqs')

async function enqueueSession (seen, sessionId) {
  return sqs.sendMessage({ seen, sessionId, timestamp: Date.now() })
}

module.exports = async (req, res) => {
  if (!await auth.isRequestAllowed(req)) {
    res.status(401)
    return res.send()
  }
  if (!req.body) {
    res.status(400)
    return res.send()
  }
  const { seen, sessionId } = req.body
  // both a seen array and a session Id are needed to properly close out a session
  if (!seen || !sessionId) {
    res.status(400)
    return res.send()
  }
  try {
    await enqueueSession(seen, sessionId)
    res.status(200)
    res.send()
  } catch (e) {
    console.error(e)
    res.status(500)
    res.send()
  }
}
