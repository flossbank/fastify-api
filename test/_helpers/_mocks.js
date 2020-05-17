const sinon = require('sinon')

module.exports = {
  Email: function Email () {
    this.sendBetaSubscriptionEmail = sinon.stub().resolves()
    this.sendUserActivationEmail = sinon.stub().resolves()
    this.sendAdvertiserActivationEmail = sinon.stub().resolves()
    this.sendMaintainerActivationEmail = sinon.stub().resolves()
    this.sendUserMagicLinkEmail = sinon.stub().resolves()
  },
  Sqs: function Sqs () {
    this.sendSessionCompleteMessage = sinon.stub().resolves()
    this.sendDistributeDonationMessage = sinon.stub().resolves()
  },
  Registry: function Registry () {
    this.npm = {
      getOwnedPackages: sinon.stub().resolves()
    }
    this.isSupported = sinon.stub().resolves(true)
  },
  Stripe: function Stripe () {
    this.createStripeCustomer = sinon.stub().resolves({ id: 'test-stripe-id' })
    this.updateStripeCustomer = sinon.stub().resolves({ id: 'test-stripe-id' })
    this.createDonation = sinon.stub().resolves()
    this.updateDonation = sinon.stub().resolves()
    this.deleteDonation = sinon.stub().resolves()
    this.constructWebhookEvent = sinon.stub().resolvesArg(0)
  }
}
