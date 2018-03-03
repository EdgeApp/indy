import * as yargs from 'yargs'
import * as logger from 'winston'
import * as commonConfiguration from './../../../common/config'
import * as consts from './../../../common/consts'

const web3 = require('web3')
const net = require('net')

export class Config {
  _provider: any
  _ipcProvider: any
  _ipcPath: string
  _useIpc: boolean
  _dBUrl: string

  constructor () {
    this._ipcPath = process.env['HOME'] + consts.ipcPath
    this._ipcProvider = new web3.providers.IpcProvider(this._ipcPath, net)
    this._provider = new web3.providers.HttpProvider(consts.httpProvider)
    this._port = consts.indexerPort
    this._useIpc = true
    this._dBUrl = consts.dBUrl
  }

  _port : number
  readCommandLineArgs (args: yargs.Arguments) : void {
    logger.info(`config readCommandLineArgs start`)   
    try {
      if (args.port) {
        this._port = args.port
        logger.info(`configure port from command line: ${args.port}`)
      }

      if (args.ipc !== undefined) {
        this._useIpc = args.ipc
        logger.info(`configure useIpc from command line: ${args.ipc}`)
      }

      if (args.httpprovider) {
        this._provider = new web3.providers.HttpProvider(args.httpprovider)
        logger.info(`configure httpProvider from command line: ${args.httpprovider}`)
      }

      if (args.dburl) {
        this._dBUrl = args.dburl
        logger.info(`configure DBUrl from command line: ${args.dburl}`)
        commonConfiguration.configuration.DBUrl = args.dburl
      }
      logger.info(`config readCommandLineArgs end`)
    } catch (error) {
      logger.error(`config readCommandLineArgs error, exception message ${error.message}`)
    }
  }

  get useIpc () : boolean { return this._useIpc }
  get provider () {
    return this.useIpc ? this._ipcProvider : this._provider
  }

  get DropsDBName (): string { return consts.dropsDBName }
  get SettingDBName (): string { return consts.settingDBName }
  get DBUrl (): string { return this._dBUrl }
  get Port (): number { return this._port }

  get BlockReqeusts (): number { return 100 }  // parity parallel block requests. can't be larger than blockstep.
  get BlockStep (): number { return 1000 } // number of items to save to db in one time . be carefull in non bulk mode. can't be larger than chunksize
  get BlockChunkSize (): number { return 10000 } // number of blocks that this indexer is taking to work on everytime
  get LimitTransactionBlukSave (): number { return 5000 }
  get LogFileName (): string { return 'supernode-indexer.log' }
  get LogTimeStampConsole (): boolean { return true }
  get MaxEphemeralForkBlocks (): number { return 12 }
 }

export const configuration = new Config()
