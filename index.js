require('dotenv').config()

const App = require('./app')
const { Db } = require('./db')
const { Auth } = require('./auth')
const { Sqs } = require('./sqs')

;(async function () {
  const db = new Db()
  const auth = new Auth()
  const sqs = new Sqs()
  await db.connect()

  const app = await App({ db, auth, sqs })
  try {
    await app.listen(8081)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
})()
