#!/usr/bin/env node
process.on('SIGINT', () => {
  console.log('\nSimba.js process cancelled\n')
  process.exit()
})

const main = require('../lib')

main()
