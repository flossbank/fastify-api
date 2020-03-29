const b36 = require('b36')

const encode = (something) => b36.encode(Buffer.from(something))

const unsubscribeUrl = (email, token) => `https://api.flossbank.com/unsubscribe?e=${email}&token=${token}`

const baseData = (unsubscribeLink) => `
Hi!
  
Joel from the Flossbank team. Thanks for expressing interest in our product! We're building a world where writing open source software is financially rewarding. It's a long journey but we're stoked you're along for the ride with us.
  
As is, we're working with a small group of beta users to ensure a positive experience. As soon as we begin expanding the beta, we'll be sure to reach out via email.

Thanks for joining the community ♥
  
Flossbank


If you'd like to unsubscribe, please click the following link
${unsubscribeLink}
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
    Data: 'Welcome aboard'
  }
})

exports.betaEmails = {
  SUBSCRIBE: (email, token) => {
    const url = unsubscribeUrl(encode(email), token)
    const data = baseData(url)
    return baseBody(data)
  }
}
