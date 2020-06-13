const { MSGS: { INTERNAL_SERVER_ERROR, INVALID_EVENT_SIG } } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    let event
    try {
      event = req.body
      // TODO: UNCOMMENT BEFORE RELEASE, WAITING ON NEXT FASTIFY RELEASE TO PASS IN RAWBODY
      // https://github.com/fastify/fastify/issues/707
      // event = await ctx.stripe.constructWebhookEvent({
      //   body: req.rawBody,
      //   signature: req.headers['stripe-signature']
      // })
    } catch (e) {
      res.status(403)
      return res.send({ success: false, message: INVALID_EVENT_SIG })
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object
        const amount = paymentIntent.amount
        const customerId = paymentIntent.customer.id
        const description = paymentIntent.description

        await ctx.sqs.sendDistributeDonationMessage({
          customerId,
          amount,
          description,
          timestamp: Date.now(),
          paymentSuccess: true
        })
        break
      }
      default:
    }

    // Return a response to acknowledge receipt of the event, must do this quickly to ensure stripe
    // doesnt designate this request as a timeout https://stripe.com/docs/webhooks
    res.send({ received: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
