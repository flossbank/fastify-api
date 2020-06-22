const Schema = require('@flossbank/schema')

const stripeWebhooks = require('../api/stripe/webhook-event')

module.exports = async function routes (fastify, opts, done) {
  // treat JSON bodies as raw strings (the Stripe module will parse it as JSON)
  fastify.addContentTypeParser('application/json', { parseAs: 'string' }, (_, body, done) => {
    done(null, body)
  })
  fastify.post('/stripe/webhook/event', { schema: Schema.stripe.webhooks }, (req, res) => stripeWebhooks(req, res, fastify))
  done()
}
