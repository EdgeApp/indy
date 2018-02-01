import * as logger from 'winston'
import { Account } from '../../../common/models/account'
import { dbHandler } from '../utils/couchdb'
import { configuration } from '../config/config'
import { IndexerSettings } from '../indexer/indexerSettings'

const historyDb = dbHandler.use(configuration.HistoryDBName)
const settingsDb = dbHandler.use(configuration.SettingDBName)

// TODO - move all to promises
// accounts functions
export async function saveAccountAsync (account: any) : Promise<void> {
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

export async function saveAccountsAsync (accounts: Map<string, Account>) : Promise<void> {
  logger.info(`saving ${accounts.size} accounts`)
  let savePromises = []
  accounts.forEach(async (value: Account, key: string) => {
    savePromises.push(saveAccountAsync(value))
  })
  await Promise.all(savePromises)
  logger.info(`${accounts.size} accounts saved`)
}

// indexer settings functions
export async function saveIndexerSettingsAsync (settings: any) : Promise<void> {
  logger.info(`saving indexer settings  ${JSON.stringify(settings)}`)
  return new Promise<void>((resolve, reject) => {
    settingsDb.get(settings.id, function (error, existing) {
      if (!error) {
        logger.info(`settings for indexer ${settings.id} exist, updating revision`)
        settings._rev = existing._rev
        resolve()
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
