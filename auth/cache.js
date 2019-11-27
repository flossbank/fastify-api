function ApiKeyCache () {
  this.expires = false
  this.set = new Set()
}

ApiKeyCache.prototype.beginExpiring = function beginExpiring () {
  this.expires = Date.now() + (10 * 60 * 1000) // 10 minutes
}

ApiKeyCache.prototype.checkExpiration = function checkExpiration () {
  if (!this.expires) return false
  if (this.expires - Date.now() <= 0) {
    this.set = new Set()
    return true
  }
  return false
}

ApiKeyCache.prototype.add = function add (token) {
  this.checkExpiration()
  this.set.add(token)
  if (!this.expires) this.beginExpiring()
}

ApiKeyCache.prototype.remove = function remove (token) {
  this.checkExpiration()
  this.set.delete(token)
}

ApiKeyCache.prototype.has = function has (token) {
  this.checkExpiration()
  return this.set.has(token)
}

module.exports = ApiKeyCache
