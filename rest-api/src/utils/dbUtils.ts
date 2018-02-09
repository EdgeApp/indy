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


export async function getAccountFromTransactionsAsync (account: string, limitTransactions: number = 10) : Promise<Array<any>> {
  return await getAccountTransactionsAsync("fromAccountView", account, limitTransactions)
}

export async function getAccountToTransactionsAsync (account: string, limitTransactions: number = 10) : Promise<Array<any>> {
  return await getAccountTransactionsAsync("toAccountView", account, limitTransactions)
}

export async function getAccountTransactionsAsync (view: string, account: string, limitTransactions: number = 10) : Promise<Array<any>> {
  return new Promise<Array<any>>(async (resolve, reject) => {
    historyDb.view('designDoc', view, {keys: [account], include_docs: true, limit:limitTransactions}, function(err, body) {  
      if (!err) {
        let result = []
        body.rows.forEach(function(row) {
          delete row.doc._id
          delete row.doc._rev
          result.push(row.doc)
          logger.info(row.doc)
        })
        logger.info(`getAccountTransactionsAsync result count: ${result.length}`)
        resolve(result)
      } else {
        logger.info(err);
        reject(new Error(`Error getAccountTransactionsAsync ${account}`))
      }
    })
  })
}