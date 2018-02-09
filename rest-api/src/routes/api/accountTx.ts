import * as express from 'express'
import * as logger from 'winston'
import * as dbUtils from '../../utils/dbUtils'
import { configuration } from '../../config/config'

const Web3 = require('web3')
const web3 = new Web3()
web3.setProvider(configuration.provider)

const router = express.Router()
// return all transactions history for account address
router.get('/:address/:limit?', async (req, res, next) => {
  try {
    //let result = await dbUtils.getAccountAsync(req.params.address)
    let highestBlock = await web3.eth.getBlock('pending')
    let highestBlockNumber = highestBlock.number  

    let limit = req.params.limit ? req.params.limit : 50
    let resultTo = await dbUtils.getAccountToTransactionsAsync(req.params.address, req.params.limit)
    resultTo.forEach((transaction) => transaction.confirmations = highestBlockNumber - transaction.blockNumber)
    
    let resultFrom = await dbUtils.getAccountFromTransactionsAsync(req.params.address, req.params.limit)
    resultFrom.forEach((transaction) => transaction.confirmations = highestBlockNumber - transaction.blockNumber)    

    let result = resultTo.concat(resultFrom)
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
