const removeUndefinedKeyValues = (obj) => {
  Object.keys(obj).forEach(key => {
    if (typeof obj[key] === 'undefined') delete obj[key]
  })
  return obj
}

module.exports = {
  removeUndefinedKeyValues
}
