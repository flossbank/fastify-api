const test = require('ava')
const { Config } = require('../../config')

test.beforeEach((t) => {
  t.context.config = new Config({
    env: {
      access_key: 'access_key',
      secret_key: 'secret_key',
      region: 'region',
      mongo_uri: 'mongo_uri',
      recaptcha_secret: 'recaptcha_secret',
      queue_url: 'queue_url',
      url_host: 'url_host',
      stripe_token: 'test_stripe_token'
    }
  })
})

test('config | getAwsConfig', (t) => {
  t.deepEqual(t.context.config.getAwsConfig(), {
    accessKeyId: 'access_key',
    secretAccessKey: 'secret_key',
    region: 'region'
  })
})

test('config | getMongoUri', (t) => {
  t.deepEqual(t.context.config.getMongoUri(), 'mongo_uri')
})

test('config | getRecaptchaSecret', (t) => {
  t.deepEqual(t.context.config.getRecaptchaSecret(), 'recaptcha_secret')
})

test('config | getQueueUrl', (t) => {
  t.deepEqual(t.context.config.getQueueUrl(), 'queue_url')
})

test('config | getUrlHost', (t) => {
  t.deepEqual(t.context.config.getUrlHost(), 'url_host')
})

test('config | getStripeToken', (t) => {
  t.deepEqual(t.context.config.getStripeToken(), 'test_stripe_token')
})

test('config | getUrlHost fallback', (t) => {
  t.context.config.env = {}
  t.deepEqual(t.context.config.getUrlHost(), 'api.flossbank.io')
})
