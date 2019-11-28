const auth = require('../../auth')

const logoutAdvertiser = async (sessionId) => {
  // Delete session Id from our advertiser session table
  await auth.deleteAdvertiserSession(sessionId)
  return { success: true }
}

module.exports = async (req, res) => {
  if (!req.cookies || !req.cookies.flossbank_a_sess_id) {
    return res.send()
  }
  try {
    res.send(await logoutAdvertiser(req.cookies.flossbank_a_sess_id))
  } catch (e) {
    console.error(e)
    res.status(500)
    res.send()
  }
}
