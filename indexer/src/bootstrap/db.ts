import { configuration } from '../config/config'
import { dbHandler } from '../utils/couchdb'
import { async } from 'async'
import * as logger from 'winston'


export async function CreateDataBases () : Promise<void> {
  logger.info('creating databases')
  await initHistoryDB()
  await initCacheDB()
  await initSettingsDB()
  await addViewsAsync()
}

export async function initHistoryDB () : Promise<void> {
  await initDB(configuration.HistoryDBName)
}

export async function initCacheDB () : Promise<void> {
  await initDB(configuration.CacheDBName)
}

export async function initSettingsDB () : Promise<void> {
  await initDB(configuration.SettingDBName)
}

async function initDB (DBName : string) {
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
            reject(new Error((`error creating database ${DBName}`)))
          }
        })
      }
    })
  })
}


// decalre emit so ts will compile
declare function emit(key: any, value: any): void;

var dbViews = {}
dbViews['to'] = 
{  
  map: function(doc) {
    if (doc.to) {
      emit(doc.to, {_id: doc._id});
    }
  }
}
dbViews['from'] =   
{  
  map: function(doc) {
    if (doc.from) {
      emit(doc.from, {_id: doc._id});
    }
  }
}  
dbViews['blockNumber'] =   
{  
  map: function(doc) {
    if (doc.blockNumber) {
      emit(doc.blockNumber, {_id: doc._id});
    }
  }
} 
dbViews['contractAddress'] =   
{  
  map: function(doc) {
    if (doc.contractAddress) {
      emit(doc.contractAddress, {_id: doc._id});
    }
  }
}  

export async function addViewsAsync () : Promise<void> {
  await addViewAsync('toDoc',dbViews['to'])
  await addViewAsync('fromDoc',dbViews['from'])
  await addViewAsync('blockDoc',dbViews['blockNumber'])
  await addViewAsync('contract',dbViews['contractAddress'])
}

export async function addViewAsync (viewName:string, view: any) : Promise<void> {
  let db = dbHandler.use('supernodedb')
  let designDocName = '_design/' + viewName

  let ddoc = {
    language: 'javascript',
    views: {view}
  };

  return new Promise<void>((resolve, reject) => {
    db.get(designDocName, function (error, existing) {
      if (!error) {
        logger.info(`DB view ${viewName} exist, no need to update, only view adding allowed.`)
        resolve()
      } else {
        db.insert(ddoc, designDocName, function (error, response) {
          if (!error) {
            logger.info(`DB view ${viewName} created`)
            resolve()
          } else {
            logger.log('error', `error creating ${viewName} view`)
            reject(new Error(`error creating ${viewName} view`))
          }
        })
      }
    }) 
  })
}