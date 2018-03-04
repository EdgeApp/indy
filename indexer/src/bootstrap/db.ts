import * as consts from '../../../common/consts'
import * as commonDbUtils from '../../../common/commonDbUtils'
import { configuration } from '../config/config'
import { dbHandler } from '../utils/couchdb'
import * as logger from 'winston'

const Web3 = require('web3')
const web3 = new Web3()
web3.setProvider(configuration.provider)

export async function CreateDataBases () : Promise<void> {
  logger.info('creating databases')

  await initDropsDB()
  await initSettingsDB()

  let highestBlock = await web3.eth.getBlock('pending')
  await commonDbUtils.initAllDBS(highestBlock.number)  
}

export async function initDropsDB () : Promise<void> {
  await commonDbUtils.initDB(configuration.DropsDBName)
}

export async function initSettingsDB () : Promise<void> {
  await commonDbUtils.initDB(configuration.SettingDBName)
}
