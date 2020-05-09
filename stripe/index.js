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
    const plan = await this.findOrCreatePlan(amount)

    // Subscribe the customer to the plan
    await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ plan: plan.id }]
    })
  }

  // Amount is in cents
  async updateDonation (customerId, amount) {
    const plan = await this.findOrCreatePlan(amount)
    const customer = await this.stripe.customers.retrieve(customerId)
    const currentSubscription = customer.subscriptions.data[0]

    if (!currentSubscription) {
      return this.createDonation(customerId, amount)
    }

    // Update the customers subscription to whichever plans
    await this.stripe.subscriptions.update(currentSubscription.id, {
      items: [{ plan: plan.id }]
    })
  }

  // Amount is in cents
  async findOrCreatePlan (amount) {
    // Fetch all plans to see if we have one that matches the amount already
    const existingPlansRes = await this.stripe.plans.list()
    return existingPlansRes.data.find(p => p.amount === amount) || this.stripe.plans.create({
      amount: amount,
      interval: 'month',
      product: {
        name: `Flossbank user donation plan for $${amount / 100}`
      },
      currency: 'usd'
    })
  }
}

exports.Stripe = Stripe

exports.stripePlugin = (stripeLocal) => fastifyPlugin(async (fastify) => {
  fastify.decorate('stripe', stripeLocal)
})
