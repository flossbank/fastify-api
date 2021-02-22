const test = require('ava')
const { ObjectId } = require('mongodb')
const { before, beforeEach, afterEach, after } = require('../../_helpers/_setup')

test.before(async (t) => {
  await before(t, async ({ db, auth }) => {
    const { id: packageId1 } = await db.package.create({
      name: 'flossbank',
      registry: 'npm',
      language: 'javascript',
      avatarUrl: undefined
    })
    t.context.packageId1 = packageId1.toString()

    const { id: orgId1 } = await db.organization.create({
      name: 'flossbank'
    })
    t.context.orgId1 = orgId1.toString()
    await db.db.collection('organizations').updateOne({
      _id: orgId1
    }, {
      $set: {
        publicallyGive: true
      }
    })

    const { id: orgId2 } = await db.organization.create({
      name: 'teacherfund'
    })
    t.context.orgId2 = orgId2.toString()
    await db.db.collection('organizations').updateOne({
      _id: orgId2
    }, {
      $set: {
        publicallyGive: true
      }
    })

    const { id: orgId3 } = await db.organization.create({
      name: 'teacherfund3'
    })
    t.context.orgId3 = orgId3.toString()
    await db.db.collection('organizations').updateOne({
      _id: orgId3
    }, {
      $set: {
        publicallyGive: true
      }
    })

    // THIS ORG IS NOT PUBLICALLY GIVING, SO SHOULD NEVER BE RETURNED
    const { id: orgId4 } = await db.organization.create({
      name: 'teacherfund4'
    })
    t.context.orgId4 = orgId4.toString()

    const { id: orgId5 } = await db.organization.create({
      name: 'teacherfund5'
    })
    t.context.orgId5 = orgId5.toString()
    await db.db.collection('organizations').updateOne({
      _id: orgId5
    }, {
      $set: {
        publicallyGive: true
      }
    })

    const { id: orgId6 } = await db.organization.create({
      name: 'teacherfund6',
      avatarUrl: 'https://redfin.com'
    })
    t.context.orgId6 = orgId6.toString()
    await db.db.collection('organizations').updateOne({
      _id: orgId6
    }, {
      $set: {
        publicallyGive: true
      }
    })

    const { id: orgId7 } = await db.organization.create({
      name: 'teacherfund7'
    })
    t.context.orgId7 = orgId7.toString()
    await db.db.collection('organizations').updateOne({
      _id: orgId7
    }, {
      $set: {
        publicallyGive: true
      }
    })

    const { id: orgId8 } = await db.organization.create({
      name: 'teacherfund8'
    })
    t.context.orgId8 = orgId8.toString()
    await db.db.collection('organizations').updateOne({
      _id: orgId8
    }, {
      $set: {
        publicallyGive: true
      }
    })

    const { id: orgId9 } = await db.organization.create({
      name: 'teacherfund9'
    })
    t.context.orgId9 = orgId9.toString()
    await db.db.collection('organizations').updateOne({
      _id: orgId9
    }, {
      $set: {
        publicallyGive: true
      }
    })

    const { id: orgId10 } = await db.organization.create({
      name: 'teacherfund10'
    })
    t.context.orgId10 = orgId10.toString()
    await db.db.collection('organizations').updateOne({
      _id: orgId10
    }, {
      $set: {
        publicallyGive: true
      }
    })

    const { id: orgId11 } = await db.organization.create({
      name: 'teacherfund11'
    })
    t.context.orgId11 = orgId11.toString()
    await db.db.collection('organizations').updateOne({
      _id: orgId11
    }, {
      $set: {
        publicallyGive: true
      }
    })

    const mockDonationRevenue = [
      {
        organizationId: t.context.orgId1,
        amount: 1000,
        timestamp: 1598475250862
      },
      {
        userId: '5f408f7f7311b720f775e165',
        amount: 20,
        timestamp: 1598475250810
      },
      {
        organizationId: t.context.orgId2,
        amount: 100,
        timestamp: 1598475250862
      },
      {
        organizationId: t.context.orgId1,
        amount: 500,
        timestamp: 1598475250862
      },
      {
        organizationId: t.context.orgId3,
        amount: 500,
        timestamp: 1598475250862
      },
      {
        organizationId: t.context.orgId4,
        amount: 500,
        timestamp: 1598475250862
      },
      {
        organizationId: t.context.orgId5,
        amount: 500,
        timestamp: 1598475250862
      },
      {
        organizationId: t.context.orgId6,
        amount: 500,
        timestamp: 1598475250862
      },
      {
        organizationId: t.context.orgId7,
        amount: 500,
        timestamp: 1598475250862
      },
      {
        organizationId: t.context.orgId8,
        amount: 500,
        timestamp: 1598475250862
      },
      {
        organizationId: t.context.orgId9,
        amount: 500,
        timestamp: 1598475250862
      },
      {
        organizationId: t.context.orgId10,
        amount: 500,
        timestamp: 1598475250862
      },
      {
        organizationId: t.context.orgId11,
        amount: 50,
        timestamp: 1598475250862
      },
      {
        organizationId: 'aaaaaaaaaaaa',
        amount: 500000,
        timestamp: 1598475250862
      }
    ]

    await db.db.collection('packages').updateOne({
      _id: ObjectId(t.context.packageId1)
    }, {
      $set: {
        donationRevenue: mockDonationRevenue
      }
    })

    const { id: packageId2 } = await db.package.create({
      name: 'js-deep-equals',
      registry: 'rubygems',
      language: 'ruby',
      avatarUrl: 'blah.com'
    })
    t.context.packageIdNoRevenue = packageId2.toString()
  })
})

test.beforeEach(async (t) => {
  await beforeEach(t)
})

test.afterEach(async (t) => {
  await afterEach(t)
})

test.after.always(async (t) => {
  await after(t)
})

test('GET `/package/get-supporting-companies` 200 | sorts and only returns top 10 minus org that isnt publically giving', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/package/get-supporting-companies',
    query: {
      id: t.context.packageId1
    }
  })
  t.deepEqual(res.statusCode, 200)
  // Doesnt return teacherfund11 which has least donation amount
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    companies: [
      {
        organizationId: t.context.orgId1,
        contributionAmount: 1500,
        name: 'flossbank',
        avatarUrl: ''
      },
      {
        organizationId: t.context.orgId3,
        contributionAmount: 500,
        name: 'teacherfund3',
        avatarUrl: ''
      },
      {
        organizationId: t.context.orgId5,
        contributionAmount: 500,
        name: 'teacherfund5',
        avatarUrl: ''
      },
      {
        organizationId: t.context.orgId6,
        contributionAmount: 500,
        name: 'teacherfund6',
        avatarUrl: 'https://redfin.com'
      },
      {
        organizationId: t.context.orgId7,
        contributionAmount: 500,
        name: 'teacherfund7',
        avatarUrl: ''
      },
      {
        organizationId: t.context.orgId8,
        contributionAmount: 500,
        name: 'teacherfund8',
        avatarUrl: ''
      },
      {
        organizationId: t.context.orgId9,
        contributionAmount: 500,
        name: 'teacherfund9',
        avatarUrl: ''
      },
      {
        organizationId: t.context.orgId10,
        contributionAmount: 500,
        name: 'teacherfund10',
        avatarUrl: ''
      }
    ]
  })
  const { companies } = JSON.parse(res.payload)
  // Make sure that an undefined org isn't included in the results of this endpoint
  t.true(companies.every(({ organizationId }) => organizationId !== 'aaaaaaaaaaaa'))
  // Make sure that the org that isnt publically giving is not returned
  t.true(companies.every(({ organizationId }) => organizationId !== t.context.orgId4))
})

test('GET `/package/get-supporting-companies` 200 | no revenue', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/package/get-supporting-companies',
    query: {
      id: t.context.packageIdNoRevenue
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    companies: []
  })
})

test('GET `/package/get-supporting-companies` [] no package', async (t) => {
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/package/get-supporting-companies',
    query: {
      id: 'aaaaaaaaaaaa'
    }
  })
  t.deepEqual(res.statusCode, 200)
  t.deepEqual(JSON.parse(res.payload), {
    success: true,
    companies: []
  })
})

test('GET `/package/get-supporting-companies` 500 error', async (t) => {
  t.context.db.package.getSupportingCompanies = () => { throw new Error() }
  const res = await t.context.app.inject({
    method: 'GET',
    url: '/package/get-supporting-companies',
    query: {
      id: t.context.packageId1
    }
  })
  t.deepEqual(res.statusCode, 500)
})
