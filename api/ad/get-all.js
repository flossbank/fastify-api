module.exports = async (req, res, fastify) => {
  if (!req.query.advertiserId) {
    res.status(400)
    return res.send({ success: false })
  }
  try {
    res.send(await fastify.mongo.collection('ads').find({ advertiserId: req.query.advertiserId }).toArray())
  } catch (e) {
    console.error(e)
    res.status(500)
    res.send()
  }
}
