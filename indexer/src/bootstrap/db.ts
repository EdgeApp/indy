import {configuration} from '../config/config'
import {dbHandler} from '../utils/couchdb'
import * as logger from 'winston'

export async function CreateDataBases () : Promise<void> {
  logger.info('creating databases')
  await initHistoryDB()
  await initCacheDB()
  await initSettingsDB()
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
