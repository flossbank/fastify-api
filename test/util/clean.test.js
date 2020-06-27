const test = require('ava')
const { isAdClean } = require('../../helpers/clean')

test('passing in nothing does not throw', (t) => {
  t.is(isAdClean(), false)
})
