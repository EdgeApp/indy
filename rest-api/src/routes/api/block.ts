import * as express from 'express'
import * as logger from 'winston'
import * as blockUtils from '../../utils/blockUtils'
import { configuration } from '../../config/config'

const router = express.Router()

const Web3 = require('web3')
const web3 = new Web3()

web3.setProvider(configuration.provider)

router.get('/block/:number', async (req, res, next) => {
  let number = req.params.number

  let block = await web3.eth.getBlock(number, true)
  logger.info(`retrieving block # ${block.number}.`)

  let result = []
  let status = 0
  let message = 'FAIL'
  let count = 0

  if (block) {
    try {
      result = block.transactions
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
