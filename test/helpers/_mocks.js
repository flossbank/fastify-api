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
        url: 'https://abc.com',
        advertiserId: 'test-advertiser-0'
      }
    ])
    this.getAdsByIds = sinon.stub().resolves([
      { id: 'test-ad-0', advertiserId: 'test-advertiser-0', approved: true }
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
    this.getAdCampaign = sinon.stub().resolves({
      id: 'test-ad-campaign-0',
      advertiserId: 'test-advertiser-0',
      ads: ['test-ad-0'],
      name: 'camp pain',
      spend: 100,
      maxSpend: 1000,
      cpm: 100,
      startDate: 0,
      endDate: 100
    })
    this.getAdCampaignsForAdvertiser = sinon.stub().resolves([
      {
        id: 'test-ad-campaign-0',
        advertiserId: 'test-advertiser-0',
        ads: ['test-ad-0'],
        name: 'camp pain',
        spend: 100,
        maxSpend: 1000,
        cpm: 100,
        startDate: 0,
        endDate: 100
      }
    ])
    this.createAdCampaign = sinon.stub().resolves('test-ad-campaign-0')
    this.updateAdCampaign = sinon.stub().resolves()
    this.activateAdCampaign = sinon.stub().resolves()
    this.getOwnedPackages = sinon.stub().resolves([
      {
        id: 'test-package-0',
        maintainers: ['test-maintainer-0'],
        owner: 'test-maintainer-0',
        name: 'yttrium-server',
        dividend: 1,
        dividendAge: 2,
        totalRevenue: 3
      }
    ])
    this.getPackage = sinon.stub().resolves({
      id: 'test-package-0',
      maintainers: ['test-maintainer-0'],
      owner: 'test-maintainer-0',
      name: 'yttrium-server',
      dividend: 1,
      dividendAge: 2,
      totalRevenue: 3
    })
    this.updatePackage = sinon.stub().resolves()
    this.refreshPackageOwnership = sinon.stub().resolves()
    this.getRevenue = sinon.stub().resolves(3)
    this.getMaintainer = sinon.stub().resolves({
      id: 'test-maintainer-0',
      email: 'maintenance@amazon.com',
      tokens: { npm: 'npm-token' }
    })
    this.createMaintainer = sinon.stub().resolves('test-maintainer-0')
    this.authenticateMaintainer = sinon.stub().resolves({ success: true })
    this.verifyMaintainer = sinon.stub().resolves()
    this.updateMaintainer = sinon.stub().resolves()
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
    this.createMaintainerSession = sinon.stub().resolves('maintainer-session')
    this.deleteMaintainerSession = sinon.stub().resolves()
  },
  Sqs: function Sqs () {
    this.sendMessage = sinon.stub().resolves()
  },
  Registry: function Registry () {
    this.npm = {
      getOwnedPackages: sinon.stub().resolves()
    }
  }
}
