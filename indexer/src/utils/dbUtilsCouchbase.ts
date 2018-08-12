// import * as logger from 'winston'
// import * as utils from '../../../common/utils'
// import * as couchbase from 'couchbase'
// import * as promise from 'bluebird'
// import { Transaction } from '../../../common/models/transaction'

// export enum AccountQuery {
//   ALL,
//   FROM,
//   TO
// }

// export class DbUtils {

//   constructor () {
//     this.indyCluster = new couchbase.Cluster('couchbase://localhost')
//     let transactionsBucket = this.indyCluster.openBucket('indy-transactions-bucket', 'a9760b0a857c554a52b79a7565132a7a')
//     this.transactionsBucketAsync = promise.promisifyAll(transactionsBucket)
//   }

//   indyCluster : couchbase.Cluster
//   transactionsBucketAsync: any

//   // bulk transactions functions
//   async saveTransactionsBulkAsync (transactions: Array<Transaction>, startBlock: number, endBlock: number) : Promise<void> {
//     let totalStartTime = process.hrtime()
//     logger.info(`saveTransactionsBulkAsync saving ${transactions.length} transactions`)

//     let transactionPromises = []
//     for (const transaction of transactions) {
//       transactionPromises.push(this.saveTransactionAsync(transaction))
//     }
//     await Promise.all(transactionPromises)
//     let elapsedSeconds = utils.parseHrtimeToSeconds(process.hrtime(totalStartTime))
//     logger.info(`saveTransactionsBulkAsync done, ${transactions.length} transactions saved, duration in sec: ${elapsedSeconds}`)
//   }

//   // save a single transaction to db
//   async saveTransactionAsync (transaction: Transaction) : Promise<void> {
//     logger.info(`saveTransactionAsync transaction: ${transaction.hash}`)
//     transaction['type'] = 'tx'
//     try {
//       await this.transactionsBucketAsync.insertAsync(transaction.hash, transaction)
//       logger.info(`saveTransactionAsync transaction saved : ${transaction.hash}`)
//     } catch (error) {
//       logger.error(`saveTransactionAsync error saving transction: ${transaction.hash}`)
//       logger.error(`saveTransactionAsync error : ${error}`)
//       throw error
//     }
//   }

//     // indexer settings functions
//   async getIndexerSettingsAsync (indexerDocKey: string) : Promise<any> {
//     logger.info(`getIndexerSettingsAsync fetching settings for # ${indexerDocKey}`)
//     try {
//       let doc = await this.transactionsBucketAsync.getAsync(indexerDocKey)
//       logger.info(`getIndexerSettingsAsync settings for indexer ${indexerDocKey} found, ${JSON.stringify(doc)}`)
//       return doc.value
//     } catch (error) {
//       logger.error(`getIndexerSettingsAsync error fetching settings for indexer ${indexerDocKey}`)
//       logger.error(`getIndexerSettingsAsync error : ${error}`)
//       throw error
//     }
//   }

//   async saveIndexerSettingsAsync (settings: any) : Promise<void> {
//     logger.info(`saveIndexerSettingsAsync saving indexer settings  ${JSON.stringify(settings)}`)
//     const indexerDocKey: string = settings.id
//     settings['type'] = 'settings'
//     try {
//       await this.transactionsBucketAsync.upsertAsync(indexerDocKey, settings)
//       logger.info(`saveIndexerSettingsAsync saved settings for indexer ${indexerDocKey}`)
//     } catch (error) {
//       logger.error(`saveIndexerSettingsAsync error saved settings for indexer ${indexerDocKey}`)
//       logger.error(`saveIndexerSettingsAsync error : ${error}`)
//       throw error
//     }
//   }

//   async saveDropsInfoAsync (dropInfo: any) : Promise<void> {
//     logger.info(`saveDropsInfoAsync saving drops info  ${JSON.stringify(dropInfo)}`)
//     const indexerDocKey: string = dropInfo.id
//     dropInfo['type'] = 'drop'
//     try {
//       await this.transactionsBucketAsync.upsertAsync(indexerDocKey, dropInfo)
//       logger.info(`saveDropsInfoAsync saved drop "${dropInfo.description}" inserted`)
//     } catch (error) {
//       logger.error(`saveDropsInfoAsync error saving drop info for : ${dropInfo.description}, ${error}`)
//       logger.error(`saveDropsInfoAsync error : ${error}`)
//       throw error
//     }
//   }

//   // get account by FROM view from all DBS
//   async getAccountTransactionsAsync (account: string, startBlock: number, endBlock: number, query: AccountQuery = AccountQuery.ALL, limitTransactions: number = 10000) : Promise<Array<any>> {
//     // important! we are working only in lower case - db save all in lowercase
//     let qs = "SELECT * from `transactions_index` WHERE from = '" + utils.toLowerCaseSafe(account) + "';";

//     const q = couchbase.N1qlQuery.fromString(qs)
//     try {
//       let rows = await this.transactionsBucketAsync.queryAsync(q)
//       return rows
//     } catch (error) {
//       throw error
//     }
//   }

// // get CONTRACT account tx by view according to accout on the specific block range - filtering in DB view with double key
//   async getAccountContractTransactionsAsync (account: string, contractAddress: string, startBlock: number, endBlock: number, query: AccountQuery = AccountQuery.ALL, limitTransactions: number = 10000) : Promise<Array<any>> {
//     // important! we are working only in lower case - db save all in lowercase
//     let qs = "SELECT * from `transactions_index` WHERE from = '" + utils.toLowerCaseSafe(account) + "';";

//     const q = couchbase.N1qlQuery.fromString(qs)
//     try {
//       let rows = await this.transactionsBucketAsync.queryAsync(q)
//       return rows
//     } catch (error) {
//       throw error
//     }
//   }

//   async  initDB (DBName : string) {
//     // create indexes here
//   }
// }