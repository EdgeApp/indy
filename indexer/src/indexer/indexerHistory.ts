import * as logger from 'winston'
import * as blockchainUtils from '../utils/blockchainUtils'
import * as dbUtils from '../utils/dbUtils'
import { IndexerSettings } from '../indexer/indexerSettings'
import { configuration } from '../config/config'

const Web3 = require('web3')

export class IndexerHistory{
  constructor() {
    this.web3 = new Web3()
    this.web3.setProvider(configuration.provider)  
    this.indexSetttings = new IndexerSettings()
  }

  web3: any
  indexSetttings : IndexerSettings

  async startIndexerProcess () {
    logger.info('startIndexerProcess')

    let highestBlock : any
    let highestBlockNumber : number

    do {
      try {
        this.indexSetttings = await dbUtils.getIndexerSettingsAsync(this.indexSetttings.id)
        await this.startIndex(this.indexSetttings.lastBlockNumber, this.indexSetttings.endBlockNumber) 
      } catch (error) {
        // first chunk, no settings in db yet
        logger.info(`startIndexerProcess, first chunk, block # 0 to block # ${configuration.BlockChunkSize}`)
        this.indexSetttings.startBlockNumber = 46147 // no transactions before this block, we can index from here
        this.indexSetttings.endBlockNumber = 99000  

        await dbUtils.saveIndexerSettingsAsync(this.indexSetttings)
        await this.startIndex(this.indexSetttings.startBlockNumber, this.indexSetttings.endBlockNumber) 
      }

      highestBlock = await this.web3.eth.getBlock('pending')
      highestBlockNumber = highestBlock.number - configuration.MaxEphemeralForkBlocks
      logger.info(`startIndexerProcess, highstBlock: ${highestBlockNumber}`)
      
      this.indexSetttings.startBlockNumber = this.indexSetttings.endBlockNumber + 1
      this.indexSetttings.lastBlockNumber = this.indexSetttings.startBlockNumber
      this.indexSetttings.endBlockNumber += configuration.BlockChunkSize
      if(this.indexSetttings.endBlockNumber > highestBlockNumber)
        this.indexSetttings.endBlockNumber = highestBlockNumber

      logger.info(`startIndexerProcess, indexSetttings: ${JSON.stringify(this.indexSetttings)}`)
        

      await dbUtils.saveIndexerSettingsAsync(this.indexSetttings)
    } while(this.indexSetttings.endBlockNumber <= highestBlockNumber)
  }

  async startIndex (startBlock: number, endBlock: number) : Promise<void> {
    logger.info(`startIndex method, startBlock # ${startBlock} to endBlock # ${endBlock}`)
    while (startBlock <= endBlock) {
      let start = startBlock
      let end = ((startBlock + configuration.BlockStep) <= endBlock) ? startBlock + configuration.BlockStep : endBlock
      await this.indexBlockRange(start, end)
      startBlock += configuration.BlockStep
      this.indexSetttings.lastBlockNumber = end
      await dbUtils.saveIndexerSettingsAsync(this.indexSetttings)
    }
  }

  async indexBlockRange (startBlock: number, endBlock: number) : Promise<void> {
    let acccounts = await blockchainUtils.getAccountsAsync(startBlock, endBlock)
    logger.info(`total accounts ${acccounts.size} from block #${startBlock} to block #${endBlock}.`)
    await dbUtils.saveAccountsAsync(acccounts)
  }

}