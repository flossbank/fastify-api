module.exports = (maintainer) => {
  return {
    name: maintainer.name,
    email: maintainer.email,
    password: maintainer.password,
    npmToken: maintainer.npmToken || '',
    payoutEmail: maintainer.payoutEmail,
    active: true
  }
}
