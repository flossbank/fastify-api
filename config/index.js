function Config () {
  this.production = process.env.NODE_ENV === 'production'
}

Config.prototype.getAwsConfig = function getAwsConfig () {
  return this.production
    ? {
      accessKeyId: process.env.access_key,
      secretAccessKey: process.env.secret_key,
      region: process.env.region
    }
    : {
      accessKeyId: process.env.access_key_test,
      secretAccessKey: process.env.secret_key_test,
      region: process.env.region_test
    }
}

Config.prototype.getMongoUri = function getMongoUri () {
  return this.production
    ? process.env.mongo_uri
    : process.env.mongo_uri_test
}

Config.prototype.getRecaptchaSecret = function getRecaptchaSecret () {
  return this.production
    ? process.env.recaptcha_secret
    : process.env.recaptcha_secret_test
}

Config.prototype.getQueueUrl = function getQueueUrl () {
  return this.production
    ? process.env.queue_url
    : process.env.queue_url_test
}

module.exports = new Config()
