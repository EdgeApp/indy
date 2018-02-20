import * as request from 'request-promise'
import * as express from 'express'
import * as logger from 'winston'
import * as dbViewUtils from '../../../../common/dbViewUtils'
import { configuration } from '../../config/config'

const Web3 = require('web3')
const web3 = new Web3()
web3.setProvider(configuration.provider)

const router = express.Router()
// return all transactions history for account address
router.get('/:address/:limit?/:skip?', async (req, res, next) => {
  try {
    let highestBlock = await web3.eth.getBlock('pending')
    let highestBlockNumber = highestBlock.number

    let isAccount = req.baseUrl == '/account'
    let isFrom = req.baseUrl == '/from' || isAccount
    let isTo = req.baseUrl == '/to' || isAccount 

    let limit = req.params.limit && req.params.limit >= 50 && req.params.limit <= 1000 ? req.params.limit : 50
    let skip = req.params.skip 
    let result = []
    
    // first, take the live transactions (12 blocks)
    let reqRes
    try {
      reqRes = await request({
        uri: 'indexer/liveBlocks/' + req.params.address + req.baseUrl,
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

    // if live didn't fill the limit, take more 
    let limitLeft = limit - result.length

    if(isFrom && limitLeft > 0) {
      let resultFrom = await dbViewUtils.getAccountFromTransactionsAsync(req.params.address, limitLeft)
      resultFrom.forEach((transaction) => { 
        transaction.confirmations = highestBlockNumber - transaction.blockNumber
        delete transaction._id     
      })
      result = result.concat(resultFrom)
    }

    limitLeft = limit - result.length

    if(isTo && limitLeft > 0) {
      let resultTo = await dbViewUtils.getAccountToTransactionsAsync(req.params.address, limitLeft)
      resultTo.forEach((transaction) => { 
        transaction.confirmations = highestBlockNumber - transaction.blockNumber
        delete transaction._id     
      })    
      result = result.concat(resultTo)
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
