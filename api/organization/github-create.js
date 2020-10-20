const { MSGS: { INTERNAL_SERVER_ERROR }, CODE_HOSTS } = require('../../helpers/constants')

/*
 * Authenticate with GitHub as the Flossbank GitHub App
 * Request organization information from GitHub using the provided installation ID
 * Create an organization in Mongo, and return it to the requester
 */
module.exports = async (req, res, ctx) => {
  try {
    // const { installationId } = req.body

    // TODO authenticate with GH
    // TODO get the org data from GH

    const organization = await ctx.db.organization.create({
      name: 'name goes here', // TODO populate
      host: CODE_HOSTS.GitHub,
      avatarUrl: 'avatar url goes here' // TODO populate
    })

    res.send({ success: true, organization })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
