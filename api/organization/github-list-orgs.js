const { MSGS: { INTERNAL_SERVER_ERROR }, CODE_HOSTS } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    ctx.log.info('fetching github list orgs for %s', req.session.userId)

    /**
     * - look up user from cookie and grab GH access token
     * - request orgs from gh using the access token
     * - return list of orgs that were found via the access token
     */

    const user = await ctx.db.user.get({ userId: req.session.userId })
    const { GitHub } = user.codeHost
    const { accessToken } = GitHub
    const { orgsData } = await ctx.github.getUserOrgs({ accessToken })

    res.send({ success: true, organizations: orgsData.map((org) => ({ name: org.login, host: CODE_HOSTS.GitHub })) })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
