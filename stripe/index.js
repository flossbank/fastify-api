const fastifyPlugin = require('fastify-plugin')
const { config } = require('../config')
const stripe = require('stripe')(config.getStripeToken())

function Stripe () {
  this.stripe = stripe
}

Stripe.prototype.createStripeCustomer = async function createStripeCustomer (email) {
  return this.stripe.customers.create({
    email,
    metadata: { updatedAt: Date.now() }
  })
}

Stripe.prototype.updateStripeCustomer = async function updateStripeCustomer (customerId, sourceId) {
  return this.stripe.customers.update(customerId, {
    source: sourceId,
    metadata: { updatedAt: Date.now() }
  })
}

exports.Stripe = Stripe

exports.stripePlugin = (stripeLocal) => fastifyPlugin(async (fastify) => {
  fastify.decorate('stripe', stripeLocal)
})
