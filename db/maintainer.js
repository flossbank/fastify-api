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
    return this.db.collection('users').aggregate([
      {
        $match: {
          _id: new ObjectId(maintainerId)
        }
      }, {
        $unwind: {
          path: '$payouts'
        }
      }, {
        $match: {
          'payouts.paid': {
            $ne: true
          }
        }
      }, {
        $group: {
          _id: '$_id',
          payout: {
            $sum: '$payouts.amount'
          }
        }
      }
    ]).toArray()
  }
}

module.exports = MaintainerDbController
