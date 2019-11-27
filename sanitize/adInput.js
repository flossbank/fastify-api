/* eslint camelcase:0 */
module.exports = ({
  impressions = [],
  content,
  name,
  active = false,
  approved = false,
  advertiserId,
  adCampaigns = []
}) => ({
  impressions,
  content,
  name,
  active,
  approved,
  advertiserId,
  adCampaigns
})
