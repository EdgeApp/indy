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
  _port : number
  _indexerPort : number
  _indexerUrl : string

  constructor () {
    this._ipcPath = process.env['HOME'] + consts.ipcPath
    this._ipcProvider = new web3.providers.IpcProvider(this._ipcPath, net)
    this._provider = new web3.providers.HttpProvider(consts.httpProvider)
    this._port = consts.restPort
    this._useIpc = true
    this._dBUrl = consts.dBUrl
    this._indexerPort = consts.indexerPort
    this._indexerUrl = 'http://127.0.0.1' + ':' + this._indexerPort
  }

  readCommandLineArgs (args: yargs.Arguments) : void {
    logger.info(`config readCommandLineArgs start`)
    try {
      if (args.port) {
        this._port = args.port
        logger.info(`configure port from command line: ${args.port}`)
      }

      if (args.useIpc !== undefined) {
        this._useIpc = args.useIpc
        logger.info(`configure useIpc from command line: ${args.useIpc}`)
      }

      if (args.httpProvider) {
        this._provider = new web3.providers.HttpProvider(args.httpProvider)
        logger.info(`configure httpProvider from command line: ${args.httpProvider}`)
      }

      if (args.DBUrl) {
        this._dBUrl = args.DBUrl
        logger.info(`configure DBUrl from command line: ${args.DBUrl}`)
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

  get DBUrl (): string { return this._dBUrl }
  get Port (): number { return this._port }
  get LogFileName (): string { return consts.restLogFileName }
  get MaxEphemeralForkBlocks (): number { return consts.maxEphemeralForkBlocks }
}

export const configuration = new Config()
