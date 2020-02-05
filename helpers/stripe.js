const { config } = require('../config')
const stripe = require('stripe')(config.getStripeToken())

const createStripeCustomer = async (email) => {
  return stripe.customers.create({
    email,
    metadata: { updatedAt: Date.now() }
  })
}

const updateStripeCustomer = async (customerId, sourceId) => {
  return stripe.customers.update(customerId, {
    source: sourceId,
    metadata: { updatedAt: Date.now() }
  })
}

module.exports = { updateStripeCustomer, createStripeCustomer }
