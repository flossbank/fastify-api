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
          await ctx.sqs.sendDistributeUserDonationMessage({
            userId: userId.toString(),
            amount,
            description,
            timestamp: Date.now(),
            paymentSuccess: true
          })
        } else {
          // TODO look up organization ID from orgranization table
        }
        break
      }
      default:
        break
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
