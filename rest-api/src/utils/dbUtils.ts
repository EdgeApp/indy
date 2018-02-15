import * as logger from 'winston'
import { dbHandler } from '../utils/couchdb'
import { configuration } from '../config/config'
import * as consts from '../../../common/consts'

var historyDb = dbHandler.use(configuration.DBName)

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
    historyDb.view(doc, view, {key: [account, null, contractAddress], include_docs: true, limit: limitTransactions}, function (err, body) {
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
