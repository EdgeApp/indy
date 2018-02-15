import * as logger from 'winston'
import * as utils from '../utils/utils'
import * as consts from '../../../common/consts'
import { Transaction } from '../../../common/models/transaction'
import { dbHandler } from '../utils/couchdb'
import { configuration } from '../config/config'

const historyDb = dbHandler.use(configuration.HistoryDBName)
const settingsDb = dbHandler.use(configuration.SettingDBName)

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
        logger.info(JSON.stringify(rejectedTransactions))
        logger.info(`#${rejectedTransactions.length} rejectedTransactions, already exists.`)

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
  logger.info('****************')
  logger.info('**refreshViews**')
  logger.info('****************')

  getAccountContractTransactionsAsync(account, 'dummy contract address')
  getAccountBlockTransactionsAsync(account)
  getAccountFromTransactionsAsync(account)
  getAccountToTransactionsAsync(account)
}

export async function getAccountContractTransactionsAsync (accountFrom: string, contractAddress: string, limitTransactions: number = 10) : Promise<Array<any>> {
  return getAccountTransactionsByContractAsync(consts.contract, consts.fixedViewName, accountFrom, contractAddress, limitTransactions)
}

export async function getAccountBlockTransactionsAsync (account: string, limitTransactions: number = 10) : Promise<Array<any>> {
  return getAccountTransactionsAsync(consts.blockDoc, consts.fixedViewName, account, limitTransactions)
}

export async function getAccountFromTransactionsAsync (account: string, limitTransactions: number = 10) : Promise<Array<any>> {
  return getAccountTransactionsAsync(consts.fromDoc, consts.fixedViewName, account, limitTransactions)
}

export async function getAccountToTransactionsAsync (account: string, limitTransactions: number = 10) : Promise<Array<any>> {
  return getAccountTransactionsAsync(consts.toDoc, consts.fixedViewName, account, limitTransactions)
}

export async function getAccountTransactionsAsync (doc: string, view: string, account: string, limitTransactions: number = 10) : Promise<Array<any>> {
  return new Promise<Array<any>>(async (resolve, reject) => {
    historyDb.view(doc, view, {keys: [account], include_docs: true, limit: limitTransactions}, function (err, body) {
      if (!err) {
        let result = []
        body.rows.forEach(function (row) {
          delete row.doc._id
          delete row.doc._rev
          result.push(row.doc)
          logger.info(row.doc)
        })
        logger.info(`getAccountTransactionsAsync result count: ${result.length}`)
        resolve(result)
      } else {
        logger.info(err)
        reject(new Error(`Error getAccountTransactionsAsync ${account}`))
      }
    })
  })
}

export async function getAccountTransactionsByContractAsync (doc: string, view: string, account: string, contractAddress: string, limitTransactions: number = 10) : Promise<Array<any>> {
  return new Promise<Array<any>>(async (resolve, reject) => {
    historyDb.view(doc, view, {key: [ account, null, contractAddress ], include_docs: true, limit: limitTransactions}, function (err, body) {
      if (!err) {
        let result = []
        body.rows.forEach(function (row) {
          delete row.doc._id
          delete row.doc._rev
          result.push(row.doc)
          logger.info(row.doc)
        })
        logger.info(`getAccountTransactionsAsync result count: ${result.length}`)
        resolve(result)
      } else {
        logger.info(err)
        reject(new Error(`Error getAccountTransactionsAsync ${account}`))
      }
    })
  })
}
