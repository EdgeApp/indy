import * as logger from 'winston'
import * as consts from './consts'

var historyDb

export function setHitoryDb (historyDbInstance: string) : void {
  historyDb = historyDbInstance
}

// **************************************************************************
// get accout methods by view according to accout
// **************************************************************************

// not in use - only to make the view alive for develoment
export async function getAccountBlockTransactionsAsync (block: string, limitTransactions: number = 10000) : Promise<Array<any>> {
  return getAccountTransactionsAsync(consts.blockDoc, consts.fixedViewName, block, limitTransactions)
}

// get account by FROM view
export async function getAccountFromTransactionsAsync (account: string, limitTransactions: number = 10000) : Promise<Array<any>> {
  return getAccountTransactionsAsync(consts.fromDoc, consts.fixedViewName, account, limitTransactions)
}

// get account by TO view
export async function getAccountToTransactionsAsync (account: string, limitTransactions: number = 10000) : Promise<Array<any>> {
  return getAccountTransactionsAsync(consts.toDoc, consts.fixedViewName, account, limitTransactions)
}

// get Account 
async function getAccountTransactionsAsync (doc: string, view: string, account: string, limitTransactions: number) : Promise<Array<any>> {
  let promise =  new Promise<Array<any>>(async (resolve, reject) => {
    historyDb.view(doc, view, {keys: [account], include_docs: true, limit: limitTransactions}, function (err, body) {
      if (!err) {
        let result = []
        body.rows.forEach(function (row) {
          delete row.doc._id
          delete row.doc._rev
          result.push(row.doc)
          //logger.info(row.doc)
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

// **************************************************************************
// get accout methods by view according to accout on the specific block range
// **************************************************************************

// get by FROM view
export async function getAccountFromTransactionsBlockRangeAsync (account: string, startBlock: number, endBlock: number,limitTransactions: number = 10000) : Promise<Array<any>> {
  return getAccountTransactionsBlockRangeAsync(consts.fromDoc, consts.fixedViewName, account, startBlock, endBlock,limitTransactions)
}

// get by TO view
export async function getAccountToTransactionsBlockRangeAsync (account: string, startBlock: number, endBlock: number,limitTransactions: number = 10000) : Promise<Array<any>> {
  return getAccountTransactionsBlockRangeAsync(consts.toDoc, consts.fixedViewName, account, startBlock, endBlock,limitTransactions)
}

// get account by the specific view, filterd by block range
async function getAccountTransactionsBlockRangeAsync (doc: string, view: string, account: string, startBlock: number, endBlock: number,limitTransactions: number) : Promise<Array<any>> {

  let params = {startkey: [account, startBlock], endkey: [account, endBlock ,{}], include_docs: true}
  let paramsQueries = {"queries": [params], include_docs: true} // not in use - need to check NANO support
  let promise =  new Promise<Array<any>>(async (resolve, reject) => {
    historyDb.view(doc, view, params , function (err, body) {    
      if (!err) {
        let result = []
        body.rows.forEach(function (row) {
          delete row.doc._id
          delete row.doc._rev
          result.push(row.doc)
          //logger.info(row.doc)
        })
        logger.info(`getAccountTransactionsBlocksAsync result count: ${result.length} for address ${account}`)
        resolve(result)
      } else {
        //logger.error(err)
        reject(new Error(`Error reject getAccountTransactionsBlocksAsync ${account}`))
      }
    })
  })
  promise.catch((error) => {
    logger.error(`Error getAccountTransactionsBlocksAsync ${account}`)
  })
  return promise  
}

// old, not in use, should be removed
export async function getAccountContractTransactionsAsync (from: string, contractAddress: string, limitTransactions: number = 10000) : Promise<Array<any>> {
  return getAccountTransactionsByContractAsync(consts.contractDoc, consts.fixedViewName, from, contractAddress, limitTransactions)
}

export async function getAccountTransactionsByContractAsync (doc: string, view: string, from: string, contractAddress: string, limitTransactions: number) : Promise<Array<any>> {
  
  let promise = new Promise<Array<any>>(async (resolve, reject) => {
    historyDb.view(doc, view, {key: [from, contractAddress], include_docs: true, limit: limitTransactions}, function (err, body) {
      if (!err) {
        let result = []
        body.rows.forEach(function (row) {
          delete row.doc._id
          delete row.doc._rev
          result.push(row.doc)
          //logger.info(row.doc)
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
