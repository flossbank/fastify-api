const fastifyPlugin = require('fastify-plugin')

class Stripe {
  constructor ({ stripe, config }) {
    this.stripe = stripe
    this.config = config
  }

  init () {
    this.stripe = this.stripe(this.config.getStripeToken())
  }

  async createStripeCustomer (email) {
    return this.stripe.customers.create({
      email,
      metadata: { updatedAt: Date.now() }
    })
  }

  async updateStripeCustomer (customerId, sourceId) {
    return this.stripe.customers.update(customerId, {
      source: sourceId,
      metadata: { updatedAt: Date.now() }
    })
  }
}

exports.Stripe = Stripe

exports.stripePlugin = (stripeLocal) => fastifyPlugin(async (fastify) => {
  fastify.decorate('stripe', stripeLocal)
})
