const test = require('ava')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

test.before(async (t) => {
  await before(t)

  t.context.feedbackStub = {
    email: 'rumba@gmail.com',
    topic: 'Help installing',
    name: 'pied piper',
    body: 'help me install!!!'
  }
})

test.beforeEach(async (t) => {
  await beforeEach(t)
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test.after(async (t) => {
  await after(t)
})

test('POST `/support/feedback` success', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/support/feedback',
    payload: t.context.feedbackStub
  })
  t.true(t.context.email.sendContactUsEmail.calledWith(t.context.feedbackStub))
  t.deepEqual(res.statusCode, 200)
})

test('POST `/support/feedback` missing body', async (t) => {
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/support/feedback',
    payload: {
      email: 'rumba@gmail.com',
      topic: 'Help installing',
      name: 'pied piper'
    }
  })
  t.deepEqual(res.statusCode, 400)
})

test('POST `/support/feedback` 500 email fails', async (t) => {
  t.context.email.sendContactUsEmail = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'POST',
    url: '/support/feedback',
    payload: t.context.feedbackStub
  })
  t.deepEqual(res.statusCode, 500)
})
