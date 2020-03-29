require('dotenv').config()

const App = require('./app')
const { Db } = require('./db')
const { Auth } = require('./auth')
const { Sqs } = require('./sqs')
const { Email } = require('./email')
const { Registry } = require('./registry')
const { Url } = require('./url')
const { Stripe } = require('./stripe')

;(async function () {
  const db = new Db()
  const auth = new Auth()
  const email = new Email()
  const sqs = new Sqs()
  const stripe = new Stripe()
  const registry = new Registry()
  const url = new Url()
  await db.connect()

  const app = await App({ db, auth, sqs, email, stripe, registry, url })
  try {
    await app.listen(8081)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
})()
