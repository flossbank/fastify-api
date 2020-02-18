const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

test.before(async (t) => {
  await before(t, async (t, db) => {
    const advertiserId1 = await db.createAdvertiser({
      firstName: 'Honesty',
      lastName: 'Empathy',
      email: 'honey@etsy.com',
      password: 'beekeeperbookkeeper',
      billingInfo: {
        customerId: 'test-stripe-id'
      }
    })
    t.context.advertiserId1 = advertiserId1.toHexString()
    await db.verifyAdvertiser('honey@etsy.com')
  })
})

test.beforeEach(async (t) => {
  await beforeEach(t)
  t.context.auth.getUISession.resolves({
    advertiserId: t.context.advertiserId1
  })
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test.after.always(async (t) => {
  await after(t)
})

test('POST `/advertiser/update` 401 unauthorized', async (t) => {
  t.context.auth.getUISession.resolves(null)

  const res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/update/billing',
    payload: { billingToken: 'new-stripe-token' },
    headers: { authorization: 'not a valid token' }
  })
  t.deepEqual(res.statusCode, 401)
})

test('POST `/advertiser/update` 200 success updating billing token', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/update/billing',
    payload: { billingToken: 'new-stripe-token' },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), { success: true })

  const advertiser = await t.context.db.getAdvertiser(t.context.advertiserId1)
  t.deepEqual(advertiser.billingInfo.customerId, 'test-stripe-id')
  t.deepEqual(advertiser.billingInfo.cardOnFile, true)
})

test('POST `/advertiser/update` 500 server error', async (t) => {
  t.context.db.updateAdvertiserHasCardInfo = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/update/billing',
    payload: { billingToken: 'new-stripe-token' },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 500)
})

test('POST `/advertiser/update` 500 server error with stripe', async (t) => {
  t.context.stripe.updateStripeCustomer = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/advertiser/update/billing',
    payload: { billingToken: 'new-stripe-token' },
    headers: { authorization: 'valid-session-token' }
  })
  t.deepEqual(res.statusCode, 500)
})
