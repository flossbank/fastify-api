const unsubscribeUrl = (email) => `https://api.flossbank.com/unsubscribe?email=${email}`

const baseData = (unsubscribeLink) => `
Hi!
  
Welcome to Flossbank. Thanks for expressing interest in our product! We're building a world where writing open source software is financially rewarding. It's a long journey but we're stoked you're along for the ride with us.
  
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
    Data: 'Flossbank - welcome aboard'
  }
})

exports.subscribeEmails = {
  SUBSCRIBE: (email) => {
    const url = unsubscribeUrl(email)
    const data = baseData(url)
    return baseBody(data)
  }
}
