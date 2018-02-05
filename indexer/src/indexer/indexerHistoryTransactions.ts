import * as logger from 'winston'
import * as blockchainUtils from '../utils/blockchainUtils'
import * as dbUtils from '../utils/dbUtils'
import * as utils from '../utils/utils'
import { IndexerSettings } from '../indexer/indexerSettings'
import { configuration } from '../config/config'

const Web3 = require('web3')

export class IndexerHistoryTransactions{
  constructor() {
    this.web3 = new Web3()
    this.web3.setProvider(configuration.provider)  
    this.indexSetttings = new IndexerSettings()
    this.transactionCount = 0
  }

  web3: any
  indexSetttings : IndexerSettings
  transactionCount : number

  // start procees, do first block range, then take next availble range
  async startIndexerProcess () {
    logger.info('startIndexerProcess')
  
    var totalStartTime = process.hrtime();
    // first time
    try {
      this.indexSetttings = await dbUtils.getIndexerSettingsAsync(this.indexSetttings.id)
      let startTime = process.hrtime();
      let last = this.indexSetttings.lastBlockNumber
      await this.startIndex(this.indexSetttings.lastBlockNumber, this.indexSetttings.endBlockNumber) 
      let elapsedSeconds = utils.parseHrtimeToSeconds(process.hrtime(startTime));
      logger.info(`startIndexerProcess method, ${this.indexSetttings.endBlockNumber - last} blocks, duration in sec: ${elapsedSeconds}`)          
    } catch (error) {
      // first chunk, no settings in db yet
      logger.info(`startIndexerProcess, first chunk, block # 0 to block # ${configuration.BlockChunkSize}`)
      this.indexSetttings.startBlockNumber = 46000 // no transactions before this block, we can index from here
      this.indexSetttings.lastBlockNumber = 46000
      this.indexSetttings.endBlockNumber = 46000 + configuration.BlockChunkSize
      await dbUtils.saveIndexerSettingsAsync(this.indexSetttings)
      await this.startIndex(this.indexSetttings.startBlockNumber, this.indexSetttings.endBlockNumber) 
    }
    
    let highestBlock : any
    let highestBlockNumber : number      

    do {      
      highestBlock = await this.web3.eth.getBlock('pending')
      highestBlockNumber = highestBlock.number - configuration.MaxEphemeralForkBlocks
      //highestBlockNumber = 4050000 // temp patch for tests
      logger.info(`startIndexerProcess, highstBlock: ${highestBlockNumber}`)

      this.indexSetttings.startBlockNumber = this.indexSetttings.endBlockNumber 
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
    
    await this.Validate();      
  }

  // take care of the current range, fetch #BlockStep blocks and save 
  async startIndex (startBlock: number, endBlock: number) : Promise<void> {
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
  }

  async indexBlockRangeTransactions (startBlock: number, endBlock: number) : Promise<void> {
    let transactions = await blockchainUtils.getBlockTransactionsAsync(startBlock, endBlock)
    if(!transactions) {
      logger.log('error','blockchainUtils.getTransactionsRawAsync return null, abort!')
      throw(new Error('blockchainUtils.getTransactionsRawAsync return null, abort.'))
    }
    logger.info(`indexBlockRangeTransactions transactions res from blockchain ${transactions.length} from block #${startBlock} to block #${endBlock}.`)
    while (transactions.length)
    {
      let transactionsToSave = transactions.splice(0, configuration.LimitTransactionBlukSave)
      try {
        await dbUtils.saveTransactionsBulkAsync(transactionsToSave)
      } catch (error) {
        logger.log('error','error in dbutils while saving transactions, abort!')
        logger.log('error',error)
        throw(new Error('error in dbutils while saving transactions, abort!'))      
      }
    }
    this.transactionCount += transactions.length
    logger.info(`indexBlockRangeTransactions, total transactions so far in this run ${this.transactionCount}.`)
  }

  private async Validate() {
    let transactions = await dbUtils.getAllDocsAsync();
    logger.info(`startIndexerTransactiosProcess history finished, transactions count: ${transactions.length}`);
  }  
}
