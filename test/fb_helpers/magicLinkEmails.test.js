const test = require('ava')
const mle = require('../../helpers/magicLinkEmails')

test('magic link emails | activate user', (t) => {
  const res = mle.USER('foo', 'bar', 'code')
  t.is(res.Subject.Data, 'Flossbank Login Verification')
  t.true(res.Body.Text.Data.includes(
    'https://login.flossbank.com/?email=3zvxr&token=bar&kind=user'
  ))
  t.true(res.Body.Text.Data.includes('code'))
})

test('magic link emails | unimplemented', (t) => {
  t.throws(() => mle.ADVERTISER())
  t.throws(() => mle.MAINTAINER())
})
