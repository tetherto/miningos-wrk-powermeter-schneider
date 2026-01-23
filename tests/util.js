'use strict'

const crypto = require('crypto')
const randomIP = () => [...crypto.randomBytes(4)].join('.')

module.exports = { randomIP }
