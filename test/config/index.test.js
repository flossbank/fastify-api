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
      session_complete_queue_url: 'queue_url',
      distribute_donation_queue_url: 'dd_queue_url',
      distribute_org_donation_queue_url: 'dd_org_queue_url',
      url_host: 'url_host',
      stripe_token: 'test_stripe_token',
      ORG_DONATION_STATE_BUCKET: 'flossbank-org-donation-state-staging'
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

test('config | getSessionCompleteQueueUrl', (t) => {
  t.deepEqual(t.context.config.getSessionCompleteQueueUrl(), 'queue_url')
})

test('config | getDistributeUserDonationQueueUrl', (t) => {
  t.deepEqual(t.context.config.getDistributeUserDonationQueueUrl(), 'dd_queue_url')
})

test('config | getDistributeOrDonationQueueUrl', (t) => {
  t.deepEqual(t.context.config.getDistributeOrgDonationQueueUrl(), 'dd_org_queue_url')
})

test('config | getUrlHost', (t) => {
  t.deepEqual(t.context.config.getUrlConfig().URL_HOST, 'url_host')
})

test('config | getStripeToken', (t) => {
  t.deepEqual(t.context.config.getStripeToken(), 'test_stripe_token')
})

test('config | getOrgDodBucketName', (t) => {
  t.deepEqual(t.context.config.getOrgDodBucketName(), 'flossbank-org-donation-state-staging')
})

test('config | getUrlHost fallback', (t) => {
  t.context.config.env = {}
  t.deepEqual(t.context.config.getUrlConfig().URL_HOST, 'api.flossbank.io')
})
