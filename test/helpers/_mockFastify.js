const sinon = require('sinon')

module.exports = {
  mongo: {
    collection: sinon.stub().returns({
      insertOne: sinon.stub()
    })
  },
  mongoObjectID: sinon.stub().returnsArg(0)
}
