import * as logger from 'winston'
import * as retry from 'async-retry'
import * as dbUtils from '../utils/dbUtils'
import * as utils from '../../../common/utils'
import { configuration } from '../config/config'
import { Transaction } from '../../../common/models/transaction'
import { SortedMap } from 'collections/sorted-map'
import { DropInfo } from '../../../common/models/dropInfo';


const Web3 = require('web3')
const web3 = new Web3()
web3.setProvider(configuration.provider)

//*********************************************************** */
//                  History METHODS
//*********************************************************** */
// fetch full blocks, include transactions. for every transaction, call getTransactionReceipt and construct a Transaction class
// function return an array of all transaction from block startBlock to block endBlock
export async function getBlockTransactionsAsync (startBlock: number, endBlock: number): Promise<Array<Transaction>> {
  let transactions = []
  let startIndex = startBlock
  try {
    while (startIndex < endBlock) {
      let blocksPromises = []
      let index
      let startTime = process.hrtime()
      // fetch all blocks async, limited to BlockReqeusts configuration
      for (index = 0; index < configuration.BlockReqeusts && startIndex < endBlock; index++) {
        // fetch full block, include transactions
        blocksPromises.push(web3.eth.getBlock(startIndex++, true))
      }
      logger.info(`getBlockTransactionsAsync waiting for blocks #${startIndex - index} - #${startIndex - 1} requests`)
      // wait for blocks
      let resBlocks = await Promise.all(blocksPromises)
      let elapsedSeconds = utils.parseHrtimeToSeconds(process.hrtime(startTime))      
      logger.info(`getBlockTransactionsAsync got blocks, duration in sec:, ${elapsedSeconds}`)
      // for every block, handle transactions
      let startTimeTransactions = process.hrtime()
      let transactionCount = 0
      for (let blockIndex = 0; blockIndex < resBlocks.length; blockIndex++) {
        let block = resBlocks[blockIndex]
        if (block) {
          try {
            let res = await getTransactionsFromBlockAsync(block)
            transactionCount += res.length
            if (res) {
              transactions = transactions.concat(res)
            }
          } catch (error) {
            // save fail blocks to setttings DB
            let drop = new DropInfo(block, error.message)
            dbUtils.saveDropsInfoAsync(drop)            
            logger.error(error)
            return null
          }
        }
      }
      let elapsedSecondsTransactions = utils.parseHrtimeToSeconds(process.hrtime(startTimeTransactions))      
      logger.info(`getBlockTransactionsAsync tx for blocks #${startIndex - configuration.BlockReqeusts} - #${startIndex - 1} : ${transactionCount}, duration in sec:, ${elapsedSecondsTransactions}`)
    }
  } catch (error) {
    logger.error(error)
    return null
  }
  logger.info(`total transaction ${transactions.length} in block #${startBlock} to block #${endBlock - 1}.`)
  return transactions
}

// fetch transactions body for each block
export async function getTransactionsFromBlockAsync (block): Promise<Array<Transaction>> {
  try {
    let transactionCount = 0
    if (block && block.transactions) {
      //logger.info(`block #${block.number}, transactions count ${block.transactions.length}.`)
      // fetch receipt and construct Array<Transactsion>
      let resTransactions = []
      await retry(async fetch => {
        // if anything throws, we retry
        resTransactions = await convertTransactionFormatAsync(block, block.transactions) 
        if (!resTransactions) {
          logger.error(`getTransactionsFromBlockAsync error fetch block #${block.number}, missing block`)
          throw(new Error(`getTransactionsFromBlockAsync error fetch block #${block.number}, missing block`))
        }
        //logger.info(`getTransactionsFromBlockAsync succsefuly feched block #${block.number}`)
      }, {
        retries: 50,
        maxTimeout: 5000
      })
      return resTransactions
    } 
  } catch (error) {
    dbUtils.saveDropsInfoAsync(new DropInfo(block, 'getTransactionsFromBlockAsync error fetch'))             
    logger.error(`getTransactionsFromBlockAsync error fetch block #${block.number}, missing block, saving to dropsDB`)
    return null
  }
} 

// get more info on transactions, from the transaction receipt
export async function convertTransactionFormatAsync (block: any, web3transactions: any[]): Promise<Array<Transaction>> {
  try {
    let transactions = []
    let transactionReceiptPromises = []
    // fetch all transactions async
    for (let index = 0; index < web3transactions.length; index++) {
      transactionReceiptPromises.push(web3.eth.getTransactionReceipt(web3transactions[index].hash))
    }
    //logger.info(`convertTransactionFormatAsync wait for ${web3transactions.length} transactions receipt requests .`)
    let resTransactionReceipt = await Promise.all(transactionReceiptPromises)
    // for each transaction, construct a Transaction and add to transactions array
    for (let index = 0; index < resTransactionReceipt.length; index++) {
      let web3tran = web3transactions.findIndex((t) => t.hash === resTransactionReceipt[index].transactionHash)
      let transaction = new Transaction(web3transactions[web3tran], block, resTransactionReceipt[index])
      //logger.info(`convertTransactionFormatAsync create transaction #${index}, transactions count ${resTransactionReceipt.length}.`)
      transactions.push(transaction)
    }
    return transactions
  } catch (error) {
    logger.error(`convertTransactionFormatAsync fail,  error ${error}`)
    logger.error(`convertTransactionFormatAsync block # ${block.number} fail, need to do again`)
    return null
  }
}

//*********************************************************** */
//                      LIVE METHODS
//*********************************************************** */

// get live blocks, save in map, block to its fetched transactions
export async function getBlockTransactionsMapAsync (startBlock: number, endBlock: number): Promise<SortedMap<number, {transactions: Array<Transaction>, blockHash: string}> > {
  let blockMap = new SortedMap()
  let startIndex = startBlock
  let transactionCount = 0
  // for all the block range, include the last block
  while (startIndex <= endBlock) {
    let blocksPromises = []
    // async as BlockReqeusts config size
    for (let index = 0; startIndex <= endBlock && index <= configuration.BlockReqeusts; index++, startIndex++) {
      // fetch full block, include transactions
      blocksPromises.push(web3.eth.getBlock(startIndex, true))
    }
    // wait for block result, for each block , get full tranaction info
    let resBlocks = await Promise.all(blocksPromises)
    for (let blockIndex = 0; blockIndex <= resBlocks.length; blockIndex++) {
      let block = resBlocks[blockIndex]
      if (block) {
        try {
          let transactions = await getTransactionsFromBlockAsync(block)
          blockMap.set(block.number, { transactions: transactions, blockHash: block.hash })
          transactionCount += transactions.length
        } catch (error) {
          logger.info(error)
          return null
        }
      }
    }
  }
  logger.info(`getBlockTransactionsMapAsync - total transactions ${transactionCount} in block #${startBlock} to block #${endBlock}.`)
  return blockMap
}
// get one block
export async function getSingleBlockTransactionsAsync (blockNumber: number): Promise<any> {
  logger.info(`getSingleBlockTransactionsAsync blockNumber ${blockNumber}.`)
  try {
    // fetch full block, include transactions
    let resBlock = await web3.eth.getBlock(blockNumber, true)
    let transactions = await getTransactionsFromBlockAsync(resBlock)
    return transactions
  } catch (error) {
    logger.error(`getSingleBlockTransactionsAsync fail for block ${blockNumber}`)
    logger.info(error)
    return null
  }
}

// get only block headers to detect reorg in the chain.
export async function getBlockHeadersAsync (latestBlockNumber: number): Promise<Array<any>> {
  let transactionCount = 0
  let blocksPromises = []
  // get only last MaxEphemeralForkBlocks block (12), include the pending block (lastestBlockNumber)
  for (let startIndex = latestBlockNumber - configuration.MaxEphemeralForkBlocks + 1; startIndex <= latestBlockNumber; startIndex++) {
    blocksPromises.push(web3.eth.getBlock(startIndex))
  }
  let resBlocks = await Promise.all(blocksPromises)
  logger.info(`getBlockHeadersAsync fetch ${resBlocks.length} blocks`)
  return resBlocks
}
