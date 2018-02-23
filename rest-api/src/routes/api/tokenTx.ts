import * as request from 'request-promise'
import * as express from 'express'
import * as logger from 'winston'
import * as dbViewUtils from '../../../../common/dbViewUtils'
import { configuration } from '../../config/config'
import { Transaction } from '../../../../common/models/transaction'

const router = express.Router()
const Web3 = require('web3')
const web3 = new Web3()
web3.setProvider(configuration.provider)

router.get('/:address/:contractAddress/:startBlock?/:endBlock?/:limit?', async (req, res, next) => {
  try {
    // highest block to calc confirmations
    let highestBlock = await web3.eth.getBlock('pending')
    let highestBlockNumber = highestBlock.number
    // startBlock and endBlock parameters
    let startBlock = req.params.startBlock != undefined ? parseInt(req.params.startBlock) : undefined
    let endBlock = req.params.endBlock != undefined ?parseInt(req.params.endBlock) : undefined
    // check start and end block validity
    if (startBlock > endBlock ||
      startBlock < 0 || 
      endBlock > highestBlockNumber) {
      throw( new Error(`Error in blocks parameters, startBlock: ${startBlock}, endBlock: ${endBlock}`))
    }    
    // calc the limit
    let limit = req.params.limit && req.params.limit >= 10 && req.params.limit <= 10000 ? req.params.limit : 10000
    let result = []
    let reqRes

    // first, check if we can include the live block.
    // then take the live transactions (12 blocks) from indexer. user the baseurl to fetch account, from or to requests.
    if (endBlock == undefined || (endBlock && (endBlock >= highestBlockNumber - configuration.MaxEphemeralForkBlocks))) {
      try {
        reqRes = await request({
          uri: 'indexer/liveBlocks/' + req.params.address + '/account',
          baseUrl: configuration._indexerUrl,
          json: true,
          timeout: 5000
        }) 
        // add the results to "result" array after filtering and limiting
        filterByBlocksAndLimit(startBlock, endBlock, reqRes.result, limit, result, highestBlockNumber, req.params.contractAddress)
      } catch (error) {
        logger.error('Error getting live blocks from indexer')
      }
    }    

    // if live didn't fill the limit, lets take more 
    let leftLimit = limit - result.length
    if (leftLimit > 0) {
      // performe get contract query, limit results with "leftLimit"
      let fromResult = await dbViewUtils.getAccountFromTransactionsAsync(req.params.address, leftLimit)
      // add the results to "result" array after filtering and limiting      
      filterByBlocksAndLimit(startBlock, endBlock, fromResult, leftLimit, result, highestBlockNumber, req.params.contractAddress)
    }

    if (leftLimit > 0) {
      // performe get contract query, limit results with "leftLimit"
      let toResult = await dbViewUtils.getAccountToTransactionsAsync(req.params.address, leftLimit)
      // add the results to "result" array after filtering and limiting      
      filterByBlocksAndLimit(startBlock, endBlock, toResult, leftLimit, result, highestBlockNumber, req.params.contractAddress)
    }    

    // sort results by block number
    result.sort((transactionA, transactionB) => {
      if (transactionA.blockNumber < transactionB.blockNumber){
        return -1;
      }
      if (transactionA.blockNumber > transactionB.blockNumber){
        return 1;
      }
      return 0
    })

    // We took "leftLimit" from the "from" query and the "to" query, so we need to make sure not to return more than limit.
    result = result.splice(0, limit)

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

function filterByBlocksAndLimit(startBlock: number, endBlock: number, resultFrom: Array<Transaction>, limit: number, 
                                result: Array<Transaction>, highestBlockNumber: number, contractAddress : string) {
  let numInserterd = 0;
  for (let index = 0; index < resultFrom.length && numInserterd < limit; index++) {
    let transaction = resultFrom[index]
    if ((contractAddress === transaction.to || contractAddress === transaction.contractAddress || contractAddress === transaction.from) 
       && ((startBlock != undefined && endBlock != undefined && 
          (transaction.blockNumber >= startBlock && transaction.blockNumber <= endBlock)) || 
          (startBlock === undefined && endBlock === undefined))) {
      
      result.push(transaction);
      transaction.confirmations = highestBlockNumber - transaction.blockNumber;
      delete transaction._id;
      numInserterd++;
    }
  }
}

module.exports = router
