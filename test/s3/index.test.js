const test = require('ava')
const sinon = require('sinon')
const { S3 } = require('../../s3')

test.beforeEach((t) => {
  sinon.stub(Date, 'now').returns(1234)
  t.context.s3 = new S3({
    s3: {
      putObject: sinon.stub().returns({
        promise: sinon.stub()
      })
    }
  })
})

test.afterEach(() => {
  Date.now.restore()
})

test('writeDistributeOrgDonationInitialState | calls s3 putObject', async (t) => {
  const { s3 } = t.context
  await s3.writeDistributeOrgDonationInitialState('corr-id', {
    organizationId: 'org-id',
    amount: 100,
    description: 'blah'
  })

  t.deepEqual(s3.s3.putObject.lastCall.args[0], {
    Body: JSON.stringify({
      entryPoint: 'API',
      redistributedDonation: false,
      organizationId: 'org-id',
      amount: 100,
      timestamp: 1234,
      description: 'blah'
    }),
    Bucket: 'org-donation-state',
    Key: 'corr-id/initial_state.json'
  })
})
