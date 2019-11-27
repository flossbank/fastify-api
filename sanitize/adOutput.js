module.exports = (ads) => ads.map(
  ({ _id, content: { title, body, url } }) => ({ id: _id, title, body, url })
)
