const App = require('../../app')
const mocks = require('./_mocks')

exports.beforeEach = async function (t) {
  t.context.auth = new mocks.Auth()
  t.context.db = new mocks.Db()
  t.context.sqs = new mocks.Sqs()
  t.context.registry = new mocks.Registry()
  t.context.app = await App({
    db: t.context.db,
    auth: t.context.auth,
    sqs: t.context.sqs,
    registry: t.context.registry,
    logger: false
  })
}

exports.afterEach = async function (t) {
  t.context.app.close()
}
