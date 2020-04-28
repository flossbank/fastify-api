function Config ({ env }) {
  this.env = env
}

Config.prototype.getAwsConfig = function getAwsConfig () {
  return {
    accessKeyId: this.env.access_key,
    secretAccessKey: this.env.secret_key,
    region: this.env.region
  }
}

Config.prototype.getMongoUri = function getMongoUri () {
  return this.env.mongo_uri
}

Config.prototype.getRecaptchaSecret = function getRecaptchaSecret () {
  return this.env.recaptcha_secret
}

Config.prototype.getQueueUrl = function getQueueUrl () {
  return this.env.queue_url
}

Config.prototype.getUrlHost = function getUrlHost () {
  return this.env.url_host || 'api.flossbank.io'
}

Config.prototype.getStripeToken = function getStripeToken () {
  return this.env.stripe_token
}

exports.Config = Config
