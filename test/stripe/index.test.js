const test = require('ava')
const sinon = require('sinon')
const { Stripe } = require('../../stripe')

test.before(() => {
  sinon.stub(Date, 'now').returns(1234)
})

test.after(() => {
  Date.now.restore()
})

test.beforeEach((t) => {
  t.context.stripe = new Stripe({
    stripe: () => ({
      customers: {
        create: sinon.stub().resolves({ id: 'blah' }),
        update: sinon.stub().resolves({ id: 'blah' })
      }
    }),
    config: { getStripeToken: sinon.stub() }
  })

  t.context.stripe.init()
})

test('stripe | create customer', async (t) => {
  await t.context.stripe.createStripeCustomer('winney@thepoo.com')
  t.deepEqual(t.context.stripe.stripe.customers.create.lastCall.args, [{
    email: 'winney@thepoo.com',
    metadata: { updatedAt: Date.now() }
  }])
})

test('stripe | update customer', async (t) => {
  await t.context.stripe.updateStripeCustomer('test-id-1', 'test-source-5')
  t.deepEqual(t.context.stripe.stripe.customers.update.lastCall.args, [
    'test-id-1', {
      source: 'test-source-5',
      metadata: { updatedAt: Date.now() }
    }])
})
