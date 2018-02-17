import * as dbViewUtils from '../../../common/dbViewUtils'
import * as logger from 'winston'
import { configuration } from '../config/config'
import { dbHandler } from '../utils/couchdb'

const historyDb = dbHandler.use(configuration.DBName)

export function initDB () : void {
  dbViewUtils.setHitoryDb(historyDb)
}
