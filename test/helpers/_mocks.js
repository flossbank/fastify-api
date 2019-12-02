const sinon = require('sinon')
const { Auth: originalAuth } = require('../../auth')

module.exports = {
  Db: function Db () {
    this.getDb = sinon.stub().returns(this)
    this.getClient = sinon.stub().returns(this)
    this.getAdBatch = sinon.stub().resolves([
      {
        id: 'test-ad-0',
        body: 'abc',
        title: 'ABC',
        url: 'https://abc.com'
      }
    ])
    this.getAdsByAdvertiser = sinon.stub().resolves([
      {
        id: 'test-ad-0',
        name: 'ad #1',
        content: { body: 'abc', title: 'ABC', url: 'https://abc.com' },
        advertiserId: 'test-advertiser-0',
        active: false,
        approved: false
      }
    ])
    this.createAd = sinon.stub().resolves('test-ad-0')
    this.updateAd = sinon.stub().resolves()
    this.createAdvertiser = sinon.stub().resolves('test-advertiser-0')
    this.updateAdvertiser = sinon.stub().resolves()
    this.getAdvertiser = sinon.stub().resolves({
      id: 'test-advertiser-0',
      name: 'Papa Juanita',
      email: 'jupapa@msn.com'
    })
    this.authenticateAdvertiser = sinon.stub().resolves({ success: true })
    this.createAdCampaign = sinon.stub().resolves('test-ad-campaign-0')
  },
  Auth: function Auth () {
    this.authKinds = originalAuth.prototype.authKinds
    this.isRequestAllowed = sinon.stub().resolves(true)
    this.createAdSession = sinon.stub().resolves('random-session-id')
    this.sendUserToken = sinon.stub().resolves()
    this.createAdvertiserSession = sinon.stub().resolves('advertiser-session')
    this.deleteAdvertiserSession = sinon.stub().resolves()
    this.validateCaptcha = sinon.stub().resolves('api-key')
    this.validateUserToken = sinon.stub().resolves(true)
  },
  Sqs: function Sqs () {
    this.sendMessage = sinon.stub().resolves()
  }
}
