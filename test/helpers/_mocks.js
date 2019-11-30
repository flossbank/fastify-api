const sinon = require('sinon')

module.exports = {
  Db: function Db () {
    this.getDb = sinon.stub().returns(this)
    this.getClient = sinon.stub().returns(this)
    this.getAdBatch = sinon.stub().resolves([
      {
        _id: 'test-ad-0',
        name: 'ad #1',
        impressions: [],
        content: { body: 'abc', title: 'ABC', url: 'https://abc.com' },
        advertiserId: 'test-advertiser-0',
        active: false
      }
    ])
  },
  Auth: function Auth () {
    this.isRequestAllowed = sinon.stub().resolves(true)
    this.createAdSession = sinon.stub().resolves('random-session-id')
  }
}
