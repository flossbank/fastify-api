module.exports = (packages, maintainerId) => {
  return packages.map(p => ({
    name: p.name,
    dividend: 0,
    dividendAge: 0,
    totalRevenue: 0,
    maintainers: [maintainerId],
    owner: maintainerId
  }))
}
