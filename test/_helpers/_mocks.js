const { Stripe: StripeController } = require('../../stripe')
const sinon = require('sinon')

module.exports = {
  Email: function Email () {
    this.sendBetaSubscriptionEmail = sinon.stub().resolves()
    this.sendUserActivationEmail = sinon.stub().resolves()
    this.sendAdvertiserActivationEmail = sinon.stub().resolves()
    this.sendMaintainerActivationEmail = sinon.stub().resolves()
    this.sendUserMagicLinkEmail = sinon.stub().resolves()
    this.sendContactUsEmail = sinon.stub().resolves()
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
  Stripe: function Stripe ({ config }) {
    const stripe = new StripeController({ stripe: require('stripe'), config })
    this.createStripeCustomer = sinon.stub().resolves({ id: 'test-stripe-id' })
    this.getStripeCustomer = sinon.stub().resolves({ id: 'test-stripe-id' })
    this.getStripeCustomerDonationInfo = sinon.stub().resolves({
      last4: '4242',
      renewal: 1595197107000,
      amount: 1000
    })
    this.updateStripeCustomer = sinon.stub().resolves({ id: 'test-stripe-id' })
    this.createDonation = sinon.stub().resolves()
    this.updateDonation = sinon.stub().resolves()
    this.deleteDonation = sinon.stub().resolves()
    this.constructWebhookEvent = stripe.constructWebhookEvent.bind(stripe)
  },
  GitHub: function GitHub () {
    this.requestAccessToken = sinon.stub().resolves({ access_token: 'test_access_token' })
    this.requestUserData = sinon.stub().resolves({ email: 'stripedpajamas@github.com' })
  }
}
