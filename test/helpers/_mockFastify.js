const sinon = require('sinon')

module.exports = {
  mongo: {
    collection: sinon.stub().returns({
      insertOne: sinon.stub(),
      findOne: sinon.stub(),
      updateOne: sinon.stub(),
      insertMany: sinon.stub(),
      find: sinon.stub()
    })
  },
  mongoObjectID: sinon.stub().returnsArg(0),
  mongoClient: sinon.stub()
}
