import * as consts from './consts'


export class Config {
  _dBUrl: string
  _settingsDbName: string
  constructor () {
    this._settingsDbName = consts.settingDBName
    this._dBUrl = consts.dBUrl
  }

  get SettingDBName (): string { return 'supernodesettingsdb' }
  set SettingDBName (dbName: string) { this._settingsDbName = dbName }
  
  get DBUrl (): string { return this._dBUrl }
  set DBUrl (dbUrl: string) { this._dBUrl = dbUrl }
  
 }

export const configuration = new Config()
