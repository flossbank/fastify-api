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
        update: sinon.stub().resolves({ id: 'blah' }),
        retrieve: sinon.stub().resolves({ id: 'blah' })
      },
      subscriptions: {
        create: sinon.stub(),
        update: sinon.stub(),
        del: sinon.stub()
      },
      webhooks: {
        constructEvent: sinon.stub().resolves()
      },
      plans: {
        list: sinon.stub().resolves({
          data: [
            { id: 5, amount: 500 },
            { id: 4, amount: 400 },
            { id: 3, amount: 300 },
            { id: 2, amount: 200 }
          ]
        }),
        create: sinon.stub()
      }
    }),
    config: {
      getStripeToken: sinon.stub(),
      getStripeWebhookSecret: sinon.stub().returns('some secret')
    }
  })

  t.context.stripe.init()
})

test('create customer', async (t) => {
  await t.context.stripe.createStripeCustomer('winney@thepoo.com')
  t.deepEqual(t.context.stripe.stripe.customers.create.lastCall.args, [{
    email: 'winney@thepoo.com',
    metadata: { updatedAt: Date.now() }
  }])
})

test('get customer', async (t) => {
  await t.context.stripe.getStripeCustomer('1234')
  t.deepEqual(t.context.stripe.stripe.customers.retrieve.lastCall.args, ['1234'])
})

test('construct webhook event', async (t) => {
  await t.context.stripe.constructWebhookEvent({ body: { some: 'body' }, signature: 'signature' })
  t.deepEqual(t.context.stripe.stripe.webhooks.constructEvent.lastCall.args, [
    { some: 'body' },
    'signature',
    'some secret'
  ])
})

test('construct webhook event fetching secret throws', async (t) => {
  t.context.stripe.config.getStripeWebhookSecret.throws()
  await t.throwsAsync(t.context.stripe.constructWebhookEvent({ body: { some: 'body' }, signature: 'signature' }))
})

test('construct webhook event | invalid params throws', async (t) => {
  await t.throwsAsync(() => t.context.stripe.constructWebhookEvent({}))
})

test('update customer', async (t) => {
  await t.context.stripe.updateStripeCustomer('test-id-1', 'test-source-5')
  t.deepEqual(t.context.stripe.stripe.customers.update.lastCall.args, [
    'test-id-1', {
      source: 'test-source-5',
      metadata: { updatedAt: Date.now() }
    }])
})

test('get stripe customer donation info', async (t) => {
  const { stripe } = t.context
  stripe.getStripeCustomer = sinon.stub().resolves({
    subscriptions: {
      data: [
        {
          plan: {
            amount: 200
          },
          current_period_end: 1234
        }
      ]
    },
    sources: {
      data: [
        { last4: '5678' }
      ]
    }
  })

  t.deepEqual(await stripe.getStripeCustomerDonationInfo('cust-id'), {
    amount: 200,
    renewal: 1234000,
    last4: '5678'
  })
})

test('create donation', async (t) => {
  const { stripe } = t.context
  await stripe.createDonation('cust-id', 300)

  t.deepEqual(stripe.stripe.subscriptions.create.lastCall.args, [{
    customer: 'cust-id',
    items: [{ plan: 3 }]
  }])
})

test('update donation | customer does not have one', async (t) => {
  const { stripe } = t.context
  stripe.createDonation = sinon.stub()
  stripe.stripe.customers.retrieve.resolves({
    subscriptions: {
      data: []
    }
  })
  await stripe.updateDonation('cust-id', 200)
  t.deepEqual(stripe.createDonation.lastCall.args, ['cust-id', 200])
})

test('update donation | customer has one', async (t) => {
  const { stripe } = t.context
  stripe.stripe.customers.retrieve.resolves({
    subscriptions: {
      data: [
        { id: 'sub-id', items: { data: [{ id: 'item-id' }] } }
      ]
    }
  })
  await stripe.updateDonation('cust-id', 200)
  t.deepEqual(stripe.stripe.subscriptions.update.lastCall.args, [
    'sub-id',
    { items: [{ id: 'item-id', plan: 2 }] }
  ])
})

test('update donation | customer has one and new amount is same as existing amount', async (t) => {
  const { stripe } = t.context
  stripe.stripe.customers.retrieve.resolves({
    subscriptions: {
      data: [
        {
          id: 'sub-id',
          plan: {
            id: 'plan-id-0',
            amount: 40
          },
          items: {
            data: [
              { id: 'item-id' }
            ]
          }
        }
      ]
    }
  })
  stripe.findOrCreatePlan = () => ({ id: 'plan-id-0' })
  await stripe.updateDonation('cust-id', 40)
  t.true(stripe.stripe.subscriptions.update.notCalled)
})
test('delete donation | customer has one', async (t) => {
  const { stripe } = t.context
  stripe.stripe.customers.retrieve.resolves({
    subscriptions: {
      data: [
        { id: 'sub-id' }
      ]
    }
  })
  await stripe.deleteDonation('cust-id')

  t.deepEqual(stripe.stripe.subscriptions.del.lastCall.args, ['sub-id'])
})

test('delete donation | customer does not have one', async (t) => {
  const { stripe } = t.context
  stripe.stripe.customers.retrieve.resolves({
    subscriptions: {
      data: []
    }
  })
  await stripe.deleteDonation('cust-id')

  t.true(stripe.stripe.subscriptions.del.notCalled)
})

test('find or create plans | creates', async (t) => {
  const { stripe } = t.context
  await stripe.findOrCreatePlan(100)
  t.deepEqual(stripe.stripe.plans.create.lastCall.args, [
    {
      amount: 100,
      interval: 'month',
      product: {
        name: 'Flossbank user donation plan for $1'
      },
      currency: 'usd'
    }
  ])
})

test('find or create plans | finds', async (t) => {
  const { stripe } = t.context
  t.deepEqual(await stripe.findOrCreatePlan(200), {
    id: 2,
    amount: 200
  })
})
