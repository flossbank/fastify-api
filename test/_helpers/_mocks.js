const sinon = require('sinon')
const { Auth: originalAuth } = require('../../auth')

module.exports = {
  Auth: function Auth () {
    this.authKinds = originalAuth.prototype.authKinds
    this.sendMagicLink = sinon.stub().resolves('code')
    this.hasUserAuthCheckedInPastOneMinute = sinon.stub()
      .onFirstCall().returns(false)
      .onSecondCall().returns(true)
    this.recordUserAuthCheck = sinon.stub()
    this.checkApiKeyForUser = sinon.stub().resolves(true)
    this.updateUserOptOutSetting = sinon.stub().resolves()
    this.getAdSessionApiKey = sinon.stub().resolves({})
    this.getUISession = sinon.stub().resolves({
      maintainerId: 'valid-id',
      advertiserId: 'valid-id'
    })
    this.createAdSession = sinon.stub().resolves('random-session-id')
    this.sendToken = sinon.stub().resolves()
    this.createAdvertiserSession = sinon.stub().resolves('advertiser-session')
    this.deleteAdvertiserSession = sinon.stub().resolves()
    this.validateCaptcha = sinon.stub().resolves(true)
    this.cacheApiKey = sinon.stub().resolves()
    this.validateToken = sinon.stub().resolves(true)
    this.deleteToken = sinon.stub().resolves()
    this.createMaintainerSession = sinon.stub().resolves('maintainer-session')
    this.deleteMaintainerSession = sinon.stub().resolves()
    this.createUserSession = sinon.stub().resolves('user-session')
    this.deleteUserSession = sinon.stub().resolves()
  },
  Email: function Email () {
    this.sendBetaEmail = sinon.stub().resolves()
  },
  Sqs: function Sqs () {
    this.sendMessage = sinon.stub().resolves()
  },
  Registry: function Registry () {
    this.npm = {
      getOwnedPackages: sinon.stub().resolves()
    }
    this.isSupported = sinon.stub().resolves(true)
  },
  Url: function Url () {
    this.createUrl = sinon.stub().resolves('https://api.flossbank.io/u/asdf')
    this.getUrl = sinon.stub().resolves('http://localhost.com')
  },
  Stripe: function Stripe () {
    this.createStripeCustomer = sinon.stub().resolves({ id: 'test-stripe-id' })
    this.updateStripeCustomer = sinon.stub().resolves({ id: 'test-stripe-id' })
  }
}
