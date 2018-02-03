import * as logger from 'winston'
import * as blockchainUtils from '../utils/blockchainUtils'
import * as dbUtils from '../utils/dbUtils'
import * as utils from '../utils/utils'
import { IndexerSettings } from '../indexer/indexerSettings'
import { configuration } from '../config/config'

const Web3 = require('web3')

export class IndexerHistory{
  constructor() {
    this.web3 = new Web3()
    this.web3.setProvider(configuration.provider)  
    this.indexSetttings = new IndexerSettings()
    this.accountCount = 0
  }

  web3: any
  indexSetttings : IndexerSettings
  accountCount : number


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
      highestBlockNumber = 76000 // temp patch

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

  async startIndex (startBlock: number, endBlock: number) : Promise<void> {
    logger.info(`startIndex method, startBlock # ${startBlock} to endBlock # ${endBlock}`)
    while (startBlock < endBlock) {
      let start = startBlock
      let end = ((startBlock + configuration.BlockStep) <= endBlock) ? startBlock + configuration.BlockStep : endBlock
    
      var startTime = process.hrtime();
      await this.indexBlockRange(start, end)
      var elapsedSeconds = utils.parseHrtimeToSeconds(process.hrtime(startTime));
      logger.info(`startIndex method, ${configuration.BlockStep} blocks, duration in sec: ${elapsedSeconds}`)
      
      startBlock += configuration.BlockStep
      if(startBlock >= endBlock)
        startBlock = endBlock

      this.indexSetttings.lastBlockNumber = end
      await dbUtils.saveIndexerSettingsAsync(this.indexSetttings)
    }
  }

  async indexBlockRange (startBlock: number, endBlock: number) : Promise<void> {
    let acccounts = await blockchainUtils.getAccountsAsync(startBlock, endBlock)
    logger.info(`total accounts ${acccounts.size} from block #${startBlock} to block #${endBlock}.`)
    
    configuration.UseBulk ? 
      await dbUtils.saveAccountsBulkAsync(acccounts)
    : await dbUtils.saveAccountsAsync(acccounts)
    
    this.accountCount += acccounts.size
    logger.info(`total accounts so far ${this.accountCount}.`)
  }

  private async Validate() {
    let accounts = await dbUtils.getAllDocsAsync();
    let transactions = new Map<string, boolean>();
    let transactionsCount = 0;
    accounts.forEach(function (doc) {
      // output each document's body
      transactionsCount += doc.doc.transactions.length;
      doc.doc.transactions.forEach(function (tran) {
        if (!transactions.has(tran.hash))
          transactions.set(tran.hash, true);
        else
          logger.info('error', 'duplicated transaction in DB!!!');
      });
    });
    logger.info(`startIndexerProcess history finished, transactions count: ${transactionsCount}`);
  }
}