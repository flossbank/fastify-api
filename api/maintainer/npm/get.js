const getOwnedPackages = require('get-owned-packages')

module.exports = async (req, res) => {
  try {
    const token = req.query.token || ''
    const packages = await getOwnedPackages(token)
    // TODO restrict access to only our frontend
    res.header('Access-Control-Allow-Origin', '*')
    res.send(packages)
  } catch (e) {
    console.error(e)
    res.status(500)
    res.send()
  }
}
