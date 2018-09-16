import * as logger from 'winston'
import * as utils from './utils'
import * as couchbase from 'couchbase'
import * as promise from 'bluebird'
import { Transaction } from './models/transaction'
import { configuration } from './config'

export enum AccountQuery {
  ALL,
  FROM,
  TO
}

export class DbUtils {

  constructor () {
    this.indyCluster = new couchbase.Cluster(configuration.DBUrl)
    let transactionsBucket = this.indyCluster.openBucket(configuration.BucketName, configuration.BucketPassword)
    let transactionsLiveBucket = this.indyCluster.openBucket(configuration.LiveBucketName, configuration.LiveBucketPassword)

    transactionsBucket.operationTimeout = 120 * 1000
    transactionsLiveBucket.operationTimeout = 120 * 1000

    this.transactionsBucketAsync = promise.promisifyAll(transactionsBucket)
    this.transactionsLiveBucketAsync = promise.promisifyAll(transactionsLiveBucket)

  }

  indyCluster : couchbase.Cluster
  transactionsBucketAsync: any
  transactionsLiveBucketAsync: any

  // bulk transactions functions
  async saveTransactionsBulkAsync (transactions: Array<Transaction>) : Promise<void> {
    let totalStartTime = process.hrtime()
    logger.info(`saveTransactionsBulkAsync saving ${transactions.length} transactions`)

    let transactionPromises = []
    for (const transaction of transactions) {
      transactionPromises.push(this.saveTransactionAsync(transaction))
    }
    await Promise.all(transactionPromises)
    let elapsedSeconds = utils.parseHrtimeToSeconds(process.hrtime(totalStartTime))
    logger.info(`saveTransactionsBulkAsync done, ${transactions.length} transactions saved, duration in sec: ${elapsedSeconds}`)
    await utils.timeout(3000)
  }

  // save a single transaction to db
  async saveTransactionAsync (transaction: Transaction) : Promise<void> {
    // logger.info(`saveTransactionAsync transaction: ${transaction.hash}`)
    const indexerDocKey: string = `tx:${transaction.hash}`
    transaction['type'] = 'tx'
    try {
      await this.transactionsBucketAsync.upsertAsync(indexerDocKey, transaction)
      // logger.info(`saveTransactionAsync transaction saved : ${indexerDocKey}`)
    } catch (error) {
      logger.error(`saveTransactionAsync error saving transction: ${indexerDocKey}`)
      logger.error(`saveTransactionAsync error : ${error}`)
      throw error
    }
  }


    // indexer settings functions
  async getIndexerSettingsAsync (indexerDocKey: string) : Promise<any> {
    let indexerDocKeyFull: string = 'settings:' + indexerDocKey
    logger.info(`getIndexerSettingsAsync fetching settings for # ${indexerDocKeyFull}`)
    try {
      let doc = await this.transactionsBucketAsync.getAsync(indexerDocKeyFull)
      logger.info(`getIndexerSettingsAsync settings for indexer ${indexerDocKeyFull} found, ${JSON.stringify(doc)}`)
      return doc.value
    } catch (error) {
      logger.error(`getIndexerSettingsAsync error fetching settings for indexer ${indexerDocKeyFull}`)  
      logger.error(`getIndexerSettingsAsync error : ${error}`)
      throw error
    }
  }

  async saveIndexerSettingsAsync (settings: any) : Promise<void> {
    logger.info(`saveIndexerSettingsAsync saving indexer settings  ${JSON.stringify(settings)}`)
    const indexerDocKey: string = `settings:${settings.id}`
    settings['type'] = 'settings'
    try {
      await this.transactionsBucketAsync.upsertAsync(indexerDocKey, settings)
      logger.info(`saveIndexerSettingsAsync saved settings for indexer ${indexerDocKey}`)
    } catch (error) {
      logger.error(`saveIndexerSettingsAsync error saved settings for indexer ${indexerDocKey}`)
      logger.error(`saveIndexerSettingsAsync error : ${error}`)
      throw error
    }
  }

  async saveDropsInfoAsync (dropInfo: any) : Promise<void> {
    logger.info(`saveDropsInfoAsync saving drops info  ${JSON.stringify(dropInfo)}`)
    const indexerDocKey: string = `drop:${dropInfo.id}`
    dropInfo['type'] = 'drop'
    try {
      await this.transactionsBucketAsync.upsertAsync(indexerDocKey, dropInfo)
      logger.info(`saveDropsInfoAsync saved drop "${dropInfo.description}" inserted`)
    } catch (error) {
      logger.error(`saveDropsInfoAsync error saving drop info for : ${dropInfo.description}, ${error}`)
      logger.error(`saveDropsInfoAsync error : ${error}`)
      throw error
    }
  }

  // get account transactions
  async getAccountTransactionsAsync (accountAddress: string, startBlock: number, endBlock: number, queryType: AccountQuery = AccountQuery.ALL, limit: number = 10000) : Promise<Array<any>> {

    // important! we are working only in lower case - db save all in lowercase
    let account: string = utils.toLowerCaseSafe(accountAddress)
    let queryString: string = "SELECT `indy-transactions-bucket`.* from `indy-transactions-bucket` WHERE"
    switch (queryType) {
      case AccountQuery.ALL:
        queryString += "(`from` = '" + account + "' OR `to` = '" + account + "') AND (`blockNumber` >= " + startBlock + "AND `blockNumber` <=" + endBlock + ") LIMIT " + limit + ";"
      break

      case AccountQuery.FROM:
        queryString += "`from` = '" + account + "' AND (`blockNumber` >= " + startBlock + "AND `blockNumber` <=" + endBlock + ") LIMIT " + limit + ";"
      break

      case AccountQuery.TO:
      queryString += "`to` = '" + account + "' AND (`blockNumber` >= " + startBlock + "AND `blockNumber` <=" + endBlock + ") LIMIT " + limit + ";"
      break
    }

    const query = couchbase.N1qlQuery.fromString(queryString)
    try {
      let rows = await this.transactionsBucketAsync.queryAsync(query)
      return rows
    } catch (error) {
      throw error
    }
  }

// get CONTRACT account tx
  async getAccountContractTransactionsAsync (accountAddress: string, contractAddress: string, startBlock: number, endBlock: number, queryType: AccountQuery = AccountQuery.ALL, limit: number = 10000) : Promise<Array<any>> {
    // important! we are working only in lower case - db save all in lowercase
    let account: string = utils.toLowerCaseSafe(accountAddress)
    let contract: string = utils.toLowerCaseSafe(contractAddress)

    // TODO: add LIMIT to query
    let queryString: string = "SELECT `indy-transactions-bucket`.* from `indy-transactions-bucket` WHERE"
    switch (queryType) {
      case AccountQuery.ALL:
        queryString += "(`from` = '" + account + "' OR `to` = '" + account + "' OR `destination` = '" + account + "')"
        queryString += "AND (`from` = '" + contractAddress + "' OR `to` ='" + contractAddress + "' OR `destination` = '" + contractAddress + "')"
        queryString += "AND (`blockNumber` >= " + startBlock + "AND `blockNumber` <=" + endBlock + ") LIMIT " + limit + ";"
      break

      case AccountQuery.FROM:
        queryString += "(`from` = '" + account + "')"
        queryString += "AND (`to` ='" + contractAddress + "' OR `destination` = '" + contractAddress + "')"
        queryString += "AND (`blockNumber` >= " + startBlock + "AND `blockNumber` <=" + endBlock + ") LIMIT " + limit + ";"
      break

      case AccountQuery.TO:
        queryString += "(`to` = '" + account + "')"
        queryString += "AND (`from` = '" + contractAddress + "' OR `destination` = '" + contractAddress + "')"
        queryString += "AND (`blockNumber` >= " + startBlock + "AND `blockNumber` <=" + endBlock + ") LIMIT " + limit + ";"
      break
    }

    const query = couchbase.N1qlQuery.fromString(queryString)
    try {
      let rows = await this.transactionsBucketAsync.queryAsync(query)
      return rows
    } catch (error) {
      throw error
    }
  }

  // live methods
  // save a single transaction to db
  async saveLiveBlockAsync (block: any) : Promise<void> {
    logger.info(`saveLiveBlockAsync block number: ${block.number}, hash: ${block.hash}`)
    const indexerDocKey: string = `block:${block.number}`
    block['type'] = 'block'
    try {
      await this.transactionsLiveBucketAsync.upsertAsync(indexerDocKey, block)
      logger.info(`saveLiveBlockAsync block saved : ${indexerDocKey}`)
    } catch (error) {
      logger.error(`saveLiveBlockAsync error saving block: ${indexerDocKey}`)
      logger.error(`saveLiveBlockAsync error : ${error}`)
      throw error
    }
  }
  // save a single transaction to db
  async deleteLiveBlockAsync (block: any) : Promise<void> {
    logger.info(`deleteLiveBlockAsync block number: ${block.number}, hash: ${block.hash}`)
    const indexerDocKey: string = `block:${block.number}`
    block['type'] = 'block'
    try {
      await this.transactionsLiveBucketAsync.removeAsync(indexerDocKey)
      logger.info(`deleteLiveBlockAsync block done : ${indexerDocKey}`)
    } catch (error) {
      logger.error(`deleteLiveBlockAsync error remove block: ${indexerDocKey}`)
      logger.error(`deleteLiveBlockAsync error : ${error}`)
      throw error
    }
  }

  // get live block
  async getLiveBlockAsync (blockNumber: number) : Promise<any> {
    logger.info(`getLiveBlockAsync block : ${blockNumber}`)
    try {
      let doc = await this.transactionsLiveBucketAsync.getAsync(`block:${blockNumber}`)
      return doc
    } catch (error) {
      throw error
    }
  }

  // get live block count
  async getLiveBlockCountAsync () : Promise<any> {
    // important! we are working only in lower case - db save all in lowercase
    let queryString: string = "SELECT COUNT(*) from `indy-live-bucket`"
    const query = couchbase.N1qlQuery.fromString(queryString)
    try {
      let rows = await this.transactionsLiveBucketAsync.queryAsync(query)
      return rows[0]
    } catch (error) {
      throw error
    }
  }

  async  initDB () {
    // create indexes here
  }
}

export const dbUtils = new DbUtils()