import * as logger from 'winston'
import * as consts from './consts'
import { dbHandler } from './couchdb'
import { Transaction } from './models/transaction'
import { configuration } from './config'

export enum AccountQuery {
  ALL,
  FROM,
  TO
}

const settingsDb = dbHandler.use(configuration.SettingDBName)

// **********************************************************************************************
// get accout methods by view according to accout on the specific block range filtering in MEMORY
// **********************************************************************************************

// get account by FROM view from all DBS
export async function getAccountTransactionsBlockRangeMemoryAllDBsAsync (account: string, startBlock: number, endBlock: number, query: AccountQuery = AccountQuery.ALL, limitTransactions: number = 10000) : Promise<Array<any>> {
  // loop on all dbs untill limit reached
  let DB = await calcDBNameListForBlockRangeFetch(startBlock, endBlock)

  // for (let index = 0; index < DB.length - 1; index++) {
  //   const dbName = DB[index]
  //   createDbAndViews(dbName)
  // }  
  // for each db:
  // get FROM and TO
  // sort
  // slice if limit reached and return
  // if not reached, continue to next DB

  // TODO - not working good with limit!
  let result = []
  for (let index = 0; index < DB.length; index++) {
    const dbName = DB[index]
    if(query == AccountQuery.ALL) {
      try {
        let resFrom = await getAccountFromTransactionsMemoryAsync(dbName, account, endBlock, limitTransactions)
        let resTo = await getAccountToTransactionsMemoryAsync(dbName, account, endBlock, limitTransactions)
        result = result.concat(resFrom)
        result = result.concat(resTo)
        
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
      } catch (error) {
        
      }

    } else if(query == AccountQuery.FROM) {
      let resFrom = await getAccountFromTransactionsMemoryAsync(dbName, account, endBlock, limitTransactions)
      result = result.concat(resFrom)
      if(result.length >= limitTransactions) {
        result = result.splice(0, limitTransactions)      
        return result      
      }
    } else if(query == AccountQuery.TO) {
      let resTo = await getAccountToTransactionsMemoryAsync(dbName, account, endBlock, limitTransactions)
      result = result.concat(resTo)
      if(result.length >= limitTransactions) {
        result = result.splice(0, limitTransactions)      
        return result      
      }
    }
  }
  return result      
}

export async function getAccountContractTransactionsBlockRangeMemoryAllDBsAsync (account: string, contractAddress: string, startBlock: number, endBlock: number, query: AccountQuery = AccountQuery.ALL, limitTransactions: number = 10000) : Promise<Array<any>> {
  // deside on DBs to ask according to block range
  // let DB = ["supernodedb-0-99999", "supernodedb-100000-199999", "supernodedb-200000-299999", "supernodedb-300000-399999",
  //           "supernodedb-400000-499999", "supernodedb-500000-599999", "supernodedb-600000-699999", "supernodedb-700000-799999",
  //           "supernodedb-800000-899999", "supernodedb-900000-999999"]
  // loop on all dbs untill limit reached
  let DB = await calcDBNameListForBlockRangeFetch(startBlock, endBlock)

  // for each db:
  // get FROM and TO
  // sort
  // slice if limit reached and return
  // if not reached, continue to next DB
  let result = []
  for (let index = 0; index < DB.length; index++) {
    const dbName = DB[index]

    if(query == AccountQuery.ALL) {
      let resFrom = await getAccountFromTransactionsMemoryAsync(dbName, account, endBlock, limitTransactions)
      let resTo = await getAccountToTransactionsMemoryAsync(dbName, account, endBlock, limitTransactions)
      
      let tempFrom = filterContractByBlocksAndLimit(startBlock, endBlock, contractAddress, resFrom, limitTransactions)
      result = result.concat(tempFrom)
      let tempTo = filterContractByBlocksAndLimit(startBlock, endBlock, contractAddress, resTo, limitTransactions)
      result = result.concat(tempTo)
      
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
  }
  return result      
}

// get account by FROM view
export async function getAccountFromTransactionsMemoryAsync (dbName: string, account: string, endBlock: number, limitTransactions: number = 10000) : Promise<Array<any>> {
  logger.info(`getAccountFromTransactionsAsync dbName: ${dbName} for address ${account}, endBlock ${endBlock} `)
  return getAccountTransactionsAsync(dbName, consts.fromDoc, consts.fixedViewName, account, limitTransactions)
}

// get account by TO view
export async function getAccountToTransactionsMemoryAsync (dbName: string, account: string, endBlock: number, limitTransactions: number = 10000) : Promise<Array<any>> {
  logger.info(`getAccountToTransactionsAsync dbName: ${dbName} for address ${account}, endBlock ${endBlock} `)
  return getAccountTransactionsAsync(dbName, consts.toDoc, consts.fixedViewName, account, limitTransactions)
}

// get Account 
async function getAccountTransactionsAsync (dbName: string, doc: string, view: string, account: string, limitTransactions: number) : Promise<Array<any>> {
  let promise =  new Promise<Array<any>>(async (resolve, reject) => {
    let currentDb = dbHandler.use(dbName)        
    currentDb.view(doc, view, {keys: [account], include_docs: true, limit: limitTransactions}, function (err, body) {
      if (!err) {
        let result = []
        body.rows.forEach(function (row) {
          delete row.doc._id
          delete row.doc._rev
          result.push(row.doc)
          //logger.info(row.doc)
        })
        logger.info(`getAccountTransactionsAsync result count: ${result.length} for address ${account}`)
        logger.info('**********************************************************************************')
        resolve(result)
      } else {
        logger.error(err)
        reject(new Error(`Error reject getAccountTransactionsAsync ${account}`))
      }
    })
  })
  promise.catch((error) => {
    logger.error(`Error getAccountTransactionsAsync ${account}`)
  })
  return promise  
}


// *****************************************************************************************************************
// get accout methods by view according to accout on the specific block range - filtering in DB view with double key
// *****************************************************************************************************************

// get account by FROM view from all DBS
export async function getAccountTransactionsBlockRangeAllDBsAsync (account: string, startBlock: number, endBlock: number, query: AccountQuery = AccountQuery.ALL, limitTransactions: number = 10000) : Promise<Array<any>> {
  // deside on DBs to ask according to block range
  // let DB = ["supernodedb-0-99999", "supernodedb-100000-199999", "supernodedb-200000-299999", "supernodedb-300000-399999",
  //           "supernodedb-400000-499999", "supernodedb-500000-599999", "supernodedb-600000-699999", "supernodedb-700000-799999",
  //           "supernodedb-800000-899999", "supernodedb-900000-999999"]
  // loop on all dbs untill limit reached
  let DB = await calcDBNameListForBlockRangeFetch(startBlock, endBlock)
 
  // for each db:
  // get FROM and TO
  // sort
  // slice if limit reached and return
  // if not reached, continue to next DB
  let result = []
  for (let index = 0; index < DB.length; index++) {
    const dbName = DB[index]
    //await addViewsAsync(dbName) TODO - remove this is patch to create views in db
    if(query == AccountQuery.ALL) {
      let resFrom = await getAccountTransactionsBlockRangeAsync(dbName, consts.fromDocBlocks, consts.fixedViewName, account, startBlock, endBlock, limitTransactions)
      let resTo = await getAccountTransactionsBlockRangeAsync(dbName, consts.toDocBlocks, consts.fixedViewName, account, startBlock, endBlock, limitTransactions)
      result = result.concat(resFrom)
      result = result.concat(resTo)
      
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
    } else if(query == AccountQuery.FROM) {
      let resFrom = await getAccountTransactionsBlockRangeAsync(dbName, consts.fromDocBlocks, consts.fixedViewName, account, startBlock, endBlock, limitTransactions)
      result = result.concat(resFrom)
      if(result.length >= limitTransactions) {
        result = result.splice(0, limitTransactions)      
        return result      
      }
    } else if(query == AccountQuery.TO) {
      let resTo = await getAccountTransactionsBlockRangeAsync(dbName, consts.toDocBlocks, consts.fixedViewName, account, startBlock, endBlock, limitTransactions)
      result = result.concat(resTo)
      if(result.length >= limitTransactions) {
        result = result.splice(0, limitTransactions)      
        return result      
      }
    }
  }
  return result      
}

// **********************************************************************************************************************
// get CONTRACT account tx by view according to accout on the specific block range - filtering in DB view with double key
// **********************************************************************************************************************
export async function getAccountContractTransactionsBlockRangeAllDBsAsync (account: string, contractAddress: string, startBlock: number, endBlock: number, query: AccountQuery = AccountQuery.ALL, limitTransactions: number = 10000) : Promise<Array<any>> {
  // deside on DBs to ask according to block range
  // let DB = ["supernodedb-0-99999", "supernodedb-100000-199999", "supernodedb-200000-299999", "supernodedb-300000-399999",
  //           "supernodedb-400000-499999", "supernodedb-500000-599999", "supernodedb-600000-699999", "supernodedb-700000-799999",
  //           "supernodedb-800000-899999", "supernodedb-900000-999999"]
  // loop on all dbs untill limit reached
  let DB = await calcDBNameListForBlockRangeFetch(startBlock, endBlock)

  // for each db:
  // get FROM and TO
  // sort
  // slice if limit reached and return
  // if not reached, continue to next DB
  let result = []
  for (let index = 0; index < DB.length; index++) {
    const dbName = DB[index]

    if(query == AccountQuery.ALL) {
      let resFrom = await getAccountTransactionsBlockRangeAsync(dbName, consts.fromDocBlocks, consts.fixedViewName, account, startBlock, endBlock, limitTransactions)
      let resTo = await getAccountTransactionsBlockRangeAsync(dbName, consts.toDocBlocks, consts.fixedViewName, account, startBlock, endBlock, limitTransactions)
      
      let tempFrom = filterContractByBlocksAndLimit(startBlock, endBlock, contractAddress, resFrom, limitTransactions)
      result = result.concat(tempFrom)
      let tempTo = filterContractByBlocksAndLimit(startBlock, endBlock, contractAddress, resTo, limitTransactions)
      result = result.concat(tempTo)
      
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
  }
  return result      
}

function filterContractByBlocksAndLimit(startBlock: number, endBlock: number, contractAddress : string, resultToFilter: Array<Transaction>, limit: number) {
  let numInserterd = 0;
  let result = []
  for (let index = 0; index < resultToFilter.length && numInserterd < limit; index++) {
    let transaction = resultToFilter[index]
    if ((contractAddress === transaction.to || contractAddress === transaction.contractAddress || contractAddress === transaction.from) 
        && ((startBlock != undefined && endBlock != undefined && 
          (transaction.blockNumber >= startBlock && transaction.blockNumber <= endBlock)) || 
          (startBlock === undefined && endBlock === undefined))) {
      result.push(transaction);
      numInserterd++;
    }
  }
  return result
}

// get account by the specific view, filterd by block range
async function getAccountTransactionsBlockRangeAsync (db: any, doc: string, view: string, account: string, startBlock: number, endBlock: number,limitTransactions: number) : Promise<Array<any>> {

  let params = {startkey: [account, startBlock], endkey: [account, endBlock ,{}], include_docs: true}
  let paramsQueries = {"queries": [params], include_docs: true} // not in use - need to check NANO support
  let promise =  new Promise<Array<any>>(async (resolve, reject) => {
    let currentDb = dbHandler.use(db)        
    currentDb.view(doc, view, params , function (err, body) {    
      if (!err) {
        let result = []
        body.rows.forEach(function (row) {
          delete row.doc._id
          delete row.doc._rev
          result.push(row.doc)
          //logger.info(row.doc)
        })
        logger.info(`getAccountTransactionsBlocksAsync from db: ${db} result count: ${result.length} for address ${account}`)
        resolve(result)
      } else {
        //logger.error(err)
        reject(new Error(`Error reject from db: ${db} getAccountTransactionsBlocksAsync account: ${account}`))
      }
    })
  })
  promise.catch((error) => {
    logger.error(`Error getAccountTransactionsBlocksAsync from db: ${db} account: ${account}`)
  })
  return promise  
}

// ***************
// DB utils
// ***************
export async function initAllDBS (limit: number) {
  let dBList = await getAllPossibleDBRanges(limit)
  for (let index = 0; index < dBList.length; index++) {
    let element = dBList[index]
    let dbName = makeDBName(element)
    await createDbAndViews(dbName)    
  }
}

function makeDBName(element: any) {
  return 'supernodedb-' + element.start.toString() + '-' + element.end.toString()
}

export async function initDB (DBName : string) {
  return new Promise((resolve, reject) => {
    logger.info(`getting database ${DBName}`)
    dbHandler.db.get(DBName, async (err, body) => {
      if (!err) {
        logger.info(`opening database ${DBName}`)
        logger.info(body)
        resolve()
      } else {
        dbHandler.db.create(DBName, (err, body) => {
          if (!err) {
            logger.info(`database ${DBName} created!`)
            resolve()
          } else {
            logger.error(err)
            reject(new Error((`error creating database ${DBName}`)))
          }
        })
      }
    })
  })
}

export async function createDbAndViews(dbName: string) {
  await initDB(dbName)
  await addViewsAsync(dbName)
}

export async function calcDBNameForBlockRange(block) : Promise<string> {
  let allPossibleDBRanges = await getAllPossibleDBRanges(block)
  let dbName: string

  for (let index = 0; index < allPossibleDBRanges.length; index++) {
    let element = allPossibleDBRanges[index]
    if(block >= element.start && block <= element.end) {
      dbName = makeDBName(element)
      logger.info(`calcDBNameForBlockRange dbName: ${dbName} for block ${block}`)
      return dbName
    }
  }  
  logger.error(`calcDBNameForBlockRange didn't find DB name for block ${block}`)
  throw (new Error(`calcDBNameForBlockRange didn't find DB name for block ${block}`))    
 }

 export async function getAllPossibleDBRanges(limit: number) : Promise<Array<any>>{
  let allPossibleDBRanges = []   
  for (let range = 0; range <= limit; range += 100000) {
    allPossibleDBRanges.push({ start: range, end: range + 100000 - 1 })
  }
  return allPossibleDBRanges
}

 export async function calcDBNameListForBlockRangeFetch(startBlock: number, endBlock: number) : Promise<Array<string>> {
  let allPossibleDBRanges = await getAllPossibleDBRanges(endBlock)

  let rangeStartIndex = -1
  for (let index = 0; index < allPossibleDBRanges.length; index++) {
    let element = allPossibleDBRanges[index]
    if(startBlock >= element.start && startBlock < element.end) {
      rangeStartIndex = index
      break
    }
  }

  let rangeEndIndex = -1
  for (let index = 0; index < allPossibleDBRanges.length; index++) {
    let element = allPossibleDBRanges[index]
    if(endBlock >= element.start && endBlock < element.end) {
      rangeEndIndex = index
      break
    }
  }  
  
  if(rangeStartIndex == -1 || rangeEndIndex == -1) {
    logger.error(`Error in calcDBNameListForBlockRangeFetch, startBlock: ${startBlock} endBlock: ${endBlock}, abort`)
    throw (new Error('Error in calcDBNameListForBlockRangeFetch, abort!'))    
  }

  let dbNameList = []
  for (let index = 0; index < allPossibleDBRanges.length; index++) {
    let element = allPossibleDBRanges[index]
    if(index >= rangeStartIndex && index <= rangeEndIndex) {
      let dbName = makeDBName(element)
      logger.info(`calcDBNameListForBlockRangeFetch DB name added to list, dbName: ${dbName}`)
      dbNameList.push(dbName)    
    }
  }  
  return dbNameList
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

// decalre emit so ts will compile
//declare function emit(key: any, value: any): void
declare function emit(key: any, doc: any): void

export async function addViewsAsync (dbName: string) : Promise<void> {
  let dbViews = { }
  dbViews[consts.toDoc] =
  {
    map: function (doc) {
      if (doc.to) {
        emit(doc.to, null)
      }
    }
  }
  dbViews[consts.fromDoc] =
  {
    map: function (doc) {
      if (doc.from) {
        emit(doc.from, null)
      }
    }
  }
  dbViews[consts.fromDocBlocks] =
  {
    map: function (doc) {
      if (doc.from) {
        emit([doc.from, doc.blockNumber], null)
      }
    }
  }
  dbViews[consts.toDocBlocks] =
  {
    map: function (doc) {
      if (doc.to) {
        emit([doc.to, doc.blockNumber], null)
      }
    }
  }

  if(configuration.FilterInMemory) {
  await addViewAsync(dbName, consts.toDoc, dbViews[consts.toDoc])
  await addViewAsync(dbName, consts.fromDoc, dbViews[consts.fromDoc])  
  }  
  
  if(configuration.FilterInDB) {
    await addViewAsync(dbName, consts.fromDocBlocks, dbViews[consts.fromDocBlocks])
    await addViewAsync(dbName, consts.toDocBlocks, dbViews[consts.toDocBlocks])    
  }
}
 
async function addViewAsync (dbName: string, viewName: string, view: any) : Promise<void> {
  let db = dbHandler.use(dbName)
  let designDocName = '_design/' + viewName

  let ddoc = {
    language: 'javascript',
    views: {[consts.fixedViewName]: view}
  }

  return new Promise<void>((resolve, reject) => {
    db.get(designDocName, function (error, existing) {
      if (!error) {
        logger.info(`DB design doc view ${designDocName} exist, no update, only adding allowed.`)
        resolve()
      } else {
        db.insert(ddoc, designDocName, function (error, response) {
          if (!error) {
            logger.info(`DB doc view ${designDocName} created`)
            resolve()
          } else {
            logger.log('error', `error creating doc view ${designDocName}`)
            reject(new Error(`error creating doc view ${designDocName}`))
          }
        })
      }
    })
  })
}


// **************************************************************************************
// refresh accout methods by views  - TODO - only 2 views should left after tests
// **************************************************************************************

// get account by FROM view
export async function refreshAccountFromBlocksTransactionsAsync (account: string, endBlock: number, limitTransactions: number = 10000) : Promise<Array<any>> {
  let dbName = await calcDBNameForBlockRange(endBlock)
  logger.info(`getAccountFromTransactionsAsync dbName: ${dbName} for address ${account}, endBlock ${endBlock} `)
  return getAccountTransactionsAsync(dbName, consts.fromDocBlocks, consts.fixedViewName, account, limitTransactions)
}

// get account by TO view
export async function refreshAccountToBlocksTransactionsAsync (account: string, endBlock: number, limitTransactions: number = 10000) : Promise<Array<any>> {
  let dbName = await calcDBNameForBlockRange(endBlock)
  logger.info(`getAccountToTransactionsAsync dbName: ${dbName} for address ${account}, endBlock ${endBlock} `)
  return getAccountTransactionsAsync(dbName, consts.toDocBlocks, consts.fixedViewName, account, limitTransactions)
}

// get account by FROM view
export async function refreshAccountFromTransactionsAsync (account: string, endBlock: number, limitTransactions: number = 10000) : Promise<Array<any>> {
  let dbName = await calcDBNameForBlockRange(endBlock)
  logger.info(`getAccountFromTransactionsAsync dbName: ${dbName} for address ${account}, endBlock ${endBlock} `)
  return getAccountTransactionsAsync(dbName, consts.fromDoc, consts.fixedViewName, account, limitTransactions)
}

// get account by TO view
export async function refreshAccountToTransactionsAsync (account: string, endBlock: number, limitTransactions: number = 10000) : Promise<Array<any>> {
  let dbName = await calcDBNameForBlockRange(endBlock)
  logger.info(`getAccountToTransactionsAsync dbName: ${dbName} for address ${account}, endBlock ${endBlock} `)
  return getAccountTransactionsAsync(dbName, consts.toDoc, consts.fixedViewName, account, limitTransactions)
}