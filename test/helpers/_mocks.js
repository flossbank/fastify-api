const sinon = require('sinon')

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
  },
  Auth: function Auth () {
    this.isRequestAllowed = sinon.stub().resolves(true)
    this.createAdSession = sinon.stub().resolves('random-session-id')
  }
}
