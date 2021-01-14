const test = require('ava')
const sinon = require('sinon')
const { EthicalAds } = require('../../ethicalAds')

test.before((t) => {
  const config = {
    getEthicalAdsConfig: () => ({
      HOUSE_ADS_ONLY: true
    })
  }

  const ea = new EthicalAds({ config })
  t.context.ea = ea
})

test('constructor | uses staging link if appropriate', (t) => {
  const { ea } = t.context
  t.true(ea.url.includes('force_ad=ethicaladsio-test-generic-text'))
})

test('getAd | uses broken-out content if available', async (t) => {
  const { ea } = t.context

  const body = 'EthicalAds is a developer-focused ad network from Read the Docs. Publisher & Advertisers wanted.'
  const url = 'https://server.ethicalads.io/proxy/click/1050/Mo7FPcWUSOKbvmvD/'
  ea.got = () => ({
    body: {
      id: 'ethicaladsio-test-generic-text',
      text: '<a><strong>EthicalAds</strong> is a developer-focused ad network from Read the Docs. Publisher &amp; Advertisers wanted.</a>',
      body,
      image: null,
      link: url,
      view_url: 'https://server.ethicalads.io/proxy/view/1050/Mo7FPcWUSOKbvmvD/',
      nonce: 'Mo7FPcWUSOKbvmvD',
      display_type: 'text-v1',
      campaign_type: 'house',
      div_id: 'test',
      copy: {
        headline: 'Papa Johns',
        content: body,
        cta: 'Call us......please'
      }
    }
  })
  ea.saveViewUrls = sinon.stub().resolves()

  const ad = await ea.getAd({ sessionId: 'blah' })

  t.is(ad.title, 'Papa Johns')
  t.is(ad.body, body + ' ' + 'Call us......please')
})

test('getAd | uses broken-out content (partial) if available', async (t) => {
  const { ea } = t.context

  const body = 'EthicalAds is a developer-focused ad network from Read the Docs. Publisher & Advertisers wanted.'
  const url = 'https://server.ethicalads.io/proxy/click/1050/Mo7FPcWUSOKbvmvD/'
  ea.got = () => ({
    body: {
      id: 'ethicaladsio-test-generic-text',
      text: '<a><strong>EthicalAds</strong> is a developer-focused ad network from Read the Docs. Publisher &amp; Advertisers wanted.</a>',
      body,
      image: null,
      link: url,
      view_url: 'https://server.ethicalads.io/proxy/view/1050/Mo7FPcWUSOKbvmvD/',
      nonce: 'Mo7FPcWUSOKbvmvD',
      display_type: 'text-v1',
      campaign_type: 'house',
      div_id: 'test',
      copy: {
        headline: 'Papa Johns',
        content: body,
        cta: ''
      }
    }
  })
  ea.saveViewUrls = sinon.stub().resolves()

  const ad = await ea.getAd({ sessionId: 'blah' })

  t.is(ad.title, 'Papa Johns')
  t.is(ad.body, body)
})

test('getAd | uses legacy content if needed', async (t) => {
  const { ea } = t.context

  const body = 'EthicalAds is a developer-focused ad network from Read the Docs. Publisher & Advertisers wanted.'
  const url = 'https://server.ethicalads.io/proxy/click/1050/Mo7FPcWUSOKbvmvD/'
  ea.got = () => ({
    body: {
      id: 'ethicaladsio-test-generic-text',
      text: '<a><strong>EthicalAds</strong> is a developer-focused ad network from Read the Docs. Publisher &amp; Advertisers wanted.</a>',
      body,
      image: null,
      link: url,
      view_url: 'https://server.ethicalads.io/proxy/view/1050/Mo7FPcWUSOKbvmvD/',
      nonce: 'Mo7FPcWUSOKbvmvD',
      display_type: 'text-v1',
      campaign_type: 'house',
      div_id: 'test'
      // no copy field at all
    }
  })
  ea.saveViewUrls = sinon.stub().resolves()

  const ad = await ea.getAd({ sessionId: 'blah' })

  t.is(ad.title, 'Ethical Ad')
  t.is(ad.body, body)
})
