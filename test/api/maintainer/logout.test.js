const test = require('ava')
const sinon = require('sinon')
const auth = require('../../../auth')
const res = require('../../helpers/_response')
const mockFastify = require('../../helpers/_mockFastify')
const logout = require('../../../api/maintainer/logout')

test.before(() => {
  sinon.stub(console, 'error')
  sinon.stub(auth, 'deleteMaintainerSession')
})

test.afterEach(() => {
  console.error.reset()
  mockFastify.mongoObjectID.reset()
  mockFastify.mongo.collection.reset()
  Object.keys(res).forEach(fn => res[fn].reset())
})

test.after(() => {
  console.error.restore()
})

test('reject with invalid params', async (t) => {
  await logout({ cookies: { flossbank_m_sess_id: undefined } }, res, mockFastify)
  t.true(res.send.called)
})

test('succesful log out', async (t) => {
  await logout({ cookies: { flossbank_m_sess_id: 'ff' } }, res, mockFastify)
  t.true(res.send.calledWith({ success: true }))
})
