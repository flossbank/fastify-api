module.exports = async (req, res, ctx) => {
  try {
    ctx.log.info(req.body, 'creating new url alias')
    res.send({
      success: true,
      url: await ctx.url.createUrl(req.body.url, req.session.advertiserId)
    })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
