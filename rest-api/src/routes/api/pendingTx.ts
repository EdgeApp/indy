import * as express from 'express'
import * as logger from 'winston'
import * as blockUtils from '../../utils/blockUtils'
import { configuration } from '../../config/config'

const router = express.Router()

const Web3 = require('web3')
const web3 = new Web3()

web3.setProvider(configuration.provider)

router.get('/txs/:address?', async (req, res, next) => {
  let address = req.params.address

  let block = await web3.eth.getBlock('pending')
  logger.info(`retrieving pending block # ${block.number}.`)

  let result = []
  let status = 0
  let message = `error fetching block # ${block}`
  let count = 0

  if (block) {
    try {
      result = await blockUtils.getTransactions(block, address)
      result.forEach((transaction) => { 
        delete transaction._id     
      })      
      count = result.length
      message = 'OK'
      status = 1
    } catch (error) {
      message = 'FAIL'
      result = null
      logger.info(error)
    }
  }

  return res.json(
    {
      'status': status,
      'message': message,
      'count': count,
      'result': result
    })
})

module.exports = router
