import * as request from 'request-promise'
import * as express from 'express'
import * as logger from 'winston'
import * as commonDbUtils from '../../../../common/commonDbUtils'
import * as utils from '../../../../common/utils'
import { configuration } from '../../config/config'
import { Transaction } from '../../../../common/models/transaction'

const router = express.Router()
const Web3 = require('web3')
const web3 = new Web3()
web3.setProvider(configuration.provider)

router.get('/:address/:contractAddress/:startBlock?/:endBlock?/:limit?', async (req, res, next) => {
  try {
    // highest block to calc confirmations
    let highestBlock = await web3.eth.getBlock('latest')
    let highestBlockNumber = highestBlock.number

    // startBlock and endBlock parameters
    let startBlock = req.params.startBlock != undefined ? parseInt(req.params.startBlock) : 0
    let endBlock = req.params.endBlock != undefined ?parseInt(req.params.endBlock) : highestBlockNumber
    // check start and end block validity
    if (startBlock > endBlock ||
      startBlock < 0) {
      throw( new Error(`REST API - Error in blocks range, startBlock: ${startBlock}, endBlock: ${endBlock}`))
    }
    // calc the limit
    let limit = req.params.limit && req.params.limit >= 10 && req.params.limit <= 10000 ? req.params.limit : 10000

    let result = []
    let liveBlocks: boolean = false

    // first, check if we can include the live block.
    // then take the live transactions (12 blocks) from indexer. user the baseurl to fetch account, from or to requests.
    if (endBlock == undefined ||
       (endBlock && (endBlock >= highestBlockNumber - configuration.MaxEphemeralForkBlocks))) {
      try {
        let reqRes = await request({
          uri: 'indexer/liveBlocks/' + req.params.address + '/account',
          baseUrl: configuration._indexerUrl,
          json: true,
          timeout: 5000
        })
        // add the results to "result" array after filtering and limiting
        filterByBlocksAndLimit(startBlock, endBlock, reqRes.result, limit, result, highestBlockNumber, req.params.contractAddress)
        liveBlocks = true
      } catch (error) {
        logger.error('Error getting live blocks from indexer')
      }
    }

    // if live didn't fill the limit, lets take more
    let leftLimit = limit - result.length
    // take all the contracts transactions that are FROM the account
    if (leftLimit > 0) {
      // performe get contract query, limit results with "leftLimit"

      let resultFrom = await fetchAccountContractTransactionsBlockRangeFromDB(req.params.address, req.params.contractAddress, startBlock, endBlock, leftLimit, highestBlockNumber, commonDbUtils.AccountQuery.ALL)
      updateTransactonConfirmations(resultFrom, highestBlock)
      result = result.concat(resultFrom)
    }

    return res.json(
      {
        'status': 1,
        'message': 'OK',
        'count': result.length,
        'includeLiveBlocks': liveBlocks,
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
async function fetchAccountContractTransactionsBlockRangeFromDB(address: string, contractAddress: string, startBlock: number, endBlock: number, limit: any, highestBlockNumber: number, query: commonDbUtils.AccountQuery) {
  let startTimeBlocks = process.hrtime()
  let resultFilterdBlocks = await commonDbUtils.getAccountContractTransactionsBlockRangeAllDBsAsync(address, contractAddress, startBlock, endBlock, query, limit)

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

function filterByBlocksAndLimit(startBlock: number, endBlock: number, resultFrom: Array<Transaction>, limit: number,
                                result: Array<Transaction>, highestBlockNumber: number, contractAddress : string) {
  let numInserterd = 0;
  contractAddress = utils.toLowerCaseSafe(contractAddress)

  for (let index = 0; index < resultFrom.length && numInserterd < limit; index++) {
    let transaction = resultFrom[index]
    if ((contractAddress === utils.toLowerCaseSafe(transaction.to) ||
        contractAddress === utils.toLowerCaseSafe(transaction.contractAddress) ||
        contractAddress === utils.toLowerCaseSafe(transaction.from))
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
