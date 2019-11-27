module.exports = {
  ads: [
    { _id: 'test-ad-0', name: 'ad', impressions: [], content: { body: 'abc', title: 'ABC', url: 'https://abc.com' }, advertiserId: 2, adCampaigns: [] },
    { _id: 'test-ad-1', name: 'ad', impressions: [], content: { body: 'def', title: 'DEF', url: 'https://def.com' }, advertiserId: 2, adCampaigns: [] },
    { _id: 'test-ad-2', name: 'ad', impressions: [], content: { body: 'ghi', title: 'GHI', url: 'https://ghi.com' }, advertiserId: 2, adCampaigns: [] },
    { _id: 'test-ad-3', name: 'ad', impressions: [], content: { body: 'jkl', title: 'JKL', url: 'https://jkl.com' }, advertiserId: 2, adCampaigns: [] },
    { _id: 'test-ad-4', name: 'ad', impressions: [], content: { body: 'mno', title: 'MNO', url: 'https://mno.com' }, advertiserId: 2, adCampaigns: [] },
    { _id: 'test-ad-5', name: 'ad', impressions: [], content: { body: 'pqr', title: 'PQR', url: 'https://pqr.com' }, advertiserId: 2, adCampaigns: [] }
  ],
  adCampaigns: [
    { _id: 'test-ad-campaign-0', ads: ['ad-1'], maxSpend: 100000, cpm: 100, active: false, createDate: 1234, startDate: 12345, endDate: 123456, spend: 0, name: 'first-campaign', advertiserId: 'advertiser' }
  ],
  advertisers: [
    { _id: 'test-advertiser-0', name: 'peter', email: 'peter@flossbank.com', organization: 'flossbank', password: 'test-pass', adCampaigns: [], billingInfo: 'peter@gmail.com', active: true }
  ],
  packages: [
    { _id: 'test-package-0', name: 'yttrium', dividend: 100, dividendAge: 0, totalRevenue: 100, maintainers: ['test-maintainer-0'], owner: 'test-maintainer-0' },
    { _id: 'test-package-1', name: 'js-deep-equals', dividend: 100, dividendAge: 0, totalRevenue: 100, maintainers: ['test-maintainer-1', 'test-maintainer-0'], owner: 'test-maintainer-1' }
  ],
  maintainers: [
    { _id: 'test-maintainer-0', name: 'peterdev', email: 'peterdev@dev.com', password: 'test-pass', npmToken: '', payoutEmail: 'peterpayout@dev.com', active: true },
    { _id: 'test-maintainer-1', name: 'joeldev', email: 'joeldev@dev.com', password: 'test-pass', npmToken: '', payoutEmail: 'joeldev@dev.com', active: true },
    { _id: 'test-maintainer-2', name: 'newjoeldev', email: 'joeldev2@dev.com', password: 'test-pass', npmToken: '', payoutEmail: 'joeldev2@dev.com', active: true }
  ],
  maintainerPackageRels: [
    { _id: 'test-rel-0', maintainerId: 'test-maintainer-0', packageId: 'test-package-1', revenuePercent: 90 },
    { _id: 'test-rel-1', maintainerId: 'test-maintainer-1', packageId: 'test-package-1', revenuePercent: 10 },
    { _id: 'test-rel-2', maintainerId: 'test-maintainer-2', packageId: 'test-package-1', revenuePercent: 0 }
  ]
}
