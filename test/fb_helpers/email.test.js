const test = require('ava')
const email = require('../../helpers/activationEmails')

test('email | activate user', (t) => {
  const res = email.activationEmails.USER('foo', 'bar')
  t.is(res.Subject.Data, 'Verify your Flossbank email address')
  t.true(res.Body.Text.Data.includes(
    'https://verification.flossbank.com/?e=3zvxr&token=bar&kind=user'
  ))
})

test('email | activate advertiser', (t) => {
  const res = email.activationEmails.ADVERTISER('foo', 'bar')
  t.is(res.Subject.Data, 'Verify your Flossbank email address')
  t.true(res.Body.Text.Data.includes(
    'https://verification.flossbank.com/?e=3zvxr&token=bar&kind=advertiser'
  ))
})

test('email | activate maintainer', (t) => {
  const res = email.activationEmails.MAINTAINER('foo', 'bar')
  t.is(res.Subject.Data, 'Verify your Flossbank email address')
  t.true(res.Body.Text.Data.includes(
    'https://verification.flossbank.com/?e=3zvxr&token=bar&kind=maintainer'
  ))
})
