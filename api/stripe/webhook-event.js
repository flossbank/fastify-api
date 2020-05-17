module.exports = async (req, res, ctx) => {
  try {
    const signature = req.headers['stripe-signature']
    if (!signature) {
      ctx.log.warn('Webhook requested without a stripe signature')
      res.status(403)
      return res.send()
    }
    const endpointSecret = ctx.config.getStripeWebhookSecret()
    let event
    try {
      event = await ctx.stripe.constructWebhookEvent(req.body, signature, endpointSecret)
    } catch (e) {
      res.status(403)
      return res.send()
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
        // Unexpected event type
        res.status(400)
        return res.send()
    }

    // Return a response to acknowledge receipt of the event, must do this quickly to ensure stripe
    // doesnt designate this request as a timeout https://stripe.com/docs/webhooks
    res.status(200)
    res.send({ received: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send()
  }
}
