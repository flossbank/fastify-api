const auth = require('../../auth')

const logoutMaintainer = async (sessionId) => {
  // Delete session Id from our maintainer session table
  await auth.deleteMaintainerSession(sessionId)
  return { success: true }
}

module.exports = async (req, res) => {
  if (!req.cookies || !req.cookies.flossbank_m_sess_id) {
    return res.send()
  }
  try {
    res.send(await logoutMaintainer(req.cookies.flossbank_m_sess_id))
  } catch (e) {
    console.error(e)
    res.status(500)
    res.send()
  }
}
