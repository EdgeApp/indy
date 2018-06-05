import * as express from 'express'
import * as logger from 'winston'
import { configuration } from '../../config/config'

const router = express.Router()

const Web3 = require('web3')
const web3 = new Web3()

web3.setProvider(configuration.provider)

router.get('/latest', async (req, res, next) => {
  let address = req.params.address

  let block = await web3.eth.getBlock('latest')
  logger.info(`retrieving latest block # ${block.number}.`)

  let result = []
  let status = 0
  let message = `error fetching block # ${block}`
  let count = 0

  if (block) {
    try {
      result = block.number.toString()    
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
