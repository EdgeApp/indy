import * as request from 'request-promise'
import * as express from 'express'
import * as logger from 'winston'
import * as utils from '../../../../common/utils'
import * as commonDbUtils from '../../../../common/commonDbUtils'
import { configuration } from '../../config/config'
import { Transaction } from '../../../../common/models/transaction'

const Web3 = require('web3')
const web3 = new Web3()
web3.setProvider(configuration.provider)

const router = express.Router()
// return all transactions history for account address
router.get('/:address/:startBlock?/:endBlock?/:limit?', async (req, res, next) => {
  try {

    let totalStartTimeAccount = process.hrtime()

    // for performance messure only
    let filterInMemoryElapsedSeconds
    let filterDBElapsedSeconds

    // highest block to calc confirmations
    let highestBlock = await web3.eth.getBlock('latest')
    let highestBlockNumber = highestBlock.number

    // startBlock and endBlock parameters
    let startBlock = req.params.startBlock != undefined ? parseInt(req.params.startBlock) : 0
    let endBlock = (req.params.endBlock != undefined &&  parseInt(req.params.endBlock) <= highestBlockNumber) ? parseInt(req.params.endBlock) : highestBlockNumber
    endBlock = endBlock <= highestBlockNumber ? endBlock : highestBlockNumber
    // check start and end block validity
    if (startBlock > endBlock ||
      startBlock < 0) {
      throw( new Error(`REST API - Error in blocks range, startBlock: ${startBlock}, endBlock: ${endBlock}`))
    }
    // calc the limit
    let limit = req.params.limit && req.params.limit >= 10 && req.params.limit <= 10000 ? req.params.limit : 10000

    // account is for all, also from and to are supported
    let accountQuery: commonDbUtils.AccountQuery
    switch (req.baseUrl) {
      case '/account':
        accountQuery = commonDbUtils.AccountQuery.ALL
        break;
      case '/from':
        accountQuery = commonDbUtils.AccountQuery.FROM
          break;
      case '/to':
        accountQuery = commonDbUtils.AccountQuery.TO
        break;
    }

    let result = []
    let liveBlocks: boolean = false

    // first, check if we can include the live block.
    // then take the live transactions (12 blocks) from indexer. user the baseurl to fetch account, from or to requests.
    if (endBlock == undefined ||
       (endBlock && (endBlock >= highestBlockNumber - configuration.MaxEphemeralForkBlocks))) {
      try {
        let reqRes = await request({
          uri: 'indexer/liveBlocks/' + req.params.address + req.baseUrl,
          baseUrl: configuration._indexerUrl,
          json: true,
          timeout: 5000
        })

        logger.info(`Number of account results from liveblocks: ${result.length}`)

        // add the results to "result" array after filtering and limiting
        filterAndUpdateTransactionConfirmations(reqRes.result, startBlock, endBlock, limit, result, highestBlockNumber)
        liveBlocks = true
      } catch (error) {
        logger.error('Error getting live blocks from indexer')
      }
    }

    // if live didn't fill the limit, lets take more
    let leftLimit = limit - result.length

    if (accountQuery == commonDbUtils.AccountQuery.ALL && leftLimit > 0) {
      // performe "from" query, limit results with "leftLimit"
      // add the results to "result" array after filtering and limiting
      if(configuration.FilterInMemory) {
        let startTimeBlocks = process.hrtime()
        let resultAll = await commonDbUtils.getAccountTransactionsBlockRangeMemoryAllDBsAsync (req.params.address, startBlock, endBlock, commonDbUtils.AccountQuery.ALL, leftLimit)
        updateTransactonConfirmations(resultAll, highestBlockNumber)
        let totalElapsedSecondsBlocks = utils.parseHrtimeToSeconds(process.hrtime(startTimeBlocks))
        result = result.concat(resultAll)
        logger.info(`Filter in memory, elpased time in sec: ${totalElapsedSecondsBlocks}`)
        filterInMemoryElapsedSeconds =   totalElapsedSecondsBlocks
      }

      if(configuration.FilterInDB) {
        //Filter in DB
        let startTimeBlocks = process.hrtime()
        let resultAllDBfilter = await fetchAccountBlockRangeFromDB(req.params.address, startBlock, endBlock, leftLimit, highestBlockNumber, commonDbUtils.AccountQuery.ALL)
        result = result.concat(resultAllDBfilter)
        let totalElapsedSecondsBlocks = utils.parseHrtimeToSeconds(process.hrtime(startTimeBlocks))
        logger.info(`Filter in DB, elpased time in sec: ${totalElapsedSecondsBlocks}`)
        filterDBElapsedSeconds = totalElapsedSecondsBlocks
      }
    }

    if (accountQuery == commonDbUtils.AccountQuery.FROM && leftLimit > 0) {
      // performe "from" query, limit results with "leftLimit"
      // add the results to "result" array after filtering and limiting
      if(configuration.FilterInMemory) {
        let startTimeBlocks = process.hrtime()
        let resultFrom = await commonDbUtils.getAccountTransactionsBlockRangeMemoryAllDBsAsync (req.params.address, startBlock, endBlock, commonDbUtils.AccountQuery.FROM, leftLimit)
        updateTransactonConfirmations(resultFrom, highestBlockNumber)
        let totalElapsedSecondsBlocks = utils.parseHrtimeToSeconds(process.hrtime(startTimeBlocks))
        logger.info(`Filter in memory, elpased time in sec: ${totalElapsedSecondsBlocks}`)
        result = result.concat(resultFrom)
      }

      if(configuration.FilterInDB) {
        // Filter in DB
        let startTimeBlocks = process.hrtime()
        let resultFromDBFilter = await fetchAccountBlockRangeFromDB(req.params.address, startBlock, endBlock, leftLimit, highestBlockNumber, commonDbUtils.AccountQuery.FROM)
        result = result.concat(resultFromDBFilter)
        let totalElapsedSecondsBlocks = utils.parseHrtimeToSeconds(process.hrtime(startTimeBlocks))
        logger.info(`Filter in DB, elpased time in sec: ${totalElapsedSecondsBlocks}`)
      }
    }

    if (accountQuery == commonDbUtils.AccountQuery.TO && leftLimit > 0) {
      // performe "to" query, limit results with "leftLimit"
      // add the results to "result" array after filtering and limiting
      if(configuration.FilterInMemory) {
        let startTimeBlocks = process.hrtime()
        let resultTo = await commonDbUtils.getAccountTransactionsBlockRangeMemoryAllDBsAsync (req.params.address, startBlock, endBlock, commonDbUtils.AccountQuery.TO, leftLimit)
        updateTransactonConfirmations(resultTo, highestBlockNumber)
        let totalElapsedSecondsBlocks = utils.parseHrtimeToSeconds(process.hrtime(startTimeBlocks))
        logger.info(`Filter in memory, elpased time in sec: ${totalElapsedSecondsBlocks}`)
        result = result.concat(resultTo)
      }

      if(configuration.FilterInDB) {
        // Filter in DB
        let startTimeBlocks = process.hrtime()
        let resultToDBFilter = await fetchAccountBlockRangeFromDB(req.params.address, startBlock, endBlock, leftLimit, highestBlockNumber, commonDbUtils.AccountQuery.TO)
        result = result.concat(resultToDBFilter)
        let totalElapsedSecondsBlocks = utils.parseHrtimeToSeconds(process.hrtime(startTimeBlocks))
        logger.info(`Filter in DB, elpased time in sec: ${totalElapsedSecondsBlocks}`)
      }
    }

    let totalElapsedSecondsAccount = utils.parseHrtimeToSeconds(process.hrtime(totalStartTimeAccount))
    logger.info(`Total account query, elpased time in sec: ${totalElapsedSecondsAccount}`)

    return res.json(
      {
        'status': 1,
        'message': 'OK',
        'count': result.length,
        'includeLiveBlocks': liveBlocks,
        'totalElapsedSeconds': totalElapsedSecondsAccount,
//        'filterInMemoryElapsedSeconds': filterInMemoryElapsedSeconds,
//        'filterDBElapsedSeconds':  filterDBElapsedSeconds,
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
async function fetchAccountBlockRangeFromDB(address: string, startBlock: number, endBlock: number, limit: any, highestBlockNumber: number, query: commonDbUtils.AccountQuery) {
  let startTimeBlocks = process.hrtime()
  let resultFilterdBlocks = await commonDbUtils.getAccountTransactionsBlockRangeAllDBsAsync(address, startBlock, endBlock, query, limit)
  updateTransactonConfirmations(resultFilterdBlocks, highestBlockNumber)
  let totalElapsedSecondsBlocks = utils.parseHrtimeToSeconds(process.hrtime(startTimeBlocks))
  logger.info(`fetchFromAccountBlockRangeFromDB, elpased time in sec: ${totalElapsedSecondsBlocks}`)
  return resultFilterdBlocks
}

function updateTransactonConfirmations(resultFilterdBlocks: any[], highestBlockNumber: number) {
  for (let index = 0; index < resultFilterdBlocks.length; index++) {
    let transaction = resultFilterdBlocks[index];
    transaction.confirmations = highestBlockNumber - transaction.blockNumber
    delete transaction._id
  }
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




