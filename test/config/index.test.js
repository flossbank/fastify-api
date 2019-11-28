const test = require('ava')
const config = require('../../config')

test('getAwsConfig', (t) => {
  config.production = false
  const testConfig = config.getAwsConfig()
  config.production = true
  const prodConfig = config.getAwsConfig()
  t.true(testConfig !== prodConfig)
})

test('getMongoUri', (t) => {
  config.production = false
  const testUri = config.getMongoUri()
  config.production = true
  const prodUri = config.getMongoUri()
  t.true(testUri !== prodUri)
})

test('getRecaptchaSecret', (t) => {
  config.production = false
  const testSecret = config.getRecaptchaSecret()
  config.production = true
  const prodSecret = config.getRecaptchaSecret()
  t.true(testSecret !== prodSecret)
})
