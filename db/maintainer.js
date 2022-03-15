const { ObjectId } = require('mongodb')

class MaintainerDbController {
  constructor ({ db }) {
    this.db = db
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
    const aggPipeline = [
      {
        $match: {
          _id: new ObjectId(maintainerId)
        }
      }, {
        $project: {
          _id: 1,
          email: 1,
          pendingPayouts: {
            $filter: {
              input: '$payouts',
              as: 'payouts',
              cond: {
                $ne: [
                  '$$payouts.paid', true
                ]
              }
            }
          },
          totalPaidOut: {
            $filter: {
              input: '$payouts',
              as: 'payouts',
              cond: {
                $eq: [
                  '$$payouts.paid', true
                ]
              }
            }
          }
        }
      }, {
        $project: {
          _id: 1,
          pendingPayout: {
            $sum: '$pendingPayouts.amount'
          },
          totalPaidOut: {
            $sum: '$totalPaidOut.amount'
          }
        }
      }
    ]
    return this.db.collection('users').aggregate(aggPipeline).toArray()
  }
}

module.exports = MaintainerDbController
