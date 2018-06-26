import * as express from 'express'
import * as logger from 'winston'
import * as blockUtils from '../../utils/blockUtils'
import { configuration } from '../../config/config'
import { Transaction } from '../../../../common/models/transaction'

const router = express.Router()

const Web3 = require('web3')
const web3 = new Web3()

web3.setProvider(configuration.provider)

router.get('/transaction/:hash/:raw?', async (req, res, next) => {
  let hash = req.params.hash
  let raw = req.params.raw

  let transaction = await web3.eth.getTransaction(hash)
  logger.info(`retrieving transaction # ${hash}.`)

  let block = await web3.eth.getBlock(transaction.blockNumber)
  logger.info(`retrieving block # ${transaction.blockNumber}.`)


  var receipt = await web3.eth.getTransactionReceipt(transaction.hash)
  logger.info(`retrieving transaction receipt# ${hash}.`)

  let fullTransaction = new Transaction(transaction, block, receipt)

  let result
  let status = 0
  let message = 'FAIL'

  if (transaction) {
    try {
      result = raw ? transaction : fullTransaction
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
      'result': result
    })
})

module.exports = router
