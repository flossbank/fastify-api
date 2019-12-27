require('dotenv').config()

const App = require('./app')
const { Db } = require('./db')
const { Auth } = require('./auth')
const { Sqs } = require('./sqs')
const { Registry } = require('./registry')

;(async function () {
  const db = new Db()
  const auth = new Auth()
  const sqs = new Sqs()
  const registry = new Registry()
  await db.connect()

  const app = await App({ db, auth, sqs, registry })
  try {
    await app.listen(8081)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
})()
