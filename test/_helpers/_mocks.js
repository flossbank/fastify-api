const { Stripe: StripeController } = require('../../stripe')
const sinon = require('sinon')

module.exports = {
  Email: function Email () {
    this.sendBetaSubscriptionEmail = sinon.stub().resolves()
    this.sendUserActivationEmail = sinon.stub().resolves()
    this.sendAdvertiserActivationEmail = sinon.stub().resolves()
    this.sendMaintainerActivationEmail = sinon.stub().resolves()
    this.sendUserMagicLinkEmail = sinon.stub().resolves()
    this.sendMaintainerMagicLinkEmail = sinon.stub().resolves()
    this.sendContactUsEmail = sinon.stub().resolves()
  },
  Sqs: function Sqs () {
    this.sendSessionCompleteMessage = sinon.stub().resolves()
    this.sendDistributeUserDonationMessage = sinon.stub().resolves()
    this.sendDistributeOrgDonationMessage = sinon.stub().resolves()
  },
  Registry: function Registry () {
    this.npm = {
      getUsername: sinon.stub().resolves('twoseventythree'),
      getOwnedPackages: sinon.stub().resolves(['js-deep-equals', 'ninja-rmm-api'])
    }
    this.isSupported = sinon.stub().resolves(true)
  },
  Stripe: function Stripe ({ config }) {
    const stripe = new StripeController({ stripe: require('stripe'), config })
    this.createStripeCustomer = sinon.stub().resolves({ id: 'test-stripe-id' })
    this.updateCustomerEmail = sinon.stub().resolves()
    this.getStripeCustomer = sinon.stub().resolves({
      id: 'test-stripe-id',
      sources: {
        data: [
          {
            last4: '4242'
          }
        ]
      }
    })
    this.getCustomerLast4 = sinon.stub().resolves('4242')
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
    this.getStripeCustomerAllTransactions = sinon.stub().resolves([
      {
        id: 'blahblah',
        amount_captured: 1000
      },
      {
        id: 'secondCharge',
        amount_captured: 50
      }
    ])
  },
  GitHub: function GitHub () {
    this.requestAccessToken = sinon.stub().resolves('test_access_token')
    this.requestUserData = sinon.stub().resolves({ email: 'stripedpajamas@github.com', githubId: 'id-1' })
    this.getUserOrgs = sinon.stub().resolves({ orgsData: [{ login: 'flossbank' }] })
    this.getInstallationDetails = sinon.stub().resolves()
    this.isUserAnOrgAdmin = sinon.stub().resolves(true)
  },
  EthicalAdsGot: () => ({
    body: {
      id: 'ethicaladsio-test-generic-text',
      text: '<a><strong>EthicalAds</strong> is a developer-focused ad network from Read the Docs. Publisher &amp; Advertisers wanted.</a>',
      body: 'EthicalAds is a developer-focused ad network from Read the Docs. Publisher & Advertisers wanted.',
      image: null,
      link: 'https://server.ethicalads.io/proxy/click/1050/Mo7FPcWUSOKbvmvD/',
      view_url: 'https://server.ethicalads.io/proxy/view/1050/Mo7FPcWUSOKbvmvD/',
      nonce: 'Mo7FPcWUSOKbvmvD',
      display_type: 'text-v1',
      campaign_type: 'house',
      div_id: 'test'
    }
  })
}
