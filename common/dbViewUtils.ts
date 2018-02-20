import * as logger from 'winston'
import * as consts from './consts'

var historyDb

export function setHitoryDb (historyDbInstance: string) : void {
  historyDb = historyDbInstance
}

export async function getAccountContractTransactionsAsync (from: string, contractAddress: string, limitTransactions: number = 10) : Promise<Array<any>> {
  return getAccountTransactionsByContractAsync(consts.contractDoc, consts.fixedViewName, from, contractAddress, limitTransactions)
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
  let promise =  new Promise<Array<any>>(async (resolve, reject) => {
    historyDb.view(doc, view, {keys: [account], include_docs: true, limit: limitTransactions}, function (err, body) {
      if (!err) {
        let result = []
        body.rows.forEach(function (row) {
          delete row.doc._id
          delete row.doc._rev
          result.push(row.doc)
          logger.info(row.doc)
        })
        logger.info(`getAccountTransactionsAsync result count: ${result.length} for address ${account}`)
        resolve(result)
      } else {
        //logger.error(err)
        reject(new Error(`Error reject getAccountTransactionsAsync ${account}`))
      }
    })
  })
  promise.catch((error) => {
    logger.error(`Error getAccountTransactionsAsync ${account}`)
  })
  return promise  
}

export async function getAccountTransactionsByContractAsync (doc: string, view: string, from: string, contractAddress: string, limitTransactions: number = 10) : Promise<Array<any>> {
  
  let promise = new Promise<Array<any>>(async (resolve, reject) => {
    historyDb.view(doc, view, {key: [from, contractAddress], include_docs: true, limit: limitTransactions}, function (err, body) {
      if (!err) {
        let result = []
        body.rows.forEach(function (row) {
          delete row.doc._id
          delete row.doc._rev
          result.push(row.doc)
          logger.info(row.doc)
        })
        logger.info(`getAccountTransactionsByContractAsync result count: ${result.length} for ${contractAddress}`)
        resolve(result)
      } else {
        //logger.error(err)
        reject(new Error(`Error getAccountTransactionsByContractAsync ${contractAddress}`))
      }
    })
  })
  promise.catch((error) => {
    logger.error(`Error getAccountTransactionsByContractAsync ${contractAddress}`)
  })
  return promise
}
