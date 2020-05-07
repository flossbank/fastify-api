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

  // Amount is in cents
  async createDonation (customerId, amount) {
    // Fetch all plans to see if we have one that matches the amount already
    const existingPlansRes = await this.stripe.plans.list()
    const plan = existingPlansRes.data.find(p => p.amount === amount) || await this.stripe.plans.create({
      amount: amount,
      interval: 'month',
      product: {
        name: `Flossbank user donation plan for $${amount / 100}`
      },
      currency: 'usd'
    })

    // Subscribe the customer to the plan
    await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ plan: plan.id }]
    })
  }
}

exports.Stripe = Stripe

exports.stripePlugin = (stripeLocal) => fastifyPlugin(async (fastify) => {
  fastify.decorate('stripe', stripeLocal)
})
