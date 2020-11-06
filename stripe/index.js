const fastifyPlugin = require('fastify-plugin')

class Stripe {
  constructor ({ stripe, config }) {
    this.stripe = stripe
    this.config = config
  }

  init () {
    this.stripe = this.stripe(this.config.getStripeToken())
  }

  async createStripeCustomer ({ email }) {
    return this.stripe.customers.create({
      email,
      metadata: { updatedAt: Date.now() }
    })
  }

  async getStripeCustomer ({ customerId }) {
    return this.stripe.customers.retrieve(customerId)
  }

  async getStripeCustomerDonationInfo ({ customerId }) {
    const customer = await this.getStripeCustomer({ customerId })
    return {
      amount: customer.subscriptions.data[0].plan.amount,
      // Stripe gives us subscription period end in seconds for some reason
      renewal: customer.subscriptions.data[0].current_period_end * 1000,
      last4: customer.sources.data[0].last4
    }
  }

  async getStripeCustomerAllTransactions ({ customerId }) {
    const transactions = await this.requestStripeCustomerTransactions({ customerId })
    const charges = transactions.data
    let hasMore = transactions.has_more
    // If there's more, continue fetching them with the using the "startingAfter" param
    // The starting after param takes in the id of the last object returned in the previous request
    while (hasMore) {
      const nextTransactions = await this.requestStripeCustomerTransactions({
        customerId,
        startingAfter: charges[charges.length - 1].id
      })
      hasMore = nextTransactions.has_more
      charges.push(...nextTransactions.data)
    }
    return charges
  }

  async requestStripeCustomerTransactions ({ customerId, startingAfter }) {
    return this.stripe.charges.list({
      customer: customerId,
      limit: 100,
      startingAfter
    })
  }

  async updateStripeCustomer ({ customerId, sourceId }) {
    return this.stripe.customers.update(customerId, {
      source: sourceId,
      metadata: { updatedAt: Date.now() }
    })
  }

  async constructWebhookEvent ({ body, signature }) {
    const secret = this.config.getStripeWebhookSecret()
    if (!body || !signature || !secret) {
      throw new Error('Invalid webhook params')
    }
    return this.stripe.webhooks.constructEvent(body, signature, secret)
  }

  // Amount is in cents
  async createDonation ({ customerId, amount }) {
    const plan = await this.findOrCreatePlan({ amount })

    // Subscribe the customer to the plan
    await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ plan: plan.id }]
    })
  }

  // Amount is in cents
  async updateDonation ({ customerId, amount }) {
    const plan = await this.findOrCreatePlan({ amount })
    const customer = await this.stripe.customers.retrieve(customerId)
    const currentSubscription = customer.subscriptions.data[0]

    if (!currentSubscription) {
      return this.createDonation({ customerId, amount })
    }

    const existingPlanId = (customer.subscriptions.data[0].plan || {}).id
    if (plan.id === existingPlanId) {
      // donation amount is the same as what the user is already donating; nothing to do
      return
    }

    const itemIdToUpdate = currentSubscription.items.data[0].id
    // Update the customers subscription to whichever plans
    await this.stripe.subscriptions.update(currentSubscription.id, {
      items: [{
        id: itemIdToUpdate,
        plan: plan.id
      }]
    })
  }

  async deleteDonation ({ customerId }) {
    const customer = await this.stripe.customers.retrieve(customerId)
    const currentSubscription = customer.subscriptions.data[0]

    if (!currentSubscription) return

    // Delete the customers subscription
    await this.stripe.subscriptions.del(currentSubscription.id)
  }

  // Amount is in cents
  async findOrCreatePlan ({ amount }) {
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
