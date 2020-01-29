const { alreadyExistsMessage } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  const { maintainer } = req.body
  try {
    ctx.log.info(maintainer, 'registering new maintainer')
    let id
    try {
      id = await ctx.db.createMaintainer(maintainer)
    } catch (e) {
      if (e.code === 11000) { // Dupe key mongo error code is 11000
        ctx.log.warn('attempt to create maintainer with existing email, rejecting %s', maintainer.email)
        res.status(400)
        return res.send({
          success: false,
          message: alreadyExistsMessage
        })
      }
      throw e
    }
    ctx.log.info('sending registration email for newly registered maintainer %s', id)
    await ctx.auth.sendUserToken(maintainer.email, ctx.auth.authKinds.MAINTAINER)
    res.send({ success: true, id })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
