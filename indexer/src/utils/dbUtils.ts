import * as logger from 'winston'
import * as utils from '../utils/utils'
import { Account } from '../../../common/models/account'
import { Transaction } from '../../../common/models/transaction'
import { dbHandler } from '../utils/couchdb'
import { configuration } from '../config/config'
import { IndexerSettings } from '../indexer/indexerSettings'

const historyDb = dbHandler.use(configuration.HistoryDBName)
const settingsDb = dbHandler.use(configuration.SettingDBName)

// bulk accounts functions
export async function saveTransactionsBulkAsync (transactions: Array<Transaction>) : Promise<void> {
  let totalStartTime = process.hrtime();
  logger.info(`saving ${transactions.length} transactions`)
  return new Promise<void>(async (resolve, reject) => {
    let accountsList = []
    historyDb.bulk({docs:transactions}, async function(err, body) {
      if(!err) {
        let rejectedTransactions = [] 
        for(let index = 0 ; index < body.length;  index++) {
          if(body[index].hasOwnProperty('error')) {
            rejectedTransactions.push(body[index].id)
          }
      }
      logger.info(JSON.stringify(rejectedTransactions))
      logger.info(`#${rejectedTransactions.length} rejectedTransactions, already exists.`)

      let elapsedSeconds = utils.parseHrtimeToSeconds(process.hrtime(totalStartTime));
      logger.info(`saveTransactionsBulkAsync ${transactions.length} transactions, duration in sec: ${elapsedSeconds}`)                      
      resolve()
      } else {
        reject(new Error(`error saveTransactionsBulkAsync : ${err}`))
      }
    })
  })
}

export async function saveSingleAccountAsync (account: any) : Promise<void> {
  //logger.info(`saving account # ${account.address}`)
  return new Promise<void>((resolve, reject) => {
    historyDb.get(account.address, function (error, existing) {
      if (!error) {
       // logger.info(`account # ${account.address} exist, updating revision`)
        account._rev = existing._rev
        account.transactions = account.transactions.concat(existing.transactions)
      }
      historyDb.insert(account, account.address, function (error, response) {
        if (!error) {
         // logger.info(`account # ${account.address} inserted`)
          resolve()
        } else {
          logger.log('error', `error creating account # ${account.address}, ${error}`)
          reject(new Error(`error creating account # ${account.address}, ${error}`))
        }
      })
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
          logger.log('error',`error creating settings for indexer : ${settings.id}, ${error}`)
          reject(new Error(`error creating settings for indexer : ${settings.id}, ${error}`))
        }
      })
    })
  })
}

// all functions from here are not in use - to be deleted
export async function getAllDocsAsync ( ) : Promise<any> {
  logger.info(`getAllDocsAsync`)
  return new Promise((resolve, reject) => {
    historyDb.list({include_docs: true}, async (error, body) => {
      if (!error) {
        resolve(body.rows)
      } else {
        logger.log('error', 'getAllDocsAsync')
        reject(new Error(`getAllDocsAsync`))
      }
    })
  })
}

// bulk accounts functions
export async function saveAccountsBulkAsync (accounts: Map<string, any>) : Promise<void> {
  let totalStartTime = process.hrtime();
  logger.info(`saving ${accounts.size} accounts`)
  await updateAccountRevisionsBulkAsync(accounts)
  return new Promise<void>(async (resolve, reject) => {
    let accountsList = []
    accounts.forEach(async (value: any, key: string) => {
      value._id = key
      accountsList.push(value)
    })
    historyDb.bulk({docs:accountsList}, async function(err, body) {
      if(!err) {
        let rejectedAccounts = [] 
        for(let index = 0 ; index < body.length;  index++) {
          if(body[index].hasOwnProperty('error')) {
              rejectedAccounts.push(body[index].id)
          }
        }
        logger.info('rejectedAccounts')
        logger.info(JSON.stringify(rejectedAccounts))
        let elapsedSeconds = utils.parseHrtimeToSeconds(process.hrtime(totalStartTime));
        logger.info(`saveAccountsBulkAsync ${accounts.size} accounts, duration in sec: ${elapsedSeconds}`)                      
        resolve()
      } else {
        reject(new Error(`error saveAccountsBulkAsync : ${err}`))
      }
    })
  })
}

export async function updateAccountRevisionsBulkAsync(accounts: any): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let accountsList = []
    accounts.forEach(async (value: any, key: string) => {
      accountsList.push(key)
    })
    historyDb.fetch({ keys: accountsList }, async function (err, revResultList) {
      if (!err) {
        let restAccounts = []
        for (let index = 0; index < revResultList.rows.length; index++) {
          if (revResultList.rows[index].hasOwnProperty('error')) {
            continue
          } else {
            let account = accounts.get(revResultList.rows[index].key)
            account.transactions = account.transactions.concat(revResultList.rows[index].doc.transactions)
            account._rev = revResultList.rows[index].doc._rev
          }
        }
        resolve()
      } else {
        reject(new Error(`error updateAccountRevisionsBulkAsync : ${err}`))
      }
    })
  })
}

// non bulk accounts functions
export async function saveAccountsAsync (accounts: Map<string, Account>) : Promise<void> {
  logger.info(`saving ${accounts.size} accounts`)
  let totalStartTime = process.hrtime();
  logger.info(`saving ${accounts.size} accounts`)  
  let savePromises = []
  accounts.forEach((value: Account, key: string) => {
    savePromises.push(saveSingleAccountAsync(value))
  })
  await Promise.all(savePromises)
  logger.info(`${accounts.size} accounts saved`)
  let elapsedSeconds = utils.parseHrtimeToSeconds(process.hrtime(totalStartTime));
  logger.info(`saveAccountsAsync ${accounts} accounts, duration in sec: ${elapsedSeconds}`)     
}