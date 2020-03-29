const b36 = require('b36')

const encode = (something) => b36.encode(Buffer.from(something))

const baseUrl = (email, token, kind) => `https://verification.flossbank.com/?e=${email}&token=${token}&kind=${kind}`

const baseData = (url, why) => `
Hi!
  
Welcome to Flossbank. To verify your email so that you can start ${why}, click the following link:
  
${url}
  
Thanks for joining the community ♥
  
Flossbank
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
    Data: 'Verify your Flossbank email address'
  }
})

// TODO this is implicitly coupled with the auth kinds enum
// and the verification website (the url in the email) is also implicitly
// coupled to the same enum; maintaining proper uppercase/lowercase throughout
// the flow is a pain. want to rethink that enum / how it works / how to integrate
exports.activationEmails = {
  USER: (email, token) => {
    const url = baseUrl(encode(email), token, 'user')
    const why = 'supporting open source maintainers'
    const data = baseData(url, why)
    return baseBody(data)
  },
  ADVERTISER: (email, token) => {
    const url = baseUrl(encode(email), token, 'advertiser')
    const why = 'advertising to developers'
    const data = baseData(url, why)
    return baseBody(data)
  },
  MAINTAINER: (email, token) => {
    const url = baseUrl(encode(email), token, 'maintainer')
    const why = 'receiving compensation for your open source work'
    const data = baseData(url, why)
    return baseBody(data)
  }
}
