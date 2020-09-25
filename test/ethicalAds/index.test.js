const test = require('ava')
const { EthicalAds } = require('../../ethicalAds')

test('constructor | uses staging link if appropriate', (t) => {
  const config = {
    getEthicalAdsConfig: () => ({
      HOUSE_ADS_ONLY: true
    })
  }
  const ea = new EthicalAds({ config })
  t.true(ea.url.includes('force_ad=ethicaladsio-test-generic-text'))
})
