const crypto = require('crypto')
const testData = require('./test/api/stripe/_test_event.js')

function main () {
  const secret = process.argv[2]
  const evt = process.argv[3]
  if (!testData[evt]) throw new Error(`${evt} not found in test data`)

  const { body, signature } = testData[evt]

  // compute proper signature given timestamp and body
  const [tsKv, sigKv] = signature.split(',')
  const [, ts] = tsKv.split('=')
  const [, sigv1] = sigKv.split('=')

  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(`${ts}.${body}`)
  const sig = hmac.digest('hex')

  console.error('Proper signature:\n\t%s\nDetected signature:\n\t%s', sig, sigv1)
}

main()
