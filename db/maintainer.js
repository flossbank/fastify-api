const { ObjectId } = require('mongodb')

class MaintainerDbController {
  constructor ({ db }) {
    this.db = db
  }

  async getOwnedPackages ({ maintainerId }) {
    const pkgs = await this.db.collection('packages').find({
      owner: maintainerId
    }).toArray()

    return pkgs.map(({ _id: id, ...rest }) => ({ id, ...rest }))
  }

  async updateIlpPointer ({ userId, ilpPointer }) {
    return this.db.collection('users').updateOne({
      _id: ObjectId(userId)
    }, {
      $set: { 'payoutInfo.ilpPointer': ilpPointer }
    })
  }

  // @returns an array of [{ _id: <packageId>, payout: <payoutInMS> }]
  async getPendingPayout ({ maintainerId }) {
    return this.db.collection('packages').aggregate([
      {
        $match: {
          'maintainers.userId': {
            $eq: maintainerId
          }
        }
      }, {
        $match: {
          $or: [
            {
              adRevenue: {
                $ne: null
              }
            }, {
              donationRevenue: {
                $ne: null
              }
            }
          ]
        }
      }, {
        $project: {
          adRevenue: {
            $filter: {
              input: '$adRevenue',
              as: 'adRev',
              cond: {
                $ne: [
                  '$$adRev.paid', true
                ]
              }
            }
          },
          donationRevenue: {
            $filter: {
              input: '$donationRevenue',
              as: 'donRev',
              cond: {
                $ne: [
                  '$$donRev.paid', true
                ]
              }
            }
          },
          maintainers: 1
        }
      }, {
        $project: {
          adRevenue: {
            $sum: '$adRevenue.amount'
          },
          donationRevenue: {
            $sum: '$donationRevenue.amount'
          },
          maintainers: 1
        }
      }, {
        $unwind: {
          path: '$maintainers',
          preserveNullAndEmptyArrays: false
        }
      }, {
        $match: {
          'maintainers.userId': maintainerId
        }
      }, {
        $project: {
          payout: {
            $sum: [
              {
                $multiply: [
                  '$adRevenue', '$maintainers.revenuePercent', 0.01
                ]
              }, {
                $multiply: [
                  '$donationRevenue', '$maintainers.revenuePercent', 0.01
                ]
              }
            ]
          }
        }
      }
    ]).toArray()
  }
}

module.exports = MaintainerDbController
