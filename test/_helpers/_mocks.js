const sinon = require('sinon')
const { Auth: originalAuth } = require('../../auth')

module.exports = {
  Auth: function Auth () {
    this.authKinds = originalAuth.prototype.authKinds
    this.isAdSessionAllowed = sinon.stub().resolves(true)
    this.getUISession = sinon.stub().resolves({
      maintainerId: 'valid-id',
      advertiserId: 'valid-id'
    })
    this.createAdSession = sinon.stub().resolves('random-session-id')
    this.sendUserToken = sinon.stub().resolves()
    this.createAdvertiserSession = sinon.stub().resolves('advertiser-session')
    this.deleteAdvertiserSession = sinon.stub().resolves()
    this.validateCaptcha = sinon.stub().resolves(true)
    this.createApiKey = sinon.stub().resolves('api-key')
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
    this.isSupported = sinon.stub().resolves(true)
  },
  Url: function Url () {
    this.createUrl = sinon.stub().resolves('https://api.flossbank.io/u/asdf')
    this.getUrl = sinon.stub().resolves('http://localhost.com')
  }
}
