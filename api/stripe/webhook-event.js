const { MSGS: { INTERNAL_SERVER_ERROR, INVALID_EVENT_SIG } } = require('../../helpers/constants')

module.exports = async (req, res, ctx) => {
  try {
    let event
    try {
      event = await ctx.stripe.constructWebhookEvent({
        body: req.body,
        signature: req.headers['stripe-signature']
      })
    } catch (e) {
      res.status(403)
      return res.send({ success: false, message: INVALID_EVENT_SIG })
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const {
          data: {
            object: {
              amount,
              description,
              customer
            }
          }
        } = event

        // determine if customerId is attached to a User or an Organization
        const userId = await ctx.db.user.getIdByCustomerId({ customerId: customer })
        if (userId) {
          ctx.log.info('Sending distribute user donations sqs message')
          await ctx.sqs.sendDistributeUserDonationMessage({
            userId: userId.toString(),
            amount: amount * 1000, // convert cents to millicents
            description,
            timestamp: Date.now(),
            paymentSuccess: true
          })
        } else {
          const organizationId = await ctx.db.organization.getIdByCustomerId({ customerId: customer })
          if (!organizationId) {
            throw new Error('Received a valid Stripe webhook event that contained a non-existant customer id')
          }
          ctx.log.info('Sending distribute org donations sqs message')

          await ctx.sqs.sendDistributeOrgDonationMessage({
            organizationId: organizationId.toString(),
            amount: amount * 1000, // convert cents to millicents,
            description,
            timestamp: Date.now(),
            paymentSuccess: true
          })
        }
        break
      }
      default:
        break
    }

    // Return a response to acknowledge receipt of the event, must do this quickly to ensure stripe
    // doesn't designate this request as a timeout https://stripe.com/docs/webhooks
    res.send({ received: true })
  } catch (e) {
    ctx.log.error(e)
    res.status(500)
    res.send({ success: false, message: INTERNAL_SERVER_ERROR })
  }
}
