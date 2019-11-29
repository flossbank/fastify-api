function Config () {}

Config.prototype.getAwsConfig = function getAwsConfig () {
  return {
    accessKeyId: process.env.access_key,
    secretAccessKey: process.env.secret_key,
    region: process.env.region
  }
}

Config.prototype.getMongoUri = function getMongoUri () {
  return process.env.mongo_uri
}

Config.prototype.getRecaptchaSecret = function getRecaptchaSecret () {
  return process.env.recaptcha_secret
}

Config.prototype.getQueueUrl = function getQueueUrl () {
  return process.env.queue_url
}

module.exports = new Config()
