import {configuration} from '../config/config'
import {dbHandler} from '../utils/couchdb'
import * as logger from 'winston'

export function CreateDataBases () : void {
  logger.info('creating databases')
  initDB()
  initCacheDB()
}

export function initDB () : void {
  logger.info(`getting database ${configuration.DBName}`)
  dbHandler.db.get(configuration.DBName, (err, body) => {
    if (!err) {
      logger.info(`opening database ${configuration.DBName}`)
      logger.info(body)
    } else {
      dbHandler.db.create(configuration.DBName, (err, body) => {
        if (!err) {
          logger.info(`database ${configuration.DBName} created!`)
        } else {
          logger.info(`error creating database ${configuration.DBName}`)
        }
      })
    }
  })
}

export function initCacheDB () : void {
  logger.info(`getting database ${configuration.CacheDBName}`)
  dbHandler.db.get(configuration.CacheDBName, (err, body) => {
    if (!err) {
      logger.info(`opening database ${configuration.CacheDBName}`)
      logger.info(body)
    } else {
      dbHandler.db.create(configuration.CacheDBName, (err, body) => {
        if (!err) {
          logger.info(`database ${configuration.CacheDBName} created!`)
        } else {
          logger.info(`error creating database ${configuration.CacheDBName}`)
        }
      })
    }
  })
}
