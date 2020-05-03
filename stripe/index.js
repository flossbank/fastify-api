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
    let plan

    // Fetch all plans to see if we have one that matches the amount already
    const existingPlansRes = await this.stripe.plans.list()
    const matchingPlan = existingPlansRes.data.filter(p => p.amount === amount)
    if (matchingPlan[0]) {
      plan = matchingPlan[0]
    } else {
      plan = await this.stripe.plans.create({
        amount: amount,
        interval: "month",
        product: {
          name: "Flossbank user donation"
        },
        currency: "usd",
      })
    }

    // Subscribe the customer to the plan
    await stripe.subscriptions.create({
      customer: customerId,
      items: [{ plan: plan.id }]
    })
  }
}

exports.Stripe = Stripe

exports.stripePlugin = (stripeLocal) => fastifyPlugin(async (fastify) => {
  fastify.decorate('stripe', stripeLocal)
})
