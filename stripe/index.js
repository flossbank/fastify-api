const fastifyPlugin = require('fastify-plugin')
const { config } = require('../config')
const stripe = require('stripe')(config.getStripeToken())

function Stripe () {}

Stripe.prototype.createStripeCustomer = async function createStripeCustomer (email) {
  return stripe.customers.create({
    email,
    metadata: { updatedAt: Date.now() }
  })
}

Stripe.prototype.updateStripeCustomer = async function updateStripeCustomer (customerId, sourceId) {
  return stripe.customers.update(customerId, {
    source: sourceId,
    metadata: { updatedAt: Date.now() }
  })
}

exports.Stripe = Stripe

exports.stripePlugin = (stripeLocal) => fastifyPlugin(async (fastify) => {
  fastify.decorate('stripe', stripeLocal)
})
