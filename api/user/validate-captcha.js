module.exports = async (req, res, ctx) => {
  try {
    const { email, token, response } = req.body

    ctx.log.info('validating captcha for %s', email)

    if (!await ctx.auth.validateCaptcha(email, token, response)) {
      ctx.log.warn('attempt to validate captcha with invalid email, token, or response from %s', email)
      res.status(401)
      return res.send()
    }

    const apiKey = await ctx.auth.getOrCreateApiKey(email)
    const existingUser = await ctx.db.getUser(email)

    if (!existingUser) {
      ctx.log.info('registering a new user with email %s', email)
      const stripeCustomer = await ctx.stripe.createStripeCustomer(email)
      const billingInfo = {
        customerId: stripeCustomer.id,
        cardOnFile: false
      }
      await ctx.db.createUser({ email, apiKey, billingInfo })
    }

    res.send({ success: true, apiKey })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
