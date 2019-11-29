const test = require('ava')
const sinon = require('sinon')
const auth = require('../../../auth')
const res = require('../../helpers/_response')
const logout = require('../../../api/advertiser/logout')

test.before(() => {
  sinon.stub(console, 'error')
  sinon.stub(auth, 'deleteAdvertiserSession')
})

test.afterEach(() => {
  console.error.reset()
  Object.keys(res).forEach(fn => res[fn].reset())
})

test.after(() => {
  console.error.restore()
})

test('reject with invalid params', async (t) => {
  await logout({ cookies: { flossbank_a_sess_id: undefined } }, res)
  t.true(res.send.called)
})

test('succesful log out', async (t) => {
  await logout({ cookies: { flossbank_a_sess_id: 'ff' } }, res)
  t.true(res.send.calledWith({ success: true }))
})
