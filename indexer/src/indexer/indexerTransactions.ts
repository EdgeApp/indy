import * as logger from 'winston'
import * as blockchainUtils from '../utils/blockchainUtils'
import * as dbUtils from '../utils/dbUtils'
import * as utils from '../../../common/utils'
import { IndexerSettings } from '../indexer/indexerSettings'
import { configuration } from '../config/config'
import { Transaction } from '../../../common/models/transaction'
import { SortedMap } from 'collections/sorted-map'

const Web3 = require('web3')

// call to handle all indexing
export class IndexerTransactions {
  constructor () {
    this.web3 = new Web3()
    this.web3.setProvider(configuration.provider)
    this.transactionCount = 0
  }

  web3: any
  // save the last index and the current range
  indexSetttings : IndexerSettings
  // for printing only 
  transactionCount : number
  // save the live blocks before saving them to history
  liveBlocksTransactionsMap: SortedMap<number, { transactions: Transaction[], blockHash :string }>
  // start procees, do first block range, then take next availble range
  async startIndexerProcess (startBlock: number, endBlock: number) {
    logger.info('startIndexerProcess')
    let totalStartTime = process.hrtime()
    // function init, try to read the indexer settings from DB
    await this.initIndexSetttings(startBlock, endBlock)
    // index full history
    await this.indexHistory()
    let totalElapsedSeconds = utils.parseHrtimeToSeconds(process.hrtime(totalStartTime))
    logger.info('******************************************************************************')
    logger.info('**    startIndexerProcess history finished, start startLiveIndexerProcess    **')
    logger.info(`**    duration in sec: ${totalElapsedSeconds}                                **`)
    logger.info('******************************************************************************')
    // start indexing live blocks
    if (!this.indexSetttings.lastBlockToIndex) {
      await this.startLiveIndexerProcess()
    }
  }

  private async initIndexSetttings(startBlock: number, lastBlockToIndex: number) : Promise<void> {
    logger.info('initIndexSetttings')
    try {
      this.indexSetttings = await dbUtils.getIndexerSettingsAsync('settingsid')
      if(startBlock != undefined) {
        logger.info(`initIndexSetttings parameters from command line, startBlock: ${startBlock}, lastBlockToIndex: ${lastBlockToIndex} `)        
        this.indexSetttings.startBlock = startBlock
        this.indexSetttings.lastBlock = startBlock
        this.indexSetttings.endBlock += configuration.BlockChunkSize
        // check if chcuk is not out of range 
        let highestBlock = await this.web3.eth.getBlock('pending')
        let highestBlockNumberToIndex = highestBlock.number - configuration.MaxEphemeralForkBlocks
        if (this.indexSetttings.endBlock > highestBlockNumberToIndex) {
          this.indexSetttings.endBlock = highestBlockNumberToIndex
        } 
        // check if chcuk is not out of range 
        if(lastBlockToIndex != undefined && lastBlockToIndex > highestBlockNumberToIndex) {
          this.indexSetttings.lastBlockToIndex = highestBlockNumberToIndex
        }
        // check if index setttings has valid values
        await this.validateIndexSettings()      
        await dbUtils.saveIndexerSettingsAsync(this.indexSetttings)        
      } else {
        logger.info(`initIndexSetttings parameters from db`)        
        if(this.indexSetttings.lastBlock ===  this.indexSetttings.endBlock) {
          logger.info(`initIndexSetttings parameters from db lastBlockNumber ==  endBlockNumber, we need to advance the endblock`)        
          this.indexSetttings.endBlock += configuration.BlockChunkSize
          let highestBlock = await this.web3.eth.getBlock('pending')
          let highestBlockNumberToIndex = highestBlock.number - configuration.MaxEphemeralForkBlocks
          // check if chcuk is not out of range when approaching live blocks
          if (this.indexSetttings.endBlock > highestBlockNumberToIndex) {
            this.indexSetttings.endBlock = highestBlockNumberToIndex
          }        
        }
        await this.validateIndexSettings()            
      } 
    }
    catch (error) {
      // error - first chunk, no settings in db yet, first time indexing
      if (!this.indexSetttings) {
        this.indexSetttings = new IndexerSettings()
        logger.info(`IndexerTransactions init, first chunk, block # 45000 to block # ${configuration.BlockChunkSize}`)
        this.indexSetttings.startBlock = 0 // no transactions before this block, we can index from here
        this.indexSetttings.lastBlock = 0
        this.indexSetttings.endBlock =+ configuration.BlockChunkSize
        await dbUtils.saveIndexerSettingsAsync(this.indexSetttings)
        logger.info(`IndexerTransactions init, index setting created, first start index from ${this.indexSetttings.lastBlock} to ${this.indexSetttings.endBlock}`)
      }
      else {
        logger.error(`init error:, ${error}`)
        throw error;
      }
    }
  }  

  private async validateIndexSettings() : Promise<void> {
    let highestBlock = await this.web3.eth.getBlock('pending')
    let highestBlockNumberToIndex = highestBlock.number - configuration.MaxEphemeralForkBlocks    
    if (this.indexSetttings.startBlock > this.indexSetttings.endBlock ||
        this.indexSetttings.lastBlock > this.indexSetttings.endBlock ||   
        this.indexSetttings.startBlock < 0 ||
        this.indexSetttings.endBlock < 0 ||
        this.indexSetttings.lastBlock < 0) {
          logger.error(`validateIndexSettings failed`)
          throw (new Error('validateIndexSettings - error, abort!'))
    }
    logger.info(`validateIndexSettings OK`)
  }  

  private async indexHistory() : Promise<void>  {
    let highestBlock = await this.web3.eth.getBlock('pending');
    let highestBlockNumberToIndex = highestBlock.number - configuration.MaxEphemeralForkBlocks
    logger.info(`indexHistory start, highestBlockNumber: ${highestBlockNumberToIndex}`)
    
    let done = false
    // for all history blocks, up to the live MaxEphemeralForkBlocks blocks - index in chunks
    try {
      while ((!done && this.indexSetttings.endBlock <= highestBlockNumberToIndex) ||
        (this.indexSetttings.lastBlockToIndex && this.indexSetttings.endBlock < this.indexSetttings.lastBlockToIndex)) {
        let startTime = process.hrtime()
        // index block chunk 
        await this.startIndex(this.indexSetttings.lastBlock, this.indexSetttings.endBlock)
        let elapsedSeconds = utils.parseHrtimeToSeconds(process.hrtime(startTime))
        logger.info(`indexHistory method, ${this.indexSetttings.endBlock - this.indexSetttings.startBlock} blocks, duration in sec: ${elapsedSeconds}`);
        
        // make sure to do last refresh
        dbUtils.refreshViews('refreshDummyAccount', this.indexSetttings.endBlock - 1)         

        // advance to the next block chunk
        this.indexSetttings.startBlock = this.indexSetttings.endBlock
        this.indexSetttings.endBlock += configuration.BlockChunkSize
        logger.info(`indexHistory, indexSetttings: ${JSON.stringify(this.indexSetttings)}`)

        highestBlock = await this.web3.eth.getBlock('pending')
        highestBlockNumberToIndex = highestBlock.number - configuration.MaxEphemeralForkBlocks
        //highestBlockNumber = 4050000 // temp patch for tests
        logger.info(`indexHistory loop, highestBlockNumber: ${highestBlockNumberToIndex}`)

        // check if chcuk is not out of range when approaching live blocks
        if (this.indexSetttings.endBlock > highestBlockNumberToIndex) {
          logger.info(`last indexHistory loop, endBlockNumber > highestBlockNumberToIndex. highestBlockNumberToIndex:  ${highestBlockNumberToIndex}`)
          this.indexSetttings.endBlock = highestBlockNumberToIndex
          await this.startIndex(this.indexSetttings.lastBlock, this.indexSetttings.endBlock)
          done = true  
        }
        // TODO - make sure to handle lastBlockToIndex limitation - currently we can take more, when advancing in BlockChunkSize
      }
      logger.info('*****************************************************************************************************************')
      logger.info(`************ startIndexerProcess finished index history to ,highestBlock: ${highestBlockNumberToIndex} **********`);
      logger.info('*****************************************************************************************************************')
    }
    catch (error) {
      logger.error(`indexHistory error:, ${error}`);
      throw error;
    }
  }

  // take care of the current range, fetch #BlockStep blocks and save
  async startIndex (startBlock: number, endBlock: number) : Promise<void> {
    try {
      logger.info('***********************************************************************')
      logger.info(`startIndex method, startBlock # ${startBlock} to endBlock # ${endBlock - 1}`)
      while (startBlock < endBlock) {
        let start = startBlock
        let end = ((startBlock + configuration.BlockStep) <= endBlock) ? startBlock + configuration.BlockStep : endBlock

        let startTime = process.hrtime()
        await this.indexBlockRangeTransactions(start, end)
        let elapsedSeconds = utils.parseHrtimeToSeconds(process.hrtime(startTime))
        logger.info(`startIndex method, ${configuration.BlockStep} blocks, duration in sec: ${elapsedSeconds}`)

        startBlock += configuration.BlockStep
        if (startBlock >= endBlock) {
          startBlock = endBlock
        }

        this.indexSetttings.lastBlock = end
        await dbUtils.saveIndexerSettingsAsync(this.indexSetttings)
        logger.info('***********************************************************************')
      }
      // make sure to trigger views indexing every 10,000 blocks - only on history indexing.
      // do not wait for this call, let it run at the backgound. Ignore timeouts.
      dbUtils.refreshViews('refreshDummyAccount', endBlock - 1)         
    } catch (error) {
      logger.error(`startIndex error in blocks ${startBlock} - ${endBlock}, abort!`)
      logger.error(error)
      throw (new Error('startIndex - error, abort!'))
    }
  }

  // index by transactions
  async indexBlockRangeTransactions (startBlock: number, endBlock: number) : Promise<void> {
    try {
      let transactions = await blockchainUtils.getBlockTransactionsAsync(startBlock, endBlock)
      if (!transactions) {
        logger.error('blockchainUtils.getBlockTransactionsAsync return null, abort')
        throw (new Error('blockchainUtils.getBlockTransactionsAsync return null, abort.'))
      }
      logger.info(`indexBlockRangeTransactions ${transactions.length} transactions returned from block #${startBlock} to block #${endBlock - 1}.`)
      this.transactionCount += transactions.length
      logger.info(`indexBlockRangeTransactions, total transactions so far in this run ${this.transactionCount}.`)
      await this.saveTransactions(transactions, startBlock, endBlock)
    } catch (error) {
      logger.error(`indexBlockRangeTransactions error in blocks ${startBlock} - ${endBlock - 1}, abort`)
      logger.error( error)
      throw (new Error('indexBlockRangeTransactions - error, abort!'))
    }
  }

  // save transactions in bulks
  async saveTransactions (transactions: any, startBlock: number, endBlock: number) : Promise<void> {
    try {
      while (transactions.length) {
        let transactionsToSave = transactions.splice(0, configuration.LimitTransactionBlukSave)
        try {
          await dbUtils.saveTransactionsBulkAsync(transactionsToSave, startBlock, endBlock)
        } catch (error) {
          logger.error('saveTransactions - error in dbutils while saving transactions, abort')
          logger.error('error', error)
          throw (new Error('saveTransactions - error in dbutils while saving transactions, abort'))
        }
      }
    } catch (error) {
      logger.error(`saveTransactions error, abort`)
      logger.error(error)
      throw (new Error('saveTransactions - error, abort'))
    }
  }

  // method to index incoming blocks
  // always save 12 live blocks to avoid indexing reorg blocks
  // save older blocks
  async startLiveIndexerProcess () : Promise<void> {
    this.indexSetttings = await dbUtils.getIndexerSettingsAsync('settingsid')
    let lastSavedBlock = this.indexSetttings.lastBlock
    let lastHighestBlockNumber = this.indexSetttings.lastBlock
    let highestBlock = await this.web3.eth.getBlock('pending')
    let lastRefreshViewBlock = lastSavedBlock
    // debug patch
    //let lastHighestBlockNumber = highestBlock.number - 3
    //let lastSavedBlock = highestBlock.number - 30

    logger.info(`init startLiveIndexerProcess lastSavedBlock ${lastSavedBlock}`)
    logger.info(`init startLiveIndexerProcess highestBlock.number ${highestBlock.number}`)
    logger.info(`init startLiveIndexerProcess lastHighestBlockNumber ${lastHighestBlockNumber}`)

    if ((lastSavedBlock + 100) < highestBlock.number) {
      logger.error(`startLiveIndexerProcess lastSaveBlock ${lastSavedBlock} + 100 < highestBlock ${highestBlock.number}`)
      logger.error('startLiveIndexerProcess gap is too much, check what went wrong and restart the history indexing')
      throw (new Error('startLiveIndexerProcess gap is too much, check what went wrong and restart the history indexing'))
    }

    let startMapTime = process.hrtime()

    logger.info(`init startLiveIndexerProcess, fetch all blocks, from ${lastSavedBlock} to ${highestBlock.number}`)
    this.liveBlocksTransactionsMap = await blockchainUtils.getBlockTransactionsMapAsync(lastSavedBlock, highestBlock.number)
    logger.info(`init startLiveIndexerProcess, all blocks fetche, from ${lastSavedBlock} to ${highestBlock.number}`)


    let elapsedMapSeconds = utils.parseHrtimeToSeconds(process.hrtime(startMapTime))
    logger.info(`init startLiveIndexerProcess blockchainUtils.getBlockTransactionsMapAsync sec: ${elapsedMapSeconds}`)

    while (true) {
      let startTime = process.hrtime()

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
      this.indexSetttings.lastBlock = lastSavedBlock
      this.indexSetttings.startBlock = lastSavedBlock
      this.indexSetttings.endBlock = lastHighestBlockNumber

      logger.info(`live lastSavedBlock ${lastSavedBlock}`)
      logger.info(`live highestBlock.number ${highestBlock.number}`)

      await dbUtils.saveIndexerSettingsAsync(this.indexSetttings)

      if(lastSavedBlock - lastRefreshViewBlock > 100) {
        // make sure to trigger views indexing every 1000 blocks
        // do not wait for this call, let it run at the backgound. Ignore timeouts.
        dbUtils.refreshViews('refreshLiveDummyAccount', lastSavedBlock)  
        lastRefreshViewBlock = lastSavedBlock
      }
      logger.info(`invoke again in :${nextFetch} sec`)
      await utils.timeout(nextFetch)
    }
  }

  // update the map to hold the last 12 update blocks
  // fetch block headers
  // for every block , check hash, if change, bring block again
  private async updateLiveBlocks (highestBlock: any) : Promise<void> {
    logger.info(`live updateLiveBlocks highestBlock.number ${highestBlock.number}`)

    let changedBlocks = []
    let blockHeaders = await blockchainUtils.getBlockHeadersAsync(highestBlock.number)
    for (let blockIndex = 0; blockIndex < blockHeaders.length; blockIndex++) {
      try {
        let block = blockHeaders[blockIndex]
        if (this.liveBlocksTransactionsMap.has(block.number)) {
          let blockEntry = this.liveBlocksTransactionsMap.get(block.number)
          if (blockEntry.blockHash !== block.hash) {
            logger.info(`live updateLiveBlocks block ${block.number} hash changed, add to changed blocks`)
            changedBlocks.push(block)
          }
        } else {
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
      if (changedBlocks.length > 0) {
        logger.info(`live updateLiveBlocks changedBlocks > 0, bring blocks`)
        for (let blockIndex = 0; blockIndex < changedBlocks.length; blockIndex++) {
          let blockNumber = changedBlocks[blockIndex].number
          // bring full block
          let blockTransactions = await blockchainUtils.getSingleBlockTransactionsAsync(blockNumber)
          if(blockTransactions) {
            logger.info(`live updateLiveBlocks update block ${blockNumber}`)
            this.liveBlocksTransactionsMap.set(blockNumber, {transactions: blockTransactions, blockHash: changedBlocks[blockIndex].hash})
          } else {
            logger.info(`live updateLiveBlocks getSingleBlockTransactionsAsync for ${blockNumber} fail, removing block from list`)
            if (this.liveBlocksTransactionsMap.has(blockNumber)) {
              this.liveBlocksTransactionsMap.delete(blockNumber)            
            }                      
          }
        }
      }
    } catch (error) {
      logger.error(error)
      throw error
    }
  }

  // keep the liveTransactionsMap always in size of MaxEphemeralForkBlocks (12)
  // save old blocks, and remove them from the map
  private async saveAndRemoveHistoryBlocks (highestBlock: any): Promise<number> {
    let blockNumber = highestBlock.number - configuration.MaxEphemeralForkBlocks
    let lastSave = blockNumber
    logger.info(`saveAndRemoveHistoryBlocks highestBlock ${highestBlock.number}`)
    logger.info(`saveAndRemoveHistoryBlocks liveTransactionsMap.length ${this.liveBlocksTransactionsMap.length}`)
    // make sure transactions map contain no more than MaxEphemeralForkBlocks (12)
    while (this.liveBlocksTransactionsMap.length > configuration.MaxEphemeralForkBlocks) {
      try {
        let entry = this.liveBlocksTransactionsMap.get(blockNumber)
        if (entry) {
          logger.info(`saveAndRemoveHistoryBlocks save and remove block ${blockNumber}`)
          await this.saveTransactions(entry.transactions, blockNumber, blockNumber)
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
