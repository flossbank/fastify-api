// const { MSGS: { INTERNAL_SERVER_ERROR }, CODE_HOSTS, ORG_ROLES } = require('../../helpers/constants')

// module.exports = async (req, res, ctx) => {
//   try {
//     ctx.log.info('fetching github list orgs for %s', req.session.userId)

//     /**
//      * - look up user from cookie and grab GH access token
//      * - request orgs from gh using the access token
//      * - return list of orgs that were found via the access token
//      */

//     const user = await ctx.db.user.get({ userId: req.session.userId })
//     const { GitHub } = user.codeHost
//     const { accessToken } = GitHub
//     const { orgsData } = await ctx.github.getUserOrgs({ accessToken })
//     const orgsMap = orgsData.map((org) => ({
//       name: org.login,
//       host: CODE_HOSTS.GitHub,
//       avatarUrl: org.avatar_url
//     }))

//     const orgsMapWithIdPromises = orgsMap.map(async ({ name, host, avatarUrl }) => {
//       let org = await ctx.db.organization.getByNameAndHost({ name, host })
//       if (!org) {
//         org = await ctx.db.organization.create({ name, host, userId: user.id.toString(), email: user.email })
//       }

//       // If the user hasn't been associated with the org yet, then associate them now
//       if (!user.organizations || !user.organizations.find((org) => org.orgId)) {
//         await ctx.db.user.associateOrgWithUser({
//           orgId: org.id.toString(),
//           userId: user.id.toString(),
//           role: ORG_ROLES.WRITE
//         })
//       }

//       return {
//         name,
//         host,
//         avatarUrl,
//         id: org.id.toString()
//       }
//     })

//     const orgsMapWithId = await Promise.all(orgsMapWithIdPromises)

//     res.send({ success: true, organizations: orgsMapWithId })
//   } catch (e) {
//     ctx.log.error(e)
//     res.status(500)
//     res.send({ success: false, message: INTERNAL_SERVER_ERROR })
//   }
// }
