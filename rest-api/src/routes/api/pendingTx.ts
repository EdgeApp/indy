import * as  express from 'express'
import * as  logger from 'winston'
import * as  blockUtils from '../../utils/blockUtils'
import { configuration } from '../../config/config'

const router = express.Router()

const Web3 = require('web3')
const web3 = new Web3()

web3.setProvider(configuration.provider)

// temporary implementation - will be taken from cache db
router.get('/txs/:address?', async (req, res, next) => {

  let address = req.params.address

  let block = await web3.eth.getBlock('pending')
  logger.info(`retrieving pending block # ${block.number}.`)

  let result
  if (block) {
    try {
      result = await blockUtils.getTransactions(block, address)
    } catch (error) {
      logger.info(error)
    }
  } else {
    result = `error fetching block # ${block}`
    logger.info(result)
  }
  return res.json(
    {
      "status": "1",
      "message": "OK",      
      'result' : result
    })})

module.exports = router
