require('dotenv').config()

const App = require('./app')
const { Db } = require('./db')
const { Auth } = require('./auth')

;(async function () {
  const db = new Db()
  await db.connect()

  const app = await App(db, new Auth())
  try {
    await app.listen(8081)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
})()
