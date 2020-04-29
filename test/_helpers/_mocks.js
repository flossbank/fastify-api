const sinon = require('sinon')

module.exports = {
  Auth: function Auth () {
    this.user = {
      cacheApiKey: sinon.stub().resolves(),
      createWebSession: sinon.stub().resolves('user-session'),
      getWebSession: sinon.stub().resolves({ userId: 'valid-user-id' }),
      deleteWebSession: sinon.stub().resolves(),
      beginRegistration: sinon.stub().resolves({ registrationToken: 'reg-token' }),
      validateRegistration: sinon.stub().resolves(true),
      updateRegistrationApiKey: sinon.stub().resolves(),
      completeRegistration: sinon.stub().resolves('apiKey'),
      beginAuthentication: sinon.stub().resolves({ token: 'token', code: 'code' }),
      completeAuthentication: sinon.stub().resolves({ success: true })
    }
    this.advertiser = {
      createWebSession: sinon.stub().resolves('advertiser-session'),
      getWebSession: sinon.stub().resolves({ userId: 'valid-advertiser-id' }),
      deleteWebSession: sinon.stub().resolves(),
      beginRegistration: sinon.stub().resolves({ registrationToken: 'reg-token' }),
      completeRegistration: sinon.stub().resolves(true)
    }
    this.maintainer = {
      createWebSession: sinon.stub().resolves('maintainer-session'),
      getWebSession: sinon.stub().resolves({ userId: 'valid-maintainer-id' }),
      deleteWebSession: sinon.stub().resolves(),
      beginRegistration: sinon.stub().resolves({ registrationToken: 'reg-token' }),
      completeRegistration: sinon.stub().resolves(true)
    }
    this.generateMagicLinkParams = sinon.stub().resolves({ code: 'code', token: 'token' })
    this.getAdSessionApiKey = sinon.stub().resolves({})
    this.createAdSession = sinon.stub().resolves('random-session-id')
    this.cacheApiKey = sinon.stub().resolves()
  },
  Email: function Email () {
    this.sendBetaSubscriptionEmail = sinon.stub().resolves()
    this.sendUserActivationEmail = sinon.stub().resolves()
    this.sendAdvertiserActivationEmail = sinon.stub().resolves()
    this.sendMaintainerActivationEmail = sinon.stub().resolves()
    this.sendUserMagicLinkEmail = sinon.stub().resolves()
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
