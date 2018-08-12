import * as express from 'express'
import * as logger from 'winston'
import * as blockUtils from '../../utils/blockUtils'
import { configuration } from '../../config/config'

const router = express.Router()

const Web3 = require('web3')
const web3 = new Web3()

web3.setProvider(configuration.provider)

router.get('/:address', async (req, res, next) => {

  let result = []
  let status = 0
  let message = 'FAIL'

  try {
    let address = req.params.address
    let balance = await web3.eth.getBalance(address)
    logger.info(`retrieving balance for address ${address}.`)

    result = balance
    message = 'OK'
    status = 1
  } catch (error) {
      message = 'FAIL'
      result = null
      logger.info(error)
  }

  return res.json(
    {
      'status': status,
      'message': message,
      'result': result
    })
})

module.exports = router
