const { alreadyExistsMessage } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  const { advertiser } = req.body
  try {
    ctx.log.info(advertiser, 'registering new advertiser')
    let id
    try {
      id = await ctx.db.createAdvertiser(advertiser)
    } catch (e) {
      if (e.code === 11000) { // Dupe key mongo error code is 11000
        ctx.log.warn('attempt to create advertiser with existing email, rejecting')
        res.status(400)
        return res.send({
          success: false,
          message: alreadyExistsMessage
        })
      }
      throw e
    }
    ctx.log.info('sending registration email for newly registered advertiser %s', id)
    await ctx.auth.sendUserToken(advertiser.email, ctx.auth.authKinds.ADVERTISER)
    res.send({ success: true, id })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
