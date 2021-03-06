const test = require('ava')

test('stub', (t) => {
  t.true(true)
})

// const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')
// const { MSGS, ADVERTISER_WEB_SESSION_COOKIE } = require('../../../helpers/constants')

// test.before(async (t) => {
//   await before(t, async ({ db, auth }) => {
//     const advertiserId1 = await db.advertiser.create({
//       advertiser: {
//         name: 'Honesty',
//         email: 'honey@etsy.com',
//         password: 'beekeeperbookkeeper'
//       }
//     })
//     t.context.advertiserId1 = advertiserId1.toHexString()
//     const session1 = await auth.advertiser.createWebSession({ advertiserId: t.context.advertiserId1 })
//     t.context.sessionId1 = session1.sessionId
//     t.context.adId1 = await db.advertiser.createAdDraft({
//       advertiserId: advertiserId1,
//       draft: {
//         name: 'Teacher Fund #1',
//         title: 'Teacher Fund',
//         body: 'You donate, we donate.',
//         url: 'teacherfund.com'
//       }
//     })
//     t.context.adId2 = await db.advertiser.createAdDraft({
//       advertiserId: advertiserId1,
//       draft: {
//         name: 'Teacher Fund #2',
//         title: 'Teacher Fund 2',
//         body: 'You donate, we donate. 2',
//         url: 'teacherfund.com 2'
//       }
//     })

//     const advertiserId2 = await db.advertiser.create({
//       advertiser: {
//         name: 'Faith Ogler',
//         email: 'fogler@folgers.coffee',
//         password: 'beekeeperbookkeeper'
//       }
//     })
//     t.context.advertiserId2 = advertiserId2.toHexString()
//     const session2 = await auth.advertiser.createWebSession({ advertiserId: t.context.advertiserId2 })
//     t.context.sessionId2 = session2.sessionId
//     t.context.adId3 = await db.advertiser.createAdDraft({
//       advertiserId: advertiserId2,
//       draft: {
//         name: 'Teacher Fund #5',
//         title: 'Teacher Fund 5',
//         body: 'You donate, we donate. 5',
//         url: 'teacherfund.com 5'
//       }
//     })
//   })
// })

// test.beforeEach(async (t) => {
//   await beforeEach(t)
// })

// test.afterEach(async (t) => {
//   await afterEach(t)
// })

// test.after.always(async (t) => {
//   await after(t)
// })

// test('POST `/ad-campaign/create` 401 unauthorized | no session', async (t) => {
//   const res = await t.context.app.inject({
//     method: 'POST',
//     url: '/ad-campaign/create',
//     payload: {
//       adCampaign: {
//         ads: [],
//         maxSpend: 500000,
//         cpm: 500000,
//         name: 'camp pain 1'
//       }
//     },
//     headers: {
//       cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=not_a_gr8_cookie`
//     }
//   })
//   t.deepEqual(res.statusCode, 401)
// })

// test('POST `/ad-campaign/create` 200 success with ad drafts and keeping drafts', async (t) => {
//   const campaignToCreate = {
//     maxSpend: 500000,
//     cpm: 500000,
//     name: 'camp pain 2'
//   }
//   const res = await t.context.app.inject({
//     method: 'POST',
//     url: '/ad-campaign/create',
//     payload: {
//       adCampaign: campaignToCreate,
//       adDrafts: [t.context.adId1, t.context.adId2],
//       keepDrafts: true
//     },
//     headers: {
//       cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
//     }
//   })
//   t.deepEqual(res.statusCode, 200)
//   const payload = JSON.parse(res.payload)

//   t.deepEqual(payload.success, true)
//   const { id } = payload

//   const advertiser = await t.context.db.advertiser.get({ advertiserId: t.context.advertiserId1 })
//   // Should have kept advertiser drafts
//   t.deepEqual(advertiser.adDrafts.length, 2)

//   const campaign = advertiser.adCampaigns.find(camp => camp.id === id)
//   t.deepEqual(campaign.ads.length, 2)
//   t.deepEqual(campaign.approved, false)
//   t.deepEqual(campaign.maxSpend, campaignToCreate.maxSpend)
//   t.deepEqual(campaign.cpm, campaignToCreate.cpm)
//   t.deepEqual(campaign.name, campaignToCreate.name)
// })

// test('POST `/ad-campaign/create` 200 success with ad drafts and removing drafts', async (t) => {
//   const campaignToCreate = {
//     maxSpend: 500000,
//     cpm: 500000,
//     name: 'camp pain from drafts'
//   }
//   const res = await t.context.app.inject({
//     method: 'POST',
//     url: '/ad-campaign/create',
//     payload: {
//       adCampaign: campaignToCreate,
//       adDrafts: [t.context.adId3]
//     },
//     headers: {
//       cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=${t.context.sessionId2}`
//     }
//   })
//   t.deepEqual(res.statusCode, 200)
//   const payload = JSON.parse(res.payload)

//   t.deepEqual(payload.success, true)
//   const { id } = payload

//   const advertiser = await t.context.db.advertiser.get({ advertiserId: t.context.advertiserId2 })
//   // Should have deleted advertiser draft
//   t.deepEqual(advertiser.adDrafts.length, 0)

//   const campaign = advertiser.adCampaigns.find(camp => camp.id === id)
//   t.deepEqual(campaign.ads.length, 1)
//   t.deepEqual(campaign.approved, false)
//   t.deepEqual(campaign.maxSpend, campaignToCreate.maxSpend)
//   t.deepEqual(campaign.cpm, campaignToCreate.cpm)
//   t.deepEqual(campaign.name, campaignToCreate.name)
// })

// test('POST `/ad-campaign/create` 200 success without ads', async (t) => {
//   const campaignToCreate = {
//     ads: [],
//     maxSpend: 500000,
//     cpm: 500000,
//     name: 'camp pain 2'
//   }
//   const res = await t.context.app.inject({
//     method: 'POST',
//     url: '/ad-campaign/create',
//     payload: {
//       adCampaign: campaignToCreate
//     },
//     headers: {
//       cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
//     }
//   })
//   t.deepEqual(res.statusCode, 200)
//   const payload = JSON.parse(res.payload)

//   t.deepEqual(payload.success, true)
//   const { id } = payload

//   const campaign = await t.context.db.advertiser.getAdCampaign({
//     advertiserId: t.context.advertiserId1,
//     campaignId: id
//   })
//   t.deepEqual(campaign.name, campaignToCreate.name)
// })

// test('POST `/ad-campaign/create` 200 success with just new ads', async (t) => {
//   const adToCreate = {
//     name: 'Teacher Fund #3',
//     title: 'Teacher Fund 3',
//     body: 'Three\'s a crowd',
//     url: 'teacherfund.com'
//   }
//   const campaignToCreate = {
//     ads: [adToCreate],
//     maxSpend: 500000,
//     cpm: 500000,
//     name: 'camp pain 2'
//   }
//   const res = await t.context.app.inject({
//     method: 'POST',
//     url: '/ad-campaign/create',
//     payload: {
//       adCampaign: campaignToCreate
//     },
//     headers: {
//       cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
//     }
//   })
//   t.deepEqual(res.statusCode, 200)
//   const payload = JSON.parse(res.payload)

//   t.deepEqual(payload.success, true)
//   const { id } = payload

//   const campaign = await t.context.db.advertiser.getAdCampaign({
//     advertiserId: t.context.advertiserId1,
//     campaignId: id
//   })
//   t.deepEqual(campaign.name, campaignToCreate.name)
//   t.deepEqual(campaign.ads[0].name, adToCreate.name)
//   t.deepEqual(campaign.ads.length, 1)
// })

// test('POST `/ad-campaign/create` 200 success with new ads and ad drafts where draft is preserved', async (t) => {
//   const adToCreate = {
//     name: 'Teacher Fund #4',
//     title: 'Teacher Fund 4',
//     body: 'Three\'s a crowd',
//     url: 'teacherfund.com'
//   }
//   const campaignToCreate = {
//     ads: [adToCreate],
//     maxSpend: 500000,
//     cpm: 500000,
//     name: 'camp pain 2'
//   }
//   const res = await t.context.app.inject({
//     method: 'POST',
//     url: '/ad-campaign/create',
//     payload: {
//       adCampaign: campaignToCreate,
//       adDrafts: [t.context.adId1],
//       keepDrafts: true
//     },
//     headers: {
//       cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
//     }
//   })
//   t.deepEqual(res.statusCode, 200)
//   const payload = JSON.parse(res.payload)

//   t.deepEqual(payload.success, true)
//   const { id } = payload

//   const advertiser = await t.context.db.advertiser.get({ advertiserId: t.context.advertiserId1 })
//   // should preserve ad drafts
//   t.deepEqual(advertiser.adDrafts.length, 2)

//   const campaign = advertiser.adCampaigns.find(camp => camp.id === id)
//   t.deepEqual(campaign.name, campaignToCreate.name)
//   // should create both the ad from the adDrafts as well as the new ad
//   t.deepEqual(campaign.ads.length, 2)
// })

// test('POST `/ad-campaign/create` 400 bad request', async (t) => {
//   let res
//   res = await t.context.app.inject({
//     method: 'POST',
//     url: '/ad-campaign/create',
//     payload: {
//       adCampaign: {
//         cpm: 500000,
//         name: 'camp pain'
//       }
//     },
//     headers: {
//       cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
//     }
//   })
//   t.deepEqual(res.statusCode, 400)

//   res = await t.context.app.inject({
//     method: 'POST',
//     url: '/ad-campaign/create',
//     payload: {
//       adCampaign: {
//         maxSpend: 500000,
//         name: 'camp pain'
//       }
//     },
//     headers: {
//       cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
//     }
//   })
//   t.deepEqual(res.statusCode, 400)

//   res = await t.context.app.inject({
//     method: 'POST',
//     url: '/ad-campaign/create',
//     payload: {
//       adCampaign: {
//         maxSpend: 500000,
//         cpm: 500000
//       }
//     },
//     headers: {
//       cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
//     }
//   })
//   t.deepEqual(res.statusCode, 400)

//   res = await t.context.app.inject({
//     method: 'POST',
//     url: '/ad-campaign/create',
//     payload: {},
//     headers: {
//       cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
//     }
//   })
//   t.deepEqual(res.statusCode, 400)
// })

// test('POST `/ad-campaign/create` 400 bad request | trash ads', async (t) => {
//   const res = await t.context.app.inject({
//     method: 'POST',
//     url: '/ad-campaign/create',
//     payload: {
//       adCampaign: {
//         ads: [{
//           name: 'trash ad',
//           body: 'a\n\nbc',
//           title: 'ABC',
//           url: 'https://abc.com'
//         }],
//         maxSpend: 500000,
//         cpm: 500000,
//         name: 'camp pain'
//       }
//     },
//     headers: {
//       cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
//     }
//   })
//   t.deepEqual(res.statusCode, 400)
//   t.deepEqual(JSON.parse(res.payload), { success: false, message: MSGS.AD_NOT_CLEAN })
// })

// test('POST `/ad-campaign/create` 500 server error', async (t) => {
//   t.context.db.advertiser.createAdCampaign = () => { throw new Error() }
//   const res = await t.context.app.inject({
//     method: 'POST',
//     url: '/ad-campaign/create',
//     payload: {
//       adCampaign: {
//         ads: [],
//         maxSpend: 500000,
//         cpm: 500000,
//         name: 'camp pain'
//       }
//     },
//     headers: {
//       cookie: `${ADVERTISER_WEB_SESSION_COOKIE}=${t.context.sessionId1}`
//     }
//   })
//   t.deepEqual(res.statusCode, 500)
// })
