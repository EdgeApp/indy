import * as logger from 'winston'
import { dbHandler } from '../utils/couchdb'
import { configuration } from '../config/config'

var historyDb = dbHandler.use(configuration.DBName)

export async function getAccountAsync (address: string) : Promise<any> {
  logger.info(`fetching account # ${address}`)
  return new Promise((resolve, reject) => {
    historyDb.get(address, async (error, existing) => {
      if (!error) {
        logger.info(`account # ${address} found, returning`)
        resolve(existing)
      } else {
        logger.info(`error fetching account # ${address}`)
        reject(new Error('account now found'))
      }
    })
  })
}
