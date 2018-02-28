import * as logger from 'winston'
import * as consts from './consts'

var historyDb

export function setHitoryDb (historyDbInstance: string) : void {
  historyDb = historyDbInstance
}


// **************************************************************************
// get accout methods by view according to accout
// **************************************************************************

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

// get account by FROM view from all DBS
export async function getAccountTransactionsBlockRangeAllDBsAsync (account: string, startBlock: number, endBlock: number, limitTransactions: number = 10000) : Promise<Array<any>> {
  // deside on DBs to ask according to block range
  let DB = ["db1", "db2", "db3"]
  // loop on all dbs untill limit reached

  // for each db:
  // get FROM and TO
  // sort
  // slice if limit reached and return
  // if not reached, continue to next DB
  let result = []
  for (let index = 0; index < DB.length; index++) {
    const element = DB[index]
    let resFrom = await getAccountTransactionsBlockRangeAsync(consts.fromDocBlocks, consts.fixedViewName, account, startBlock, endBlock, limitTransactions)
    let resTo = await getAccountTransactionsBlockRangeAsync(consts.fromDocBlocks, consts.fixedViewName, account, startBlock, endBlock, limitTransactions)
    let result = resFrom.concat(resTo)
    // sort results by block number
    result.sort((transactionA, transactionB) => {
      if (transactionA.blockNumber < transactionB.blockNumber){
        return -1;
      }
      if (transactionA.blockNumber > transactionB.blockNumber){
        return 1;
      }
      return 0
    })
    
    if(result.length >= limitTransactions) {
      result = result.splice(0, limitTransactions)      
      return result      
    }
  }
  return result      
}

// get by FROM view
export async function getAccountFromTransactionsBlockRangeAsync (account: string, startBlock: number, endBlock: number, limitTransactions: number = 10000) : Promise<Array<any>> {
  return getAccountTransactionsBlockRangeAsync(consts.fromDocBlocks, consts.fixedViewName, account, startBlock, endBlock, limitTransactions)
}

// get by TO view
export async function getAccountToTransactionsBlockRangeAsync (account: string, startBlock: number, endBlock: number, limitTransactions: number = 10000) : Promise<Array<any>> {
  return getAccountTransactionsBlockRangeAsync(consts.toDocBlocks, consts.fixedViewName, account, startBlock, endBlock, limitTransactions)
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

