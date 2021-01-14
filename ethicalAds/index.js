const got = require('got')
const fastifyPlugin = require('fastify-plugin')

class EthicalAds {
  constructor ({ config, docs }) {
    this.got = got
    this.docs = docs
    this.config = config
    this.constants = config.getEthicalAdsConfig()

    this.url = this.constants.HOUSE_ADS_ONLY
      ? 'https://server.ethicalads.io/api/v1/decision/?publisher=flossbank&div_ids=test&ad_types=text-v1&force_ad=ethicaladsio-test-generic-text'
      : 'https://server.ethicalads.io/api/v1/decision/?publisher=flossbank&div_ids=test&ad_types=text-v1'
  }

  // TODO support getting multiple ads at once
  async getAd ({ sessionId }) {
    const { body: response } = await this.got(this.url, {
      responseType: 'json'
    })

    const { body, copy = {}, link: url, view_url: viewUrl, nonce } = response
    const { headline, content, cta } = copy

    // https://github.com/readthedocs/ethical-ad-server/pull/302/files
    let textBody = ''
    if (content) {
      textBody += content
    }
    if (cta) {
      textBody += ' '
      textBody += cta
    }

    const id = `${this.constants.ETHICAL_AD_PREFIX}_${nonce}`
    const ad = {
      id,
      title: headline || 'Ethical Ad',
      body: textBody || body,
      url
    }

    await this.saveViewUrls({ sessionId, ads: [{ viewUrl, nonce }] })

    return ad
  }

  async saveViewUrls ({ sessionId, ads }) {
    const urls = ads.reduce((map, ad) => {
      return { ...map, [ad.nonce]: ad.viewUrl }
    }, {})

    // if session never completes, we don't want lingering tracking urls
    const expiration = Math.floor(Date.now() / 1000) + this.constants.AD_VIEW_TIMEOUT

    await this.docs.put({
      TableName: this.constants.AD_VIEW_URLS_TABLE,
      Item: { sessionId, urls, expiration }
    }).promise()
  }
}

exports.EthicalAds = EthicalAds

exports.ethicalAdsPlugin = (ethicalAds) => fastifyPlugin(async (fastify) => {
  fastify.decorate('ethicalAds', ethicalAds)
})
