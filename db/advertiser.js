const { ulid } = require('ulid')
const { ObjectId } = require('mongodb')
const bcrypt = require('bcrypt')
const Cleaner = require('../helpers/clean')
const { CODES, MSGS } = require('../helpers/constants')

class AdvertiserDbController {
  constructor ({ db }) {
    this.db = db
  }

  async approveAdCampaign ({ advertiserId, campaignId }) {
    return this.db.collection('advertisers').updateOne(
      { _id: ObjectId(advertiserId), 'adCampaigns.id': campaignId },
      { $set: { 'adCampaigns.$.approved': true } }
    )
  }

  async create ({ advertiser }) {
    const advertiserWithDefaults = Object.assign({}, advertiser, {
      adCampaigns: [],
      verified: false,
      active: true,
      adDrafts: [],
      billingInfo: {},
      password: await bcrypt.hash(advertiser.password, 10)
    })
    const { insertedId } = await this.db.collection('advertisers').insertOne(advertiserWithDefaults)
    return insertedId
  }

  async updateCustomerId ({ advertiserId, customerId }) {
    return this.db.collection('advertisers').updateOne({
      _id: ObjectId(advertiserId)
    }, {
      $set: { 'billingInfo.customerId': customerId }
    })
  }

  async updateHasCardInfo ({ advertiserId, last4 }) {
    return this.db.collection('advertisers').updateOne({
      _id: ObjectId(advertiserId)
    }, {
      $set: { 'billingInfo.last4': last4 }
    })
  }

  async verify ({ email }) {
    return this.db.collection('advertisers').updateOne({
      email
    }, {
      $set: { verified: true }
    })
  }

  async get ({ advertiserId }) {
    const advertiser = await this.db.collection('advertisers')
      .findOne({ _id: ObjectId(advertiserId) })

    if (!advertiser) return advertiser

    const { _id: id, ...rest } = advertiser
    delete rest.password
    return { id, ...rest }
  }

  async getByEmail ({ email }) {
    const advertiser = await this.db.collection('advertisers')
      .findOne({ email })

    if (!advertiser) return advertiser

    const { _id: id, ...rest } = advertiser
    delete rest.password
    return { id, ...rest }
  }

  async authenticate ({ email, password }) {
    const foundAdvertiser = await this.db.collection('advertisers').findOne({ email })
    if (!foundAdvertiser) return null
    if (!foundAdvertiser.verified) return null
    const passMatch = await bcrypt.compare(password, foundAdvertiser.password)
    if (!passMatch) return null
    const { _id: id, ...rest } = foundAdvertiser
    delete rest.password
    return { id, ...rest }
  }

  async createAdDraft ({ advertiserId, draft }) {
    if (!Cleaner.isAdClean(draft)) {
      const e = new Error(MSGS.AD_NOT_CLEAN)
      e.code = CODES.AD_NOT_CLEAN
      throw e
    }
    const adDraftWithDefaults = Object.assign({}, draft, { id: ulid() })
    await this.db.collection('advertisers').updateOne(
      { _id: ObjectId(advertiserId) },
      { $push: { adDrafts: adDraftWithDefaults } })
    return adDraftWithDefaults.id
  }

  async createAdCampaign (
    {
      advertiserId,
      adCampaign,
      adIdsFromDrafts = [],
      keepDrafts = false
    }) {
    const advertiser = await this.db.collection('advertisers').findOne({ _id: ObjectId(advertiserId) })

    // Construct default campaign
    const adCampaignWithDefaults = Object.assign({}, { ads: [] }, adCampaign, {
      id: ulid(),
      active: false,
      approved: false
    })

    // Check if the ads passed in are clean
    if (!adCampaignWithDefaults.ads.every(ad => Cleaner.isAdClean(ad))) {
      const e = new Error(MSGS.AD_NOT_CLEAN)
      e.code = CODES.AD_NOT_CLEAN
      throw e
    }

    // assign ad defaults
    adCampaignWithDefaults.ads = adCampaignWithDefaults.ads.map((ad) => {
      return Object.assign({}, ad, { impressions: [], id: ulid() })
    })

    // construct the list of ads from adDrafts (if any) and append them to the campaigns ads
    if (adIdsFromDrafts.length) {
      const adsFromDrafts = []
      for (const draftId of adIdsFromDrafts) {
        const draft = advertiser.adDrafts.find(draft => draft.id === draftId)
        if (!draft) {
          continue
        }
        adsFromDrafts.push(Object.assign({}, draft, {
          id: ulid(),
          impressions: []
        }))
      }

      adCampaignWithDefaults.ads = adCampaignWithDefaults.ads.concat(adsFromDrafts)
    }

    if (!keepDrafts && adIdsFromDrafts.length) {
      await this.db.collection('advertisers').updateOne(
        { _id: ObjectId(advertiserId) },
        {
          $push: { adCampaigns: adCampaignWithDefaults },
          $pull: {
            adDrafts: {
              id: { $in: adIdsFromDrafts }
            }
          }
        })
    } else {
      await this.db.collection('advertisers').updateOne(
        { _id: ObjectId(advertiserId) },
        { $push: { adCampaigns: adCampaignWithDefaults } })
    }

    return adCampaignWithDefaults.id
  }

  async getAdCampaign ({ advertiserId, campaignId }) {
    const advertiser = await this.db.collection('advertisers').findOne({
      _id: ObjectId(advertiserId)
    })

    if (!advertiser) return advertiser
    return advertiser.adCampaigns.find(c => c.id === campaignId)
  }

  async getAdCampaignsForAdvertiser ({ advertiserId }) {
    const advertiser = await this.db.collection('advertisers').findOne({ _id: ObjectId(advertiserId) })
    return advertiser.adCampaigns
  }

  async updateAdCampaign (
    {
      advertiserId,
      updatedAdCampaign,
      adIdsFromDrafts = [],
      keepDrafts = false
    }) {
    const { id: adCampaignId } = updatedAdCampaign
    const advertiser = await this.db.collection('advertisers').findOne({ _id: ObjectId(advertiserId) })
    const previousCampaign = advertiser.adCampaigns.find((camp) => camp.id === adCampaignId)
    // Grab the existing ads id's
    const previousAdsMap = previousCampaign.ads.reduce((map, ad) => {
      map.set(ad.id, ad)
      return map
    }, new Map())

    // Check if the ads passed in are clean
    if (!updatedAdCampaign.ads.every(ad => Cleaner.isAdClean(ad))) {
      const e = new Error(MSGS.AD_NOT_CLEAN)
      e.code = CODES.AD_NOT_CLEAN
      throw e
    }

    // Go through all ads to be added and if they're new, initialize them
    const adsToAdd = updatedAdCampaign.ads.map((ad) => {
      // If it's an existing ad, don't give fresh ID + impressions
      if (previousAdsMap.has(ad.id)) {
        return previousAdsMap.get(ad.id)
      }
      return Object.assign({}, ad, {
        id: ulid(),
        impressions: []
      })
    })

    // Create updated campaign and assign defaults to impression value and approved back to false
    const updatedCampaign = Object.assign({}, previousCampaign, updatedAdCampaign, {
      approved: false
    })

    // construct the list of ads from adDrafts (if any) and append them to the campaigns ads
    if (adIdsFromDrafts.length) {
      const adsFromDrafts = []
      for (const draftId of adIdsFromDrafts) {
        const draft = advertiser.adDrafts.find(draft => draft.id === draftId)
        adsFromDrafts.push(Object.assign({}, draft, {
          id: ulid(),
          impressions: []
        }))
      }

      updatedCampaign.ads = adsToAdd.concat(adsFromDrafts)
    }

    updatedCampaign.active = false

    if (!keepDrafts && adIdsFromDrafts.length) {
      return this.db.collection('advertisers').updateOne(
        { _id: ObjectId(advertiserId), 'adCampaigns.id': adCampaignId },
        {
          $set: { 'adCampaigns.$': updatedCampaign },
          $pull: {
            adDrafts: {
              id: { $in: adIdsFromDrafts }
            }
          }
        })
    } else {
      return this.db.collection('advertisers').updateOne(
        { _id: ObjectId(advertiserId), 'adCampaigns.id': adCampaignId },
        { $set: { 'adCampaigns.$': updatedCampaign } })
    }
  }

  async activateAdCampaign ({ advertiserId, campaignId }) {
    await this.db.collection('advertisers').updateOne({
      _id: ObjectId(advertiserId),
      'adCampaigns.id': campaignId
    }, {
      $set: { 'adCampaigns.$.active': true }
    })
  }
}

module.exports = AdvertiserDbController
