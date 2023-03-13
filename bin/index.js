#!/usr/bin/env node
process.on('SIGINT', () => {
  console.log('Simba.js process cancelled')
  process.exit()
})

const main = require('../lib')

main()
