module.exports = () => {
  if (process.env.NODE_ENV === 'local') require('./setEnvVars')
}
