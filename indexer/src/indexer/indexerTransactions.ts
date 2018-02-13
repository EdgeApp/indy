import * as logger from 'winston'
import * as blockchainUtils from '../utils/blockchainUtils'
import * as dbUtils from '../utils/dbUtils'
import * as utils from '../utils/utils'
import { IndexerSettings } from '../indexer/indexerSettings'
import { configuration } from '../config/config'
import { Transaction } from '../../../common/models/transaction'
import { SortedMap } from 'collections/sorted-map'

const Web3 = require('web3')

// call to handle all indexing
export class IndexerTransactions{
  constructor() {
    this.web3 = new Web3()
    this.web3.setProvider(configuration.provider)  
    this.transactionCount = 0
  }

  web3: any
  indexSetttings : IndexerSettings
  transactionCount : number
  liveBlocksTransactionsMap: SortedMap<number, { transactions: Transaction[], blockHash :string }>

  // start procees, do first block range, then take next availble range
  async startIndexerProcess () {
    logger.info('startIndexerProcess')
  
    var totalStartTime = process.hrtime();
    // function init, try to read the indexer settings from DB
    try {
      this.indexSetttings = await dbUtils.getIndexerSettingsAsync('settingsid')
      logger.info(`startIndexerProcess, index setting exist, start index from ${this.indexSetttings.lastBlockNumber} to ${this.indexSetttings.endBlockNumber}`)
      // start chunk index
      await this.startIndex(this.indexSetttings.lastBlockNumber, this.indexSetttings.endBlockNumber) 
    } catch (error) {
      // error - first chunk, no settings in db yet, first time indexing
      if(!this.indexSetttings)
      {
        this.indexSetttings = new IndexerSettings()
        logger.info(`startIndexerProcess, first chunk, block # 0 to block # ${configuration.BlockChunkSize}`)
        this.indexSetttings.startBlockNumber = 45000 // no transactions before this block, we can index from here
        this.indexSetttings.lastBlockNumber = 45000
        this.indexSetttings.endBlockNumber = 45000 + configuration.BlockChunkSize
        await dbUtils.saveIndexerSettingsAsync(this.indexSetttings)
        logger.info(`startIndexerProcess, index setting created, first start index from ${this.indexSetttings.lastBlockNumber} to ${this.indexSetttings.endBlockNumber}`)
        // start first time chunk index
        await this.startIndex(this.indexSetttings.startBlockNumber, this.indexSetttings.endBlockNumber) 
      }
      else {
        logger.info(`startIndexerProcess error:, ${error}`)
        throw error
      }
    }
    
    let highestBlock : any
    let highestBlockNumber : number      

    // for all history blocks, up to the live MaxEphemeralForkBlocks blocks - index in chunks
    try {
      do {      
        highestBlock = await this.web3.eth.getBlock('pending')
        highestBlockNumber = highestBlock.number - configuration.MaxEphemeralForkBlocks
        //highestBlockNumber = 4050000 // temp patch for tests
        logger.info(`startIndexerProcess, highstBlock: ${highestBlockNumber}`)

        this.indexSetttings.startBlockNumber = this.indexSetttings.endBlockNumber + 1
        this.indexSetttings.lastBlockNumber = this.indexSetttings.startBlockNumber
        this.indexSetttings.endBlockNumber += configuration.BlockChunkSize
        if(this.indexSetttings.endBlockNumber > highestBlockNumber)
          this.indexSetttings.endBlockNumber = highestBlockNumber

        let startTime = process.hrtime();
        await this.startIndex(this.indexSetttings.startBlockNumber, this.indexSetttings.endBlockNumber) 
        let elapsedSeconds = utils.parseHrtimeToSeconds(process.hrtime(startTime));
        logger.info(`startIndexerProcess method, ${this.indexSetttings.endBlockNumber - this.indexSetttings.startBlockNumber} blocks, duration in sec: ${elapsedSeconds}`)                
        logger.info(`startIndexerProcess, indexSetttings: ${JSON.stringify(this.indexSetttings)}`)

      } while(this.indexSetttings.endBlockNumber < highestBlockNumber)
      logger.info(`startIndexerProcess finished index history to ,highestBlock: ${highestBlockNumber}`)
      var totalElapsedSeconds = utils.parseHrtimeToSeconds(process.hrtime(totalStartTime));
      logger.info(`startIndexerProcess history finished, duration in sec: ${totalElapsedSeconds}`)      
      
    } catch (error) {
      logger.info(`startIndexerProcess error:, ${error}`)
      throw error      
  }    
    logger.info('******************************************************************************')
    logger.info('**    startIndexerProcess history finished, satrt startLiveIndexerProcess    **')
    logger.info('******************************************************************************')
    await this.startLiveIndexerProcess()
  }

  // take care of the current range, fetch #BlockStep blocks and save 
  async startIndex (startBlock: number, endBlock: number) : Promise<void> {
    try {
      logger.info(`startIndex method, startBlock # ${startBlock} to endBlock # ${endBlock}`)
      while (startBlock < endBlock) {
        let start = startBlock
        let end = ((startBlock + configuration.BlockStep) <= endBlock) ? startBlock + configuration.BlockStep : endBlock
      
        var startTime = process.hrtime();
        await this.indexBlockRangeTransactions(start, end)
        var elapsedSeconds = utils.parseHrtimeToSeconds(process.hrtime(startTime));
        logger.info(`startIndex method, ${configuration.BlockStep} blocks, duration in sec: ${elapsedSeconds}`)
        
        startBlock += configuration.BlockStep
        if(startBlock >= endBlock)
          startBlock = endBlock

        this.indexSetttings.lastBlockNumber = end
        await dbUtils.saveIndexerSettingsAsync(this.indexSetttings)
        // do not wait for this call, let it run on the backgound
        dbUtils.refreshViews("dummyaccount")
      }     
    } catch (error) {
      logger.log('error',`startIndex error in blocks ${startBlock} - ${endBlock}, abort!`)
      logger.log('error',error)      
      throw(new Error('startIndex - error, abort!'))        
    }
  }

  // index by transactions
  async indexBlockRangeTransactions (startBlock: number, endBlock: number) : Promise<void> {
    try {
      let transactions = await blockchainUtils.getBlockTransactionsAsync(startBlock, endBlock)
      if(!transactions) {
        logger.log('error','blockchainUtils.getBlockTransactionsAsync return null, abort')
        throw(new Error('blockchainUtils.getBlockTransactionsAsync return null, abort.'))
      }
      logger.info(`indexBlockRangeTransactions ${transactions.length} transactions returned from block #${startBlock} to block #${endBlock}.`)
      this.transactionCount += transactions.length
      logger.info(`indexBlockRangeTransactions, total transactions so far in this run ${this.transactionCount}.`)
      await this.saveTransactions(transactions)
    } catch (error) {
      logger.log('error',`indexBlockRangeTransactions error in blocks ${startBlock} - ${endBlock}, abort`)
      logger.log('error',error)      
      throw(new Error('indexBlockRangeTransactions - error, abort!'))      
    }    
  }

  // save transactions in bulks
  async saveTransactions (transactions: any) : Promise<void> {
    try {
      while (transactions.length) 
      {
        let transactionsToSave = transactions.splice(0, configuration.LimitTransactionBlukSave)        
        try {
          await dbUtils.saveTransactionsBulkAsync(transactionsToSave)
        } catch (error) {
          logger.log('error','saveTransactions - error in dbutils while saving transactions, abort')
          logger.log('error',error)
          throw(new Error('saveTransactions - error in dbutils while saving transactions, abort'))      
        }
      }
    } catch (error) {
      logger.log('error',`saveTransactions error, abort`)
      logger.log('error',error)      
      throw(new Error('saveTransactions - error, abort'))      
    }    
  }    

  // method to index incoming blocks
  // always save 12 live blocks to avoid indexing reorg blocks
  // save older blocks
  async startLiveIndexerProcess() {
    this.indexSetttings = await dbUtils.getIndexerSettingsAsync('settingsid')
    let lastSavedBlock = this.indexSetttings.lastBlockNumber
    let lastHighestBlockNumber = this.indexSetttings.lastBlockNumber
    let highestBlock = await this.web3.eth.getBlock('pending')
    // debug patch
    //let lastHighestBlockNumber = highestBlock.number - 3
    //let lastSavedBlock = highestBlock.number - 30
    
    logger.info(`init startLiveIndexerProcess lastSavedBlock ${lastSavedBlock}`)
    logger.info(`init startLiveIndexerProcess highestBlock.number ${highestBlock.number}`)
    logger.info(`init startLiveIndexerProcess lastHighestBlockNumber ${lastHighestBlockNumber}`)    

    if((lastSavedBlock + 100) < highestBlock.number) {
      logger.error(`startLiveIndexerProcess lastSaveBlock ${lastSavedBlock} + 100 < highestBlock ${highestBlock.number}`)
      logger.error('startLiveIndexerProcess gap is too much, check what went wrong and restart the history indexing')
      throw(new Error('startLiveIndexerProcess gap is too much, check what went wrong and restart the history indexing'))
    }

    var startMapTime = process.hrtime();
    
    logger.info(`init startLiveIndexerProcess, fetch all blocks, from ${lastSavedBlock} to ${highestBlock.number}`)
    this.liveBlocksTransactionsMap = await blockchainUtils.getBlockTransactionsMapAsync(lastSavedBlock, highestBlock.number)    

    let elapsedMapSeconds = utils.parseHrtimeToSeconds(process.hrtime(startMapTime))
    logger.info(`init startLiveIndexerProcess blockchainUtils.getBlockTransactionsMapAsync sec: ${elapsedMapSeconds}`)      
    
    while(true) {
      var startTime = process.hrtime();

      logger.info(`************************************************`)
      logger.info(`************* live blocks loop *****************`)
      logger.info(`************************************************`)
      
      highestBlock = await this.web3.eth.getBlock('pending')
      logger.info(`live highestBlock.number ${highestBlock.number}`)
      logger.info(`live lastHighestBlockNumber ${lastHighestBlockNumber}`)

      // update the map to hold the current blocks
      await this.updateLiveBlocks(highestBlock)
      
      logger.info(`live update lastHighestBlockNumber ${lastHighestBlockNumber}`)
      lastHighestBlockNumber = highestBlock.number

      logger.info(`live saveAndRemoveHistoryBlocks, highest block: ${highestBlock.number}`)
      lastSavedBlock = await this.saveAndRemoveHistoryBlocks(highestBlock)

      let elapsedSeconds = utils.parseHrtimeToSeconds(process.hrtime(startTime))
      logger.info(`live update elpase sec: ${elapsedSeconds}`)      
      
      let nextFetch = (15 - elapsedSeconds) * 1000
      
      logger.info(`live update indexSetttings`)      
      this.indexSetttings.lastBlockNumber = lastSavedBlock
      this.indexSetttings.startBlockNumber = lastSavedBlock
      this.indexSetttings.endBlockNumber = lastSavedBlock      
      
      logger.info(`live lastSavedBlock ${lastSavedBlock}`)
      logger.info(`live highestBlock.number ${highestBlock.number}`)

      await dbUtils.saveIndexerSettingsAsync(this.indexSetttings)

      logger.info(`invoke again in :${nextFetch} sec`)      
      await utils.timeout(nextFetch)

    }
  } 
  
  // update the map to hold the last 12 update blocks
  // fetch block headers
  // for every block , check hash, if change, bring block again
  private async updateLiveBlocks(highestBlock: any) {
    logger.info(`live updateLiveBlocks highestBlock.number ${highestBlock.number}`)
    
    let changedBlocks = []
    let blockHeaders = await blockchainUtils.getBlockHeadersAsync(highestBlock.number)    
    for (let blockIndex = 0; blockIndex < blockHeaders.length; blockIndex++) {
      try {
        let block = blockHeaders[blockIndex]
        if(this.liveBlocksTransactionsMap.has(block.number)) {
          let blockEntry = this.liveBlocksTransactionsMap.get(block.number)
          if(blockEntry.blockHash != block.hash) {
            logger.info(`live updateLiveBlocks block ${block.number} hash changed, add to changed blocks`)
            changedBlocks.push(block)
          }
        }
        else {
          logger.info(`live updateLiveBlocks block ${block.number} not in live map, add to changed blocks`)
          changedBlocks.push(block)
        }
      } catch (error) {
        logger.error(error)
        throw error
      }
    }  
    // walk on all the blocks that need update, bring transactions for each block, and updte the live map
    try {
      if(changedBlocks.length > 0) {
        logger.info(`live updateLiveBlocks changedBlocks > 0, bring blocks`)
        for (let blockIndex = 0; blockIndex < changedBlocks.length; blockIndex++) {
          let blockNumber = changedBlocks[blockIndex].number
          // bring full block 
          let blockTransactions = await blockchainUtils.getSingleBlockTransactionsAsync(blockNumber) 
          logger.info(`live updateLiveBlocks update block ${blockNumber}`)
          this.liveBlocksTransactionsMap.set(blockNumber, {transactions: blockTransactions, blockHash: changedBlocks[blockIndex].hash})
        }
      }    
    } catch (error) {
      logger.error(error)
      throw error    
    }
  } 

  // keep the liveTransactionsMap always in size of MaxEphemeralForkBlocks (12)
  // save old blocks, and remove them from the map
  private async saveAndRemoveHistoryBlocks( highestBlock: any): Promise<number> {
    let offset = 0
    let blockNumber = highestBlock.number - configuration.MaxEphemeralForkBlocks
    let lastSave = blockNumber

    logger.info(`saveAndRemoveHistoryBlocks highestBlock ${highestBlock.number}`)
    logger.info(`saveAndRemoveHistoryBlocks liveTransactionsMap.length ${this.liveBlocksTransactionsMap.length}`)
    // make sure transactions map contain no more than MaxEphemeralForkBlocks (12)
    while(this.liveBlocksTransactionsMap.length > configuration.MaxEphemeralForkBlocks) {
      try {
        let entry = this.liveBlocksTransactionsMap.get(blockNumber)
        if(entry) {
          logger.info(`saveAndRemoveHistoryBlocks save and remove block ${blockNumber}`)
          await this.saveTransactions(entry.transactions)
          this.liveBlocksTransactionsMap.delete(blockNumber)
        } else {
          logger.info(`saveAndRemoveHistoryBlocks error, block ${blockNumber} not in map`)
        }
        blockNumber--
      } catch (error) {
        logger.error(error)
        throw error
      }
    }
    logger.info(`saveAndRemoveHistoryBlocks lastSave ${lastSave}`)
    return lastSave
  }  
}
