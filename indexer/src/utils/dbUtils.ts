import * as logger from 'winston'
import * as utils from '../utils/utils'
import * as dbViewUtils from '../../../common/dbViewUtils'
import { Transaction } from '../../../common/models/transaction'
import { dbHandler } from '../utils/couchdb'
import { configuration } from '../config/config'

const historyDb = dbHandler.use(configuration.HistoryDBName)
const settingsDb = dbHandler.use(configuration.SettingDBName)
const dropsDb = dbHandler.use(configuration.DropsDBName)

// bulk transactions functions
export async function saveTransactionsBulkAsync (transactions: Array<Transaction>) : Promise<void> {
  let totalStartTime = process.hrtime()
  logger.info(`saving ${transactions.length} transactions`)
  return new Promise<void>(async (resolve, reject) => {
    historyDb.bulk({docs: transactions}, async function (err, body) {
      if (!err) {
        let rejectedTransactions = []
        for (let index = 0; index < body.length; index++) {
          if (body[index].hasOwnProperty('error')) {
            rejectedTransactions.push(body[index].id)
          }
        }
        if(rejectedTransactions.length) {
          logger.info(JSON.stringify(rejectedTransactions))
          logger.info(`${rejectedTransactions.length} rejectedTransactions, already exists in DB.`)
        }
        let elapsedSeconds = utils.parseHrtimeToSeconds(process.hrtime(totalStartTime))
        logger.info(`saveTransactionsBulkAsync ${transactions.length} transactions, duration in sec: ${elapsedSeconds}`)
        resolve()
      } else {
        reject(new Error(`error saveTransactionsBulkAsync : ${err}`))
      }
    })
  })
}

 // indexer settings functions
export async function getIndexerSettingsAsync (indexerID) : Promise<any> {
  logger.info(`fetching settings for # ${indexerID}`)
  return new Promise((resolve, reject) => {
    settingsDb.get(indexerID, async (error, existing) => {
      if (!error) {
        logger.info(`settings for indexer ${indexerID} found, ${JSON.stringify(existing)}`)
        resolve(existing)
      } else {
        logger.log('error', `error fetching settings for indexer ${indexerID}`)
        reject(new Error(`error fetching settings for indexer ${indexerID}`))
      }
    })
  })
}

export async function saveIndexerSettingsAsync (settings: any) : Promise<void> {
  logger.info(`saving indexer settings  ${JSON.stringify(settings)}`)
  return new Promise<void>((resolve, reject) => {
    settingsDb.get(settings.id, function (error, existing) {
      if (!error) {
        logger.info(`settings for indexer ${settings.id} exist, updating revision`)
        settings._rev = existing._rev
      }
      settingsDb.insert(settings, settings.id, function (error, response) {
        if (!error) {
          logger.info(`settings for indexer : ${settings.id} inserted`)
          resolve()
        } else {
          logger.log('error', `error creating settings for indexer : ${settings.id}, ${error}`)
          reject(new Error(`error creating settings for indexer : ${settings.id}, ${error}`))
        }
      })
    })
  })
}

// in couchdb views are created and updated only when the are asked for data.
// call this function to make the views index the data and keep them updated.
export async function refreshViews (account: string) {
  // do not wait for the functions, let them work async
  logger.info('********************************')
  logger.info('**       refreshViews         **')
  logger.info('**   Ignore timeout errors    **')
  logger.info('********************************')

  dbViewUtils.getAccountBlockTransactionsAsync(account).catch((error) => {
    logger.error(`Timeout getAccountBlockTransactionsAsync for refresh view, index in process, ignore error ${account}`)
  })
  dbViewUtils.getAccountFromTransactionsAsync(account).catch((error) => {
    logger.error(`Timeout getAccountBlockTransactionsAsync for refresh view, index in process, ignore error ${account}`)
  })
  dbViewUtils.getAccountToTransactionsAsync(account).catch((error) => {
    logger.error(`Timeout getAccountBlockTransactionsAsync for refresh view, index in process, ignore error ${account}`)
  })
}

export async function saveDropsInfoAsync (dropInfo: any) : Promise<void> {
  logger.info(`saving drops info  ${JSON.stringify(dropInfo)}`)
  return new Promise<void>((resolve, reject) => {
    dropsDb.get(dropInfo._id, function (error, existing) {
      if (!error) {
        logger.info(`info for drop : ${dropInfo._id} exist, updating revision`)
        dropInfo._rev = existing._rev
      }    
      dropsDb.insert(dropInfo, dropInfo._id, function (error, response) {
        if (!error) {
          logger.info(`info for drop "${dropInfo.description}" inserted`)
          resolve()
        } else {
          logger.error(`error creating drop info for : ${dropInfo.description}, ${error}`)
          reject(new Error(`error creating drop info for : ${dropInfo.description}, ${error}`))
        }
      })
    })
  })
}