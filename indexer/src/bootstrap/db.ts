import * as consts from '../../../common/consts'
import * as dbViewUtils from '../../../common/dbViewUtils'
import { configuration } from '../config/config'
import { dbHandler } from '../utils/couchdb'
import * as logger from 'winston'

const historyDb = dbHandler.use(configuration.HistoryDBName)

export async function CreateDataBases () : Promise<void> {
  logger.info('creating databases')
  await initHistoryDB()
  await initDropsDB()
  await initSettingsDB()
  
  dbViewUtils.setHitoryDb(historyDb)
  await addViewsAsync()
}

export async function initHistoryDB () : Promise<void> {
  await initDB(configuration.HistoryDBName)
}

export async function initDropsDB () : Promise<void> {
  await initDB(configuration.DropsDBName)
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
 //declare function emit(key: any, value: any): void
declare function emit(key: any, doc: any): void

export async function addViewsAsync () : Promise<void> {
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

  await addViewAsync(consts.toDoc, dbViews[consts.toDoc])
  await addViewAsync(consts.fromDoc, dbViews[consts.fromDoc])
  await addViewAsync(consts.fromDocBlocks, dbViews[consts.fromDocBlocks])
  await addViewAsync(consts.toDocBlocks, dbViews[consts.toDocBlocks])
  
  // we don't need blocks view anymore, but keep it for now  
  //await addViewAsync(consts.blockDoc, dbViews[consts.blockDoc])
  // we don't need contract view anymore, but keep it for now
  //await addViewAsync(consts.contractDoc, dbViews[consts.contractDoc])
}

export async function addViewAsync (viewName:string, view: any) : Promise<void> {
  let db = dbHandler.use(configuration.HistoryDBName)
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
