import * as request from 'request-promise'
import * as express from 'express'
import * as logger from 'winston'
import * as utils from '../../../../common/utils'
import * as dbViewUtils from '../../../../common/dbViewUtils'
import { configuration } from '../../config/config'
import { Transaction } from '../../../../common/models/transaction'


const Web3 = require('web3')
const web3 = new Web3()
web3.setProvider(configuration.provider)

const router = express.Router()
// return all transactions history for account address
router.get('/:address/:startBlock?/:endBlock?/:limit?', async (req, res, next) => {
  try {
    // highest block to calc confirmations
    let highestBlock = await web3.eth.getBlock('pending')
    let highestBlockNumber = highestBlock.number

    // startBlock and endBlock parameters
    let startBlock = req.params.startBlock != undefined ? parseInt(req.params.startBlock) : 0
    let endBlock = req.params.endBlock != undefined ?parseInt(req.params.endBlock) : 999999999
    // check start and end block validity
    if (startBlock > endBlock ||
      startBlock < 0) {
      throw( new Error(`REST API - Error in blocks range, startBlock: ${startBlock}, endBlock: ${endBlock}`))
    }
    
    // calc the limit
    let limit = req.params.limit && req.params.limit >= 10 && req.params.limit <= 10000 ? req.params.limit : 10000    
  
    // account is for all, also from and to are supported
    let isAccount = req.baseUrl == '/account'
    let isFrom = req.baseUrl == '/from' || isAccount
    let isTo = req.baseUrl == '/to' || isAccount 

    let result = []
    let reqRes

    // first, check if we can include the live block.
    // then take the live transactions (12 blocks) from indexer. user the baseurl to fetch account, from or to requests.
    if (endBlock == undefined || 
       (endBlock && (endBlock >= highestBlockNumber - configuration.MaxEphemeralForkBlocks))) {
      try {
        reqRes = await request({
          uri: 'indexer/liveBlocks/' + req.params.address + req.baseUrl,
          baseUrl: configuration._indexerUrl,
          json: true,
          timeout: 5000
        }) 
        // add the results to "result" array after filtering and limiting
        filterAndUpdateTransactionConfirmations(reqRes.result, startBlock, endBlock,  limit, result, highestBlockNumber)
      } catch (error) {
        logger.error('Error getting live blocks from indexer')
      }
    }

    // if live didn't fill the limit, lets take more 
    let leftLimit = limit - result.length

    if (isFrom && leftLimit > 0) {
      // performe "from" query, limit results with "leftLimit"
      // add the results to "result" array after filtering and limiting      
      //await filterFromByBlocksAndLimit(req.params.address, startBlock, endBlock, leftLimit, result, highestBlockNumber)

      let resultFrom = await fetchFromAccountBlockRangeFromDB(req.params.address, startBlock, endBlock, leftLimit, highestBlockNumber)
      result.concat(resultFrom)
    }

    if (isTo && leftLimit > 0) {
      // performe "to" query, limit results with "leftLimit"      
      // add the results to "result" array after filtering and limiting            
      //await filterToByBlocksAndLimit(req.params.address, startBlock, endBlock, leftLimit, result, highestBlockNumber)

      let resultTo = await fetchToAccountBlockRangeFromDB(req.params.address, startBlock, endBlock, leftLimit, highestBlockNumber)
      result.concat(resultTo)
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


// DB filter methods
async function fetchFromAccountBlockRangeFromDB(address: string, startBlock: number, endBlock: number, limit: any, highestBlockNumber: number) {
  let startTimeBlocks = process.hrtime()
  let resultFilterdBlocks = await dbViewUtils.getAccountFromTransactionsBlockRangeAsync(address, startBlock, endBlock, limit)
  updateTransactonConfirmations(resultFilterdBlocks, highestBlockNumber)   
  let totalElapsedSecondsBlocks = utils.parseHrtimeToSeconds(process.hrtime(startTimeBlocks))
  logger.info(`fetchFromAccountBlockRangeFromDB, elpased time in sec: ${totalElapsedSecondsBlocks}`)
}

async function fetchToAccountBlockRangeFromDB(address: string, startBlock: number, endBlock: number, limit: any, highestBlockNumber: number) {
  let startTimeBlocks = process.hrtime()
  let resultFilterdBlocks = await dbViewUtils.getAccountFromTransactionsBlockRangeAsync(address, startBlock, endBlock, limit);
  updateTransactonConfirmations(resultFilterdBlocks, highestBlockNumber)
  let totalElapsedSecondsBlocks = utils.parseHrtimeToSeconds(process.hrtime(startTimeBlocks))
  logger.info(`fetchToAccountBlockRangeFromDB, elpased time in sec: ${totalElapsedSecondsBlocks}`)
}

function updateTransactonConfirmations(resultFilterdBlocks: any[], highestBlockNumber: number) {
  for (let index = 0; index < resultFilterdBlocks.length; index++) {
    let transaction = resultFilterdBlocks[index];
    transaction.confirmations = highestBlockNumber - transaction.blockNumber
    delete transaction._id
  }
}

// in memory filter methods - should be remove - save for now
async function filterFromByBlocksAndLimit(address: string, startBlock: number, endBlock: number, limit: number, result: Array<Transaction>, highestBlockNumber: number) {
  let startTimeBlocks = process.hrtime()
  let resultFrom = await dbViewUtils.getAccountFromTransactionsAsync(address)
  filterAndUpdateTransactionConfirmations(resultFrom, limit, startBlock, endBlock, result, highestBlockNumber)
  let totalElapsedSecondsBlocks = utils.parseHrtimeToSeconds(process.hrtime(startTimeBlocks))
  logger.info(`filterFromByBlocksAndLimit, elpased time in sec: ${totalElapsedSecondsBlocks}`)
}


async function filterToByBlocksAndLimit(address: string, startBlock: number, endBlock: number, limit: number, result: Array<Transaction>, highestBlockNumber: number) {
  let startTimeBlocks = process.hrtime()
  let resultFrom = await dbViewUtils.getAccountToTransactionsAsync(address)
  filterAndUpdateTransactionConfirmations(resultFrom, limit, startBlock, endBlock, result, highestBlockNumber)
  let totalElapsedSecondsBlocks = utils.parseHrtimeToSeconds(process.hrtime(startTimeBlocks))
  logger.info(`filterToByBlocksAndLimit, elpased time in sec: ${totalElapsedSecondsBlocks}`)
}

function filterAndUpdateTransactionConfirmations(resultFrom: any[], limit: number, startBlock: number, endBlock: number, result: Transaction[], highestBlockNumber: number) {
  let numInserterd = 0
  for (let index = 0; index < resultFrom.length && numInserterd < limit; index++) {
    let transaction = resultFrom[index]
    if ((startBlock != undefined && endBlock != undefined &&
      (transaction.blockNumber >= startBlock && transaction.blockNumber <= endBlock)) ||
      (startBlock === undefined && endBlock === undefined)) {
      result.push(transaction)
      transaction.confirmations = highestBlockNumber - transaction.blockNumber
      delete transaction._id
      numInserterd++
    }
  }
}


module.exports = router




