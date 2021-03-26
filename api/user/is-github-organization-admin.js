const { MSGS: { INTERNAL_SERVER_ERROR, USER_IS_NOT_GITHUB_AUTHED } } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    const { orgId } = req.query
    ctx.log.info('fetching is github org admin for user %s and org %s', req.session.userId, orgId)
    const user = await ctx.db.user.get({ userId: req.session.userId })
    const organization = await ctx.db.organization.get({ orgId })

    if (!user || !organization) {
      ctx.log.info('user or org doesnt exist when fetching whether user is github org admin')
      res.status(404)
      return res.send({ success: false })
    }

    const { githubId } = user
    if (!githubId) {
      ctx.log.info('fetching is github-org-admin for a user that isnt associated with github')
      res.status(401)
      return res.send({ success: false, message: USER_IS_NOT_GITHUB_AUTHED })
    }

    if (!await ctx.github.isUserAnOrgAdmin({ userGitHubId: githubId, organization })) {
      return res.send({ success: true, isOrgAdmin: false })
    }

    res.send({ success: true, isOrgAdmin: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
