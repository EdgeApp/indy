import * as logger from 'winston'
import * as blockchainUtils from '../utils/blockchainUtils'
import * as dbUtils from '../utils/dbUtils'
import * as utils from '../utils/utils'
import { IndexerSettings } from '../indexer/indexerSettings'
import { configuration } from '../config/config'
import { Transaction } from '../../../common/models/transaction'


const Web3 = require('web3')

export class IndexerTransactions{
  constructor() {
    this.web3 = new Web3()
    this.web3.setProvider(configuration.provider)  
    this.transactionCount = 0
  }

  web3: any
  indexSetttings : IndexerSettings
  transactionCount : number
  liveTransactionsMap: Map<number, Transaction[]>

  // start procees, do first block range, then take next availble range
  async startIndexerProcess () {
    logger.info('startIndexerProcess')
  
    var totalStartTime = process.hrtime();
    // first time
    try {
      this.indexSetttings = await dbUtils.getIndexerSettingsAsync('settingsid')
      let startTime = process.hrtime();
      let last = this.indexSetttings.lastBlockNumber
      await this.startIndex(this.indexSetttings.lastBlockNumber, this.indexSetttings.endBlockNumber) 
      let elapsedSeconds = utils.parseHrtimeToSeconds(process.hrtime(startTime));
      logger.info(`startIndexerProcess method, ${this.indexSetttings.endBlockNumber - last} blocks, duration in sec: ${elapsedSeconds}`)          
    } catch (error) {
      // first chunk, no settings in db yet
      if(!this.indexSetttings)
      {
        this.indexSetttings = new IndexerSettings()
        logger.info(`startIndexerProcess, first chunk, block # 0 to block # ${configuration.BlockChunkSize}`)
        this.indexSetttings.startBlockNumber = 45000 // no transactions before this block, we can index from here
        this.indexSetttings.lastBlockNumber = 45000
        this.indexSetttings.endBlockNumber = 45000 + configuration.BlockChunkSize
        await dbUtils.saveIndexerSettingsAsync(this.indexSetttings)
        await this.startIndex(this.indexSetttings.startBlockNumber, this.indexSetttings.endBlockNumber) 
      }
      else {
        logger.info(`startIndexerProcess error:, ${error}`)
        throw error
      }
    }
    
    let highestBlock : any
    let highestBlockNumber : number      

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
        logger.log('error','blockchainUtils.getTransactionsRawAsync return null, abort')
        throw(new Error('blockchainUtils.getTransactionsRawAsync return null, abort.'))
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


  liveBlocks

  async startLiveIndexerProcess() {
    this.indexSetttings = await dbUtils.getIndexerSettingsAsync('settingsid')
    let highestBlock = await this.web3.eth.getBlock('pending')
    let liveBlocksNumber = configuration.MaxEphemeralForkBlocks    
    let lastSavedBlock = highestBlock.number - 20 //this.indexSetttings.lastBlockNumber
    let lastHighestBlockNumber = highestBlock.number - 2
    let lastHighestBlockHash = highestBlock.hash
    
    
    logger.info(`init startLiveIndexerProcess lastSavedBlock ${lastSavedBlock}`)
    logger.info(`init startLiveIndexerProcess highestBlock.number ${highestBlock.number}`)
    logger.info(`init startLiveIndexerProcess lastHighestBlockNumber ${lastHighestBlockNumber}`)    

    if((lastSavedBlock + 100) < highestBlock.number)
      return

    var startMapTime = process.hrtime();
    
    this.liveTransactionsMap = await blockchainUtils.getBlockTransactionsMapAsync(lastSavedBlock, highestBlock.number)    
    let elapsedMapSeconds = utils.parseHrtimeToSeconds(process.hrtime(startMapTime))
    logger.info(`init startLiveIndexerProcess blockchainUtils.getBlockTransactionsMapAsync sec: ${elapsedMapSeconds}`)      
    
    while(true) {
      var startTime = process.hrtime();

      logger.info(`*********************************************`)
      logger.info(`*************live start loop*****************`)
      logger.info(`*********************************************`)
      
      highestBlock = await this.web3.eth.getBlock('pending')
      logger.info(`live highestBlock.number ${highestBlock.number}`)

      let numberOfblocksFetch = highestBlock.number - lastHighestBlockNumber
      let numberOfblocksTosave = highestBlock.number - lastSavedBlock - liveBlocksNumber

      // TODO - take care of new block samll than last
      let fetchLastBlockAgain = !numberOfblocksFetch && lastHighestBlockHash != highestBlock.hash
      
      logger.info(`live numberOfblocksFetch ${numberOfblocksFetch}`)
      logger.info(`live numberOfblocksTosave ${numberOfblocksTosave}`)
      logger.info(`live fetchLastBlockAgain (lastet reorg) ${fetchLastBlockAgain}`)
      
      if(numberOfblocksFetch || fetchLastBlockAgain) {
        logger.info(`live new ${numberOfblocksFetch} blocks to fetch`)
        let fetchStart = fetchLastBlockAgain ? lastHighestBlockNumber - 1 : lastHighestBlockNumber
        let newBlocksMap = await blockchainUtils.getBlockTransactionsMapAsync(fetchStart, highestBlock.number)
        logger.info(`live newBlocksMap size ${newBlocksMap.size} result`)
        
        blockchainUtils.updateLiveBlocks(this.liveTransactionsMap, newBlocksMap, lastHighestBlockNumber, highestBlock.number)
        logger.info(`live liveTransactionsMap size ${this.liveTransactionsMap.size} after blocks update`)        
      }      
      // save old blocks, bring new ones
      if(numberOfblocksTosave > 0) {
        // save  the numberOfblocksTosave form the map
        logger.info(`live saveLiveBlocks from ${lastSavedBlock} to ${lastSavedBlock + numberOfblocksTosave}`)        
        await this.saveLiveBlocks(this.liveTransactionsMap, lastSavedBlock, lastSavedBlock + numberOfblocksTosave)
        logger.info(`live liveTransactionsMap size ${this.liveTransactionsMap.size} after saveLiveBlocks`)        
        
        logger.info(`live removeOldBlocks from ${lastSavedBlock} to ${lastSavedBlock + numberOfblocksTosave}`)        
        blockchainUtils.removeOldBlocks(this.liveTransactionsMap, lastSavedBlock, lastSavedBlock + numberOfblocksTosave)
        logger.info(`live liveTransactionsMap size ${this.liveTransactionsMap.size} after saveLiveBlocks`)        

        lastSavedBlock += numberOfblocksTosave + 1
        logger.info(`live lastSavedBlock ${lastSavedBlock}`)
      }

      lastHighestBlockNumber = highestBlock.number
      logger.info(`live lastHighestBlockNumber ${lastHighestBlockNumber}`)

      let elapsedSeconds = utils.parseHrtimeToSeconds(process.hrtime(startTime))
      logger.info(`live update elpase sec: ${elapsedSeconds}`)      
      
      let nextFetch = (15 - elapsedSeconds) * 1000
      
      logger.info(`live update indexSetttings`)      
      this.indexSetttings.lastBlockNumber = lastSavedBlock
      this.indexSetttings.startBlockNumber = lastSavedBlock
      this.indexSetttings.endBlockNumber = lastSavedBlock      
      
      logger.info(`live lastSavedBlock ${lastSavedBlock}`)
      logger.info(`live highestBlock.number ${highestBlock.number}`)
      logger.info(`live lastHighestBlockNumber ${lastHighestBlockNumber}`)  

      await dbUtils.saveIndexerSettingsAsync(this.indexSetttings)

      logger.info(`invoke again in :${nextFetch} sec`)      
      await utils.timeout(nextFetch)

    }
  }  
 
  private async saveLiveBlocks(liveTransactionsMap: Map<number, Transaction[]>, startBlock: number, endBlock: number) {
    for (let blockIndex = startBlock; blockIndex <= endBlock; blockIndex++) {
      try {
        let blockEntry = liveTransactionsMap.get(blockIndex)
        if(!blockEntry)
          logger.error(`error in saveLiveBlocks, blockIndex: ${blockIndex}`)      
        await this.saveTransactions(blockEntry)
      } catch (error) {
        logger.error(error)
        throw error
      }
    }
  }

  private validate(): boolean {
    return true
  }  
}
