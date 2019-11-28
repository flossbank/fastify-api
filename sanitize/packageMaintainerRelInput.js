module.exports = (packages, maintainerId) => {
  return packages.map(p => ({
    maintainerId: maintainerId,
    packageId: p._id,
    revenuePercent: 100
  }))
}
