import * as express from 'express'
import * as logger from 'winston'
import * as blockUtils from '../../utils/blockUtils'
import * as dbUtils from '../../utils/dbUtils'
import { configuration } from '../../config/config'

const router = express.Router()
const Web3 = require('web3')
const web3 = new Web3()
web3.setProvider(configuration.provider)

router.get('/:address/:contractAddress', async (req, res, next) => {
try {
  let highestBlock = await web3.eth.getBlock('pending')
  let highestBlockNumber = highestBlock.number  

  let limit = req.params.limit ? req.params.limit : 50
  let result = await dbUtils.getAccountContractTransactionsAsync(req.params.address, req.params.contractAddress, req.params.limit)
  result.forEach((transaction) => transaction.confirmations = highestBlockNumber - transaction.blockNumber)
  
  return res.json(
    {
      'status': '1',
      'message': 'OK',
      'result': result
    })
} catch (error) {
  return res.json(
    {
      'status': '0',
      'message': error,
      'result': 'not found'
    })
}
})


module.exports = router


