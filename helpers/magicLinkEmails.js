const b36 = require('b36')

const encode = (something) => b36.encode(Buffer.from(something))

const baseUrl = (email, token, kind) => `https://login.flossbank.com/?e=${email}&token=${token}&kind=${kind}`

const baseData = (url, code) => `
Hi!
  
We have received a login attempt with the following code:
  
  ${code}
  
To complete the login process, please click the link below:
  
${url}

- Flossbank

--------------------

If you didn't attempt to log in but received this email, please ignore this email. If you are concerned about your account's safety, please reply to this email to get in touch with us.
  
`

const baseBody = (Data) => ({
  Body: {
    Text: {
      Charset: 'UTF-8',
      Data
    }
  },
  Subject: {
    Charset: 'UTF-8',
    Data: 'Flossbank Login Verification'
  }
})

module.exports = {
  USER: (email, token, code) => {
    const url = baseUrl(encode(email), token, 'user')
    const data = baseData(url, code)
    return baseBody(data)
  },
  ADVERTISER: () => {
    throw new Error('unimplemented')
  },
  MAINTAINER: () => {
    throw new Error('unimplemented')
  }
}
