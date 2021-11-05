const { MSGS: { INTERNAL_SERVER_ERROR }, CODE_HOSTS } = require('../../helpers/constants')
const ULID = require('ulid')

/*
 * Authenticate with GitHub as the Flossbank GitHub App
 * Request organization information from GitHub using the provided installation ID
 * Create an organization in Mongo, and return it to the requester
 */
module.exports = async (req, res, ctx) => {
  try {
    const { installationId } = req.body
    const existingOrg = await ctx.db.organization.getByInstallationId({ installationId })

    if (existingOrg) {
      return res.send({ success: true, organization: existingOrg })
    }

    let installationDetails
    try {
      installationDetails = await ctx.github.getInstallationDetails({ installationId })
    } catch (e) {
      if (e.response && e.response.statusCode === 404) {
        ctx.log.warn('Attempt to create GH organization with an invalid installation ID', installationId)
        return res.status(404).send({ success: false })
      }
      throw e
    }

    const { account } = installationDetails
    const { login: name, avatar_url: avatarUrl } = account

    const organization = await ctx.db.organization.create({
      name,
      installationId,
      host: CODE_HOSTS.GitHub,
      avatarUrl
    })

    try {
      // Trigger org distribution with 0 dollars so we get an OSS snapshot
      // First we need a correlation ID to write initial state to s3
      const correlationId = name.replace(' ', '_') + '_' + ULID.ulid()
      ctx.log.info(`Writing DoD initial state to S3 (${correlationId})`)
      const initialState = {
        organizationId: organization.id.toString(),
        amount: 0,
        timestamp: Date.now(),
        description: 'Initial distribution to get OSS snapshot'
      }
      await ctx.s3.writeDistributeOrgDonationInitialState(correlationId, initialState)

      ctx.log.info('Sending distribute org donations sqs message')
      await ctx.sqs.sendDistributeOrgDonationMessage({
        correlationId,
        organizationId: organization.id.toString()
      })
    } catch (e) {
      ctx.log.error(e)
    } finally {
      res.send({ success: true, organization })
    }
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
