import * as consts from '../../../common/consts'
import * as commonDbUtils from '../../../common/commonDbUtils'
import { configuration } from '../config/config'
import { dbHandler } from '../utils/couchdb'
import * as logger from 'winston'


export async function CreateDataBases () : Promise<void> {
  logger.info('creating databases')
//  await initHistoryDB()
  await initDropsDB()
  await initSettingsDB()
}

export async function initDropsDB () : Promise<void> {
  await commonDbUtils.initDB(configuration.DropsDBName)
}

export async function initSettingsDB () : Promise<void> {
  await commonDbUtils.initDB(configuration.SettingDBName)
}
