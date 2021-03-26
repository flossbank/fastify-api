const test = require('ava')
const { isAdClean } = require('../../helpers/clean')

test('passing in nothing does not throw', (t) => {
  t.is(isAdClean(), false)
})

test('passing in non accepted char returns false ', (t) => {
  t.is(isAdClean({ title: 'blah', body: 'blah', url: 'Š' }), false)
})
