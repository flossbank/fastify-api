function isClean (str) {
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    if (ch <= 31 || ch >= 127) return false
  }
  return true
}

function isAdClean (ad = {}) {
  const { title, body, url } = ad
  const parts = [title, body, url]
  return parts.every(part => typeof part === 'string') && parts.every(isClean)
}

module.exports = { isAdClean }
