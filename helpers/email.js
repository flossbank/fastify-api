exports.apiKeyVerification = (email, token, kind) => {
  const url = `https://verification.flossbank.com/?email=${email}&token=${token}&kind=${kind}`
  const Data = `
Hi!
  
Welcome to Flossbank. To verify your email so that you can start supporting open source maintainers, click the following link:
  
${url}
  
Thanks for joining the community ♥
  
Flossbank
  `
  return {
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
  }
}
