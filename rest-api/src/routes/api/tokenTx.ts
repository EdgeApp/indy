import * as express from 'express'
import * as logger from 'winston'
import * as blockUtils from '../../utils/blockUtils'
import { configuration } from '../../config/config'

const router = express.Router()
const Web3 = require('web3')
const web3 = new Web3()
web3.setProvider(configuration.provider)

router.get('/tokens/:address?', async (req, res, next) => {
  return res.json('TBD')
})

module.exports = router
