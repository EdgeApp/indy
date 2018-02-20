import * as request from 'request-promise'
import * as express from 'express'
import * as logger from 'winston'
import * as dbViewUtils from '../../../../common/dbViewUtils'
import { configuration } from '../../config/config'

const router = express.Router()
const Web3 = require('web3')
const web3 = new Web3()
web3.setProvider(configuration.provider)

router.get('/:address/:contractAddress/:limit?/:skip?', async (req, res, next) => {
  try {
    let highestBlock = await web3.eth.getBlock('pending')
    let highestBlockNumber = highestBlock.number

    let limit = req.params.limit && req.params.limit >= 50 && req.params.limit <= 1000 ? req.params.limit : 50  
    let result = []

    let reqRes
    try {
        reqRes = await request({
        uri: 'indexer/liveBlocks/' + req.params.address + '/account',
        baseUrl: 'http://127.0.0.1:3001/',
        json: true,
        timeout: 5000
      })   
      reqRes.result.forEach((transaction) => { 
        transaction.confirmations = highestBlockNumber - transaction.blockNumber
        delete transaction._id     
      })
      result = reqRes.result.splice(0, limit)
    } catch (error) {
      logger.error('Error getting live blocks from indexer')
    }

    let limitLeft = limit - result.length
    
    if(limitLeft > 0) {     
      let historyResult = await dbViewUtils.getAccountContractTransactionsAsync(req.params.address, req.params.contractAddress, limitLeft)
      historyResult.forEach((transaction) => transaction.confirmations = highestBlockNumber - transaction.blockNumber)
      result = result.concat(historyResult)
    }

    return res.json(
      {
        'status': 1,
        'message': 'OK',
        'count': result.length,
        'includeLiveBlocks' : reqRes != undefined,         
        'result': result
      })
  } catch (error) {
    return res.json(
      {
        'status': 0,
        'message': error,
        'result': 'not found'
      })
  }
})

module.exports = router
