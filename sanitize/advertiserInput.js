module.exports = (advertiser) => {
  return {
    name: advertiser.name,
    email: advertiser.email,
    organization: advertiser.organization,
    password: advertiser.password,
    adCampaigns: advertiser.adCampaigns || [],
    billingInfo: advertiser.billingInfo,
    active: true
  }
}
