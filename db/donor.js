class DonorDbController {
  constructor ({ db }) {
    this.db = db
  }

  async createOrGetByAccessToken ({ token, codeHost, referralCode }) {
    const hostSpecificToken = `${codeHost}:${token}`
    let donor = await this.db.collection('donors').findOne({ token: hostSpecificToken })

    if (!donor) donor = this.create({ token, codeHost })

    const { _id: id, ...rest } = donor
    return { id, ...rest }
  }

  async create ({ token, codeHost, referralCode }) {
    const { insertedId } = await this.db.collection('donors').insertOne({
      codeHost: {
        host: codeHost,
        authToken: token
      },
      name: '',
      organization: '',
      referralCode,
      billingInfo: {},
      donationAmount: 0,
      globalDonation: false,
      donationAmountChanges: []
    })
    return { id: insertedId }
  }
}

module.exports = DonorDbController
