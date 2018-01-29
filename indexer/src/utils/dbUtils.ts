import * as logger from 'winston'
import { Account } from '../../../common/models/account'
import { dbHandler } from '../utils/couchdb'
import { configuration } from '../config/config'

var historyDb = dbHandler.use(configuration.DBName)

export async function saveAccountAsync (account: any) {
  logger.info(`saving account # ${account.address}`)
  historyDb.get(account.address, function (error, existing) {
    if (!error) {
      logger.info(`account # ${account.address} exist, updating revision`)
      account._rev = existing._rev
    }
    historyDb.insert(account, account.address, function (error, response) {
      if (!error) {
        logger.info(`account # ${account.address} inserted`)
      } else {
        logger.info(`error creating account # ${account.address}`)
      }
    })
  })
}

export async function saveAccountsAsync (accounts: Map<string, Account>) {
  logger.info(`saving ${accounts.size} accounts`)
  let savePromises = []
  accounts.forEach(async (value: Account, key: string) => {
    savePromises.push(await saveAccountAsync(value))
  })
  await Promise.all(savePromises)
  logger.info(`${accounts.size} accounts saved!`)
}
